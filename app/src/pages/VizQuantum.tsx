import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Eye,
  BarChart3,
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

/* ─────────────────────── TYPES ─────────────────────── */

interface TunnelingParticle {
  id: number
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  hasTunneled: boolean
  trail: THREE.Vector3[]
}

/* ─────────────────────── CONSTANTS ─────────────────────── */

const H_BAR = 1.054e-34 // Reduced Planck's constant (normalized for display)
const M_E = 9.109e-31 // Electron mass (normalized)

/* ─────────────────────── TUNNELING CALCULATIONS ─────────────────────── */

function calculateTunnelingProbability(
  barrierHeight: number,
  barrierWidth: number,
  particleEnergy: number
): number {
  // Simplified quantum tunneling probability
  // T ~ exp(-2 * kappa * L) where kappa = sqrt(2*m*(V0-E)) / hbar
  if (particleEnergy >= barrierHeight) {
    // Above barrier: transmission dominated by reflection
    return 0.95 * (particleEnergy / (particleEnergy + barrierHeight))
  }
  const kappa = Math.sqrt(2 * M_E * (barrierHeight - particleEnergy)) / (H_BAR * 1e18)
  const normalizedKappa = Math.min(kappa * barrierWidth * 1e-9, 30) // Prevent underflow
  return Math.exp(-2 * normalizedKappa) * 100 // Return as percentage
}

/* ─────────────────────── POTENTIAL BARRIER ─────────────────────── */

function PotentialBarrier({
  height,
  width,
  pulseTime,
}: {
  height: number
  width: number
  pulseTime: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null)
  const targetScaleY = height / 5 // Scale for visual

  useFrame(() => {
    if (meshRef.current) {
      // Smooth height transition
      meshRef.current.scale.y +=
        (targetScaleY - meshRef.current.scale.y) * 0.1
    }
    if (materialRef.current && pulseTime > 0) {
      const elapsed = (Date.now() - pulseTime) / 1000
      if (elapsed < 0.3) {
        const pulse = 1 + Math.sin(elapsed * Math.PI * 3) * 0.05
        meshRef.current!.scale.x = (width / 2) * pulse
        meshRef.current!.scale.z = 4 * pulse
        materialRef.current.emissiveIntensity =
          0.3 * (1 - elapsed / 0.3)
      } else {
        meshRef.current!.scale.x = width / 2
        meshRef.current!.scale.z = 4
        materialRef.current.emissiveIntensity = 0.05
      }
    }
  })

  return (
    <group>
      {/* Main barrier */}
      <mesh
        ref={meshRef}
        position={[0, targetScaleY / 2, 0]}
        scale={[width / 2, targetScaleY, 4]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          ref={materialRef}
          color="#06B6D4"
          transparent
          opacity={0.2}
          roughness={0.1}
          metalness={0.3}
          transmission={0.4}
          thickness={0.5}
          emissive="#06B6D4"
          emissiveIntensity={0.05}
        />
      </mesh>

      {/* Barrier glow edges */}
      <mesh position={[0, targetScaleY / 2, 0]} scale={[width / 2 + 0.05, targetScaleY + 0.05, 4.05]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.08} wireframe />
      </mesh>

      {/* Top edge highlight */}
      <mesh position={[0, targetScaleY, 0]} scale={[width / 2, 0.05, 4]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#06B6D4" transparent opacity={0.4} />
      </mesh>

      {/* Labels */}
      <Text
        position={[-6, 0.5, 0]}
        fontSize={0.25}
        color="#64748B"
        anchorX="center"
        anchorY="bottom"
      >
        Region I (Incident)
      </Text>
      <Text
        position={[0, targetScaleY + 0.4, 0]}
        fontSize={0.2}
        color="#06B6D4"
        anchorX="center"
        anchorY="bottom"
      >
        Barrier (V₀ = {height.toFixed(1)} eV)
      </Text>
      <Text
        position={[6, 0.5, 0]}
        fontSize={0.25}
        color="#64748B"
        anchorX="center"
        anchorY="bottom"
      >
        Region III (Transmitted)
      </Text>
    </group>
  )
}

/* ─────────────────────── PROBABILITY WAVE ─────────────────────── */

function ProbabilityWave({
  barrierHeight,
  barrierWidth,
  particleEnergy,
  viewMode,
  isPlaying,
}: {
  barrierHeight: number
  barrierWidth: number
  particleEnergy: number
  viewMode: 'probability' | 'real'
  isPlaying: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)
  const timeRef = useRef(0)

  const waveGeometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(18, 5, 200, 1)
    return geo
  }, [])

  useFrame((_, delta) => {
    if (!isPlaying) return
    timeRef.current += delta * particleEnergy * 0.5

    if (!meshRef.current) return
    const positions = meshRef.current.geometry.attributes.position
    if (!positions) return

    const k = Math.sqrt(2 * particleEnergy) * 0.5 // Wave number
    const kappa = Math.sqrt(2 * Math.max(0.1, barrierHeight - particleEnergy)) * 0.3
    const barrierLeft = -barrierWidth / 2
    const barrierRight = barrierWidth / 2

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      let amplitude = 0

      if (x < barrierLeft) {
        // Region I: Incident + reflected wave
        const incident = Math.sin(k * x - timeRef.current)
        const reflected = 0.3 * Math.sin(-k * x - timeRef.current + Math.PI)
        amplitude = incident + reflected
      } else if (x >= barrierLeft && x <= barrierRight) {
        // Region II: Exponentially decaying
        const center = (barrierLeft + barrierRight) / 2
        const distFromCenter = Math.abs(x - center)
        const barrierHalfWidth = (barrierRight - barrierLeft) / 2
        const normalizedPos = distFromCenter / barrierHalfWidth
        amplitude = Math.exp(-kappa * barrierHalfWidth * (1 - normalizedPos)) * 0.5
      } else {
        // Region III: Transmitted wave
        const T = calculateTunnelingProbability(
          barrierHeight,
          barrierWidth,
          particleEnergy
        ) / 100
        amplitude = Math.sqrt(T) * Math.sin(k * x - timeRef.current)
      }

      if (viewMode === 'probability') {
        positions.setZ(i, amplitude * amplitude * 1.5)
      } else {
        positions.setZ(i, amplitude * 1.5)
      }
    }

    positions.needsUpdate = true
    meshRef.current.geometry.computeVertexNormals()
  })

  return (
    <group>
      {/* Main wave surface */}
      <mesh
        ref={meshRef}
        geometry={waveGeometry}
        position={[0, -2.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial
          ref={materialRef}
          color="#06B6D4"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
          wireframe={false}
        />
      </mesh>

      {/* Region I wireframe */}
      <mesh
        position={[-(9 + barrierWidth / 2) / 2, -2.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[9 - barrierWidth / 2, 5, 50, 1]} />
        <meshBasicMaterial
          color="#06B6D4"
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>

      {/* Region III wireframe */}
      <mesh
        position={[(9 + barrierWidth / 2) / 2, -2.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[9 - barrierWidth / 2, 5, 50, 1]} />
        <meshBasicMaterial
          color="#10B981"
          transparent
          opacity={0.15}
          wireframe
        />
      </mesh>
    </group>
  )
}

/* ─────────────────────── TUNNELING PARTICLES ─────────────────────── */

function TunnelingParticles({
  barrierHeight,
  barrierWidth,
  particleEnergy,
  isPlaying,
  eavesdropperActive,
}: {
  barrierHeight: number
  barrierWidth: number
  particleEnergy: number
  isPlaying: boolean
  eavesdropperActive: boolean
}) {
  const particlesRef = useRef<TunnelingParticle[]>([])
  const groupRef = useRef<THREE.Group>(null)
  const nextId = useRef(1)
  void useRef<THREE.Mesh[]>([])

  const tunnelingProb = calculateTunnelingProbability(
    barrierHeight,
    barrierWidth,
    particleEnergy
  )

  useFrame(() => {
    if (!isPlaying) return

    const particles = particlesRef.current

    // Spawn new particles
    const spawnRate = eavesdropperActive ? tunnelingProb * 0.3 : tunnelingProb * 0.8
    if (Math.random() * 100 < spawnRate && particles.length < 50) {
      particles.push({
        id: nextId.current++,
        position: new THREE.Vector3(
          -8 - Math.random() * 2,
          -1 + Math.random() * 2,
          (Math.random() - 0.5) * 2
        ),
        velocity: new THREE.Vector3(
          0.02 + Math.random() * 0.03,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        life: 200 + Math.floor(Math.random() * 100),
        maxLife: 300,
        hasTunneled: false,
        trail: [],
      })
    }

    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life--

      // Check barrier crossing
      const barrierLeft = -barrierWidth / 2
      const barrierRight = barrierWidth / 2

      if (
        !p.hasTunneled &&
        p.position.x >= barrierLeft &&
        p.position.x <= barrierRight
      ) {
        // Tunnel or reflect
        const T = tunnelingProb / 100
        if (Math.random() < T && !eavesdropperActive) {
          p.hasTunneled = true
          p.velocity.x *= 0.8 // Slower after tunneling
          // Flash
          const flash = document.getElementById('tunnel-flash')
          if (flash) {
            flash.style.opacity = '1'
            setTimeout(() => {
              flash.style.opacity = '0'
            }, 200)
          }
        } else {
          // Reflect
          p.velocity.x *= -0.5
          p.position.x = barrierLeft - 0.1
        }
      }

      p.position.add(p.velocity)
      p.trail.push(p.position.clone())
      if (p.trail.length > 10) p.trail.shift()

      if (p.life <= 0 || p.position.x > 10) {
        particles.splice(i, 1)
      }
    }

    // Update meshes
    if (groupRef.current) {
      const children = groupRef.current.children
      for (let i = 0; i < children.length; i++) {
        if (i < particles.length) {
          children[i].visible = true
          children[i].position.copy(particles[i].position)
          const scale = 0.1 * Math.max(0.3, particles[i].life / particles[i].maxLife)
          children[i].scale.setScalar(scale)
        } else {
          children[i].visible = false
        }
      }
    }
  })

  return (
    <group ref={groupRef}>
      {Array.from({ length: 50 }).map((_, i) => (
        <mesh key={i} visible={false}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial
            color="#8B5CF6"
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ─────────────────────── EAVESDROPPER GRID ─────────────────────── */

function EavesdropperGrid({ active }: { active: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const timeRef = useRef(0)

  useFrame((_, delta) => {
    if (!active) return
    timeRef.current += delta
    if (groupRef.current) {
      const pulse = Math.sin(timeRef.current * 3) * 0.05 + 1
      groupRef.current.scale.setScalar(pulse)
    }
  })

  if (!active) return null

  return (
    <group ref={groupRef}>
      {/* Detection grid around barrier */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[6, 8, 8]} />
        <meshBasicMaterial
          color="#F43F5E"
          transparent
          opacity={0.08}
          wireframe
        />
      </mesh>
      {/* Grid lines */}
      {Array.from({ length: 5 }).map((_, i) => (
        <Line
          key={`h-${i}`}
          points={[
            [-3, -1 + i * 2, 0],
            [3, -1 + i * 2, 0],
          ]}
          color="#F43F5E"
          lineWidth={1}
          transparent
          opacity={0.15}
        />
      ))}
      {Array.from({ length: 5 }).map((_, i) => (
        <Line
          key={`v-${i}`}
          points={[
            [-2 + i, -2, 0],
            [-2 + i, 6, 0],
          ]}
          color="#F43F5E"
          lineWidth={1}
          transparent
          opacity={0.15}
        />
      ))}
    </group>
  )
}

/* ─────────────────────── SIMPLE LINE COMPONENT (for eavesdropper) ─────────────────────── */

function Line({
  points,
  color,
  lineWidth = 1,
  transparent = false,
  opacity = 1,
}: {
  points: [number, number, number][]
  color: string
  lineWidth?: number
  transparent?: boolean
  opacity?: number
}) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(
      points.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
    )
    return geo
  }, [points])

  return (
    <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({ color, linewidth: lineWidth, transparent, opacity }))} />
  )
}

/* ─────────────────────── HEATMAP ─────────────────────── */

function Heatmap({
  barrierHeight,
  barrierWidth,
  particleEnergy,
  show,
}: {
  barrierHeight: number
  barrierWidth: number
  particleEnergy: number
  show: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!show) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.offsetWidth
    const h = canvas.offsetHeight
    canvas.width = w * dpr
    canvas.height = h * dpr
    ctx.scale(dpr, dpr)

    // Draw probability heatmap
    const imageData = ctx.createImageData(w, h)
    const data = imageData.data

    const T = calculateTunnelingProbability(
      barrierHeight,
      barrierWidth,
      particleEnergy
    ) / 100
    const k = Math.sqrt(2 * particleEnergy) * 0.01
    const kappa =
      Math.sqrt(2 * Math.max(0.1, barrierHeight - particleEnergy)) * 0.01

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = x / w
        const ny = y / h
        const px = (nx - 0.5) * 20

        let prob = 0
        if (px < -barrierWidth / 2) {
          // Region I
          const amplitude =
            Math.sin(k * px) + 0.3 * Math.sin(-k * px + Math.PI)
          prob = amplitude * amplitude
        } else if (px >= -barrierWidth / 2 && px <= barrierWidth / 2) {
          // Region II
          const center = 0
          const dist = Math.abs(px - center)
          const halfW = barrierWidth / 2
          prob = Math.exp(-2 * kappa * halfW * (1 - dist / halfW))
        } else {
          // Region III
          prob = T
        }

        // Apply y-variation (Gaussian spread)
        prob *= Math.exp(-((ny - 0.5) ** 2) * 4)

        // Color mapping: deep blue → cyan → green → yellow → red
        const idx = (y * w + x) * 4
        let r = 0,
          g = 0,
          b = 0
        const val = Math.min(prob * 3, 1)
        if (val < 0.2) {
          r = 0
          g = 0
          b = Math.floor((val / 0.2) * 139)
        } else if (val < 0.4) {
          r = 0
          g = Math.floor(((val - 0.2) / 0.2) * 255)
          b = 139
        } else if (val < 0.6) {
          r = 0
          g = 255
          b = Math.floor(139 - ((val - 0.4) / 0.2) * 139)
        } else if (val < 0.8) {
          r = Math.floor(((val - 0.6) / 0.2) * 255)
          g = 255
          b = 0
        } else {
          r = 255
          g = Math.floor(255 - ((val - 0.8) / 0.2) * 255)
          b = 0
        }

        data[idx] = r
        data[idx + 1] = g
        data[idx + 2] = b
        data[idx + 3] = 180 // Alpha
      }
    }

    ctx.putImageData(imageData, 0, 0)
  }, [show, barrierHeight, barrierWidth, particleEnergy])

  if (!show) return null

  return (
    <div className="absolute bottom-4 left-[320px] z-20 h-[200px] w-[300px] rounded-lg border border-border-subtle bg-bg-void/90 backdrop-blur-sm">
      <div className="border-b border-border-subtle px-2 py-1">
        <span className="font-mono text-[10px] text-text-muted">
          Probability Heatmap (|ψ|²)
        </span>
      </div>
      <canvas ref={canvasRef} className="h-[calc(100%-24px)] w-full" />
    </div>
  )
}

/* ─────────────────────── SCENE ─────────────────────── */

function QuantumScene({
  isPlaying,
  barrierHeight,
  barrierWidth,
  particleEnergy,
  eavesdropperActive,
  viewMode,
  pulseTime,
}: {
  isPlaying: boolean
  barrierHeight: number
  barrierWidth: number
  particleEnergy: number
  eavesdropperActive: boolean
  viewMode: 'probability' | 'real'
  pulseTime: number
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.6} />
      <pointLight position={[-10, 5, -10]} intensity={0.3} color="#8B5CF6" />

      <PotentialBarrier
        height={barrierHeight}
        width={barrierWidth}
        pulseTime={pulseTime}
      />

      <ProbabilityWave
        barrierHeight={barrierHeight}
        barrierWidth={barrierWidth}
        particleEnergy={particleEnergy}
        viewMode={viewMode}
        isPlaying={isPlaying}
      />

      <TunnelingParticles
        barrierHeight={barrierHeight}
        barrierWidth={barrierWidth}
        particleEnergy={particleEnergy}
        isPlaying={isPlaying}
        eavesdropperActive={eavesdropperActive}
      />

      <EavesdropperGrid active={eavesdropperActive} />

      {/* Ground plane */}
      <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.5} />
      </mesh>

      {/* Tunnel flash */}
      <mesh position={[barrierWidth / 2 + 1, 0, 0]} visible={false} name="tunnel-flash-point">
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color="#8B5CF6" transparent opacity={0} />
      </mesh>

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={8}
        maxDistance={25}
        maxPolarAngle={Math.PI / 2 + 0.3}
      />
    </>
  )
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */

export default function VizQuantum() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [barrierHeight, setBarrierHeight] = useState([5.0])
  const [barrierWidth, setBarrierWidth] = useState([2.0])
  const [particleEnergy, setParticleEnergy] = useState([3.0])
  const [eavesdropperActive, setEavesdropperActive] = useState(false)
  const [viewMode, setViewMode] = useState<'probability' | 'real'>('probability')
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [pulseTime, setPulseTime] = useState(0)
  const [detectionEvents, setDetectionEvents] = useState(0)
  const [collapseFlash, setCollapseFlash] = useState(false)

  const tunnelingProb = useMemo(
    () =>
      calculateTunnelingProbability(
        barrierHeight[0],
        barrierWidth[0],
        particleEnergy[0]
      ),
    [barrierHeight, barrierWidth, particleEnergy]
  )

  const keyStability = useMemo(() => {
    const base = 100 - tunnelingProb * 0.5
    if (eavesdropperActive) return Math.max(30, base - 20 - Math.random() * 10)
    return Math.min(99.9, base + (Math.random() - 0.5) * 2)
  }, [tunnelingProb, eavesdropperActive])

  const tunnelingRate = useMemo(() => {
    const base = tunnelingProb * 4
    if (eavesdropperActive) return Math.max(1, base * 0.3)
    return Math.max(0, base + (Math.random() - 0.5) * 5)
  }, [tunnelingProb, eavesdropperActive])

  // Eavesdropper wavefunction collapse simulation
  useEffect(() => {
    if (!eavesdropperActive) {
      setCollapseFlash(false)
      return
    }
    const interval = setInterval(() => {
      if (Math.random() < 0.4) {
        setCollapseFlash(true)
        setDetectionEvents((p) => p + 1)
        setTimeout(() => setCollapseFlash(false), 300)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [eavesdropperActive])

  const handleBarrierHeightChange = useCallback((v: number[]) => {
    setBarrierHeight(v)
    setPulseTime(Date.now())
  }, [])

  const handleBarrierWidthChange = useCallback((v: number[]) => {
    setBarrierWidth(v)
    setPulseTime(Date.now())
  }, [])

  const resetScene = useCallback(() => {
    setIsPlaying(true)
    setBarrierHeight([5.0])
    setBarrierWidth([2.0])
    setParticleEnergy([3.0])
    setEavesdropperActive(false)
    setViewMode('probability')
    setShowHeatmap(false)
    setPulseTime(0)
    setDetectionEvents(0)
    setCollapseFlash(false)
  }, [])

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-bg-void">
      {/* Eavesdropping alert banner */}
      <AnimatePresence>
        {eavesdropperActive && (
          <motion.div
            className="absolute inset-x-0 top-0 z-30 flex items-center justify-center bg-accent-rose/20 py-2 backdrop-blur-sm"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
          >
            <Eye size={16} className="mr-2 text-accent-rose" />
            <span className="font-mono text-sm text-accent-rose">
              Eavesdropping Detected — Wavefunction Collapsed
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wavefunction collapse flash */}
      <AnimatePresence>
        {collapseFlash && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-25 bg-accent-rose/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          />
        )}
      </AnimatePresence>

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 5, 14], fov: 55 }}>
          <QuantumScene
            isPlaying={isPlaying}
            barrierHeight={barrierHeight[0]}
            barrierWidth={barrierWidth[0]}
            particleEnergy={particleEnergy[0]}
            eavesdropperActive={eavesdropperActive}
            viewMode={viewMode}
            pulseTime={pulseTime}
          />
        </Canvas>
      </div>

      {/* Tunnel flash effect */}
      <div
        id="tunnel-flash"
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-violet/30 blur-xl transition-opacity duration-200"
        style={{ opacity: 0 }}
      />

      {/* Back to hub */}
      <div className="absolute left-4 top-4 z-20">
        <Link
          to="/visualizations"
          className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-bg-surface/90 px-3 py-2 text-sm text-text-secondary backdrop-blur-sm transition-colors hover:text-accent-violet"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Visualizations</span>
        </Link>
      </div>

      {/* Control Panel */}
      <motion.div
        className="absolute left-4 top-14 z-20 w-[300px] max-h-[82vh] overflow-y-auto rounded-lg border border-border-subtle bg-bg-surface/90 p-4 backdrop-blur-sm"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <h3 className="mb-1 font-display text-lg font-bold text-text-primary">
          Quantum Controls
        </h3>
        <p className="mb-4 font-mono text-[10px] text-text-muted">
          LAMMPS + Quantum ESPRESSO → Key Stability
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs text-text-secondary">
              <span>Barrier Height</span>
              <span className="font-mono text-accent-cyan">
                {barrierHeight[0].toFixed(1)} eV
              </span>
            </label>
            <Slider
              value={barrierHeight}
              onValueChange={handleBarrierHeightChange}
              min={1.0}
              max={10.0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs text-text-secondary">
              <span>Barrier Width</span>
              <span className="font-mono text-accent-cyan">
                {barrierWidth[0].toFixed(1)} nm
              </span>
            </label>
            <Slider
              value={barrierWidth}
              onValueChange={handleBarrierWidthChange}
              min={0.5}
              max={5.0}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs text-text-secondary">
              <span>Particle Energy</span>
              <span className="font-mono text-accent-cyan">
                {particleEnergy[0].toFixed(1)} eV
              </span>
            </label>
            <Slider
              value={particleEnergy}
              onValueChange={setParticleEnergy}
              min={0.1}
              max={15.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Tunneling probability display */}
          <div className="rounded-md border border-border-subtle bg-bg-deep p-3">
            <span className="block text-xs text-text-muted">
              Tunneling Probability
            </span>
            <span className="font-mono text-lg font-bold text-accent-violet">
              {tunnelingProb.toFixed(1)}%
            </span>
          </div>

          {/* Toggles */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-text-secondary">
              <Eye size={14} />
              Simulate Eavesdropper
            </span>
            <Switch
              checked={eavesdropperActive}
              onCheckedChange={setEavesdropperActive}
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-text-secondary">
              <BarChart3 size={14} />
              Wavefunction View
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode('probability')}
                className={`rounded px-2 py-0.5 text-[10px] font-mono ${
                  viewMode === 'probability'
                    ? 'bg-accent-cyan text-bg-deep'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                |ψ|²
              </button>
              <button
                onClick={() => setViewMode('real')}
                className={`rounded px-2 py-0.5 text-[10px] font-mono ${
                  viewMode === 'real'
                    ? 'bg-accent-cyan text-bg-deep'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                Re(ψ)
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs text-text-secondary">
              <BarChart3 size={14} />
              Show Heatmap
            </span>
            <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              variant="outline"
              size="sm"
              className="flex-1 border-border-subtle text-text-secondary hover:text-text-primary"
            >
              {isPlaying ? (
                <Pause size={14} className="mr-1" />
              ) : (
                <Play size={14} className="mr-1" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              onClick={resetScene}
              variant="outline"
              size="sm"
              className="flex-1 border-border-subtle text-text-secondary hover:text-text-primary"
            >
              <RotateCcw size={14} className="mr-1" />
              Reset
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Metrics Overlay */}
      <motion.div
        className="absolute right-4 top-4 z-20 w-[180px] rounded-lg border border-border-subtle bg-bg-surface/90 p-4 backdrop-blur-sm"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <h3 className="mb-3 font-display text-sm font-bold text-text-primary">
          Metrics
        </h3>
        <div className="space-y-3">
          <div>
            <span className="block text-[10px] text-text-muted">
              Tunneling Rate
            </span>
            <span className="font-display text-xl font-bold text-accent-violet">
              {tunnelingRate.toFixed(0)} p/s
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-text-muted">
              Key Stability Index
            </span>
            <span className="font-display text-lg font-bold text-accent-emerald">
              {keyStability.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-text-muted">
              Barrier Transparency
            </span>
            <span className="font-display text-lg font-bold text-accent-cyan">
              {tunnelingProb.toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="block text-[10px] text-text-muted">
              Detection Events
            </span>
            <span className="font-display text-lg font-bold text-accent-rose">
              {detectionEvents}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Title overlay */}
      <div className="absolute bottom-4 right-4 z-20">
        <h1 className="font-display text-lg font-bold text-text-primary opacity-60">
          Quantum Tunneling
        </h1>
        <p className="text-xs text-text-muted">
          LAMMPS + Quantum ESPRESSO → Key Stability
        </p>
      </div>

      {/* Heatmap */}
      <Heatmap
        barrierHeight={barrierHeight[0]}
        barrierWidth={barrierWidth[0]}
        particleEnergy={particleEnergy[0]}
        show={showHeatmap}
      />
    </div>
  )
}
