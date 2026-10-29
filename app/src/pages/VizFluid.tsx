import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Text } from '@react-three/drei'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import type { Vector3 as ThreeVector3 } from 'three'
import * as THREE from 'three'
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'

/* ─────────────────────── TYPES ─────────────────────── */

interface ParticleData {
  position: ThreeVector3
  velocity: ThreeVector3
  color: string
  life: number
  maxLife: number
  size: number
  type: 'normal' | 'attack' | 'mitigated'
}

interface NodeData {
  position: [number, number, number]
  id: string
  load: number
  isFirewall: boolean
  health: number
}

interface DDoSAttack {
  id: number
  sourceNode: number
  startTime: number
  duration: number
  intensity: number
}

/* ─────────────────────── CONSTANTS ─────────────────────── */

const GRID_SIZE = 12
const NODE_SPACING = 1.2
const NODE_RADIUS = 0.12
const CONNECTION_WIDTH = 0.015
const PARTICLE_COUNT = 200
const MAX_ATTACK_PARTICLES = 100
const FIREWALL_RADIUS = 2.0

/* ─────────────────────── COLORS ─────────────────────── */

const COLORS = {
  node: '#06B6D4',
  nodeOpacity: 0.6,
  connection: '#1E293B',
  normalParticle: '#06B6D4',
  attackParticle: '#F43F5E',
  mitigatedParticle: '#10B981',
  firewall: '#10B981',
  firewallGlow: '#065F46',
}

/* ─────────────────────── NETWORK MESH ─────────────────────── */

function NetworkMesh({
  nodes,
  time,
  attacks,
}: {
  nodes: NodeData[]
  time: number
  attacks: DDoSAttack[]
}) {
  const meshRef = useRef<THREE.Group>(null)

  // Build connections
  const connections = useMemo(() => {
    const conns: [number, number][] = []
    const cols = GRID_SIZE
    for (let i = 0; i < nodes.length; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      // Right neighbor
      if (col < cols - 1) conns.push([i, i + 1])
      // Bottom neighbor
      if (row < GRID_SIZE - 1) conns.push([i, i + cols])
    }
    return conns
  }, [nodes.length])

  // Undulate node positions
  const undulatePosition = useCallback(
    (pos: [number, number, number], index: number): [number, number, number] => {
      const row = Math.floor(index / GRID_SIZE)
      const col = index % GRID_SIZE
      const wave =
        Math.sin(col * 0.4 + time * 0.5) * 0.15 +
        Math.cos(row * 0.4 + time * 0.3) * 0.1

      // Check if near active attack
      let shake = 0
      for (const attack of attacks) {
        const sNode = nodes[attack.sourceNode]
        if (!sNode) continue
        const dx = pos[0] - sNode.position[0]
        const dy = pos[2] - sNode.position[2]
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 4) {
          shake = Math.max(shake, (1 - dist / 4) * 0.1 * attack.intensity)
        }
      }

      const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0
      const shakeZ = shake > 0 ? (Math.random() - 0.5) * shake : 0

      return [pos[0] + shakeX, pos[1] + wave, pos[2] + shakeZ]
    },
    [attacks, nodes]
  )

  return (
    <group ref={meshRef}>
      {/* Nodes */}
      {nodes.map((node, i) => {
        const pos = undulatePosition(node.position, i)
        return (
          <group key={node.id}>
            <mesh position={pos}>
              <sphereGeometry args={[NODE_RADIUS, 8, 8]} />
              <meshBasicMaterial
                color={
                  node.isFirewall ? COLORS.firewall : COLORS.node
                }
                transparent
                opacity={node.isFirewall ? 1 : COLORS.nodeOpacity}
              />
            </mesh>
            {/* Firewall protection radius */}
            {node.isFirewall && (
              <mesh position={pos}>
                <sphereGeometry args={[FIREWALL_RADIUS, 16, 16]} />
                <meshBasicMaterial
                  color={COLORS.firewall}
                  transparent
                  opacity={0.06}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )}
          </group>
        )
      })}

      {/* Connections */}
      {connections.map(([a, b], i) => {
        const posA = undulatePosition(nodes[a].position, a)
        const posB = undulatePosition(nodes[b].position, b)
        const mid = [
          (posA[0] + posB[0]) / 2,
          (posA[1] + posB[1]) / 2,
          (posA[2] + posB[2]) / 2,
        ]
        const dir = new THREE.Vector3(
          posB[0] - posA[0],
          posB[1] - posA[1],
          posB[2] - posA[2]
        )
        const length = dir.length()
        const quaternion = new THREE.Quaternion()
        quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.normalize()
        )

        return (
          <mesh
            key={`conn-${i}`}
            position={mid as [number, number, number]}
            quaternion={quaternion}
          >
            <cylinderGeometry args={[CONNECTION_WIDTH, CONNECTION_WIDTH, length, 4]} />
            <meshBasicMaterial
              color={COLORS.connection}
              transparent
              opacity={0.4}
            />
          </mesh>
        )
      })}

      {/* Node labels */}
      {nodes.slice(0, 4).map((node, i) => {
        const pos = undulatePosition(node.position, i)
        return (
          <Text
            key={`label-${node.id}`}
            position={[pos[0], pos[1] + 0.4, pos[2]]}
            fontSize={0.15}
            color="#64748B"
            anchorX="center"
            anchorY="bottom"
          >
            {node.id}
          </Text>
        )
      })}
    </group>
  )
}

/* ─────────────────────── TRAFFIC PARTICLES ─────────────────────── */

function TrafficParticles({
  particles,
  isPlaying: _isPlaying,
}: {
  particles: React.RefObject<ParticleData[]>
  isPlaying: boolean
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame(() => {
    if (!meshRef.current || !particles.current) return
    const data = particles.current
    let idx = 0
    for (const p of data) {
      if (idx >= 300) break
      dummy.position.copy(p.position as unknown as THREE.Vector3)
      const scale = p.size * Math.max(0.1, p.life / p.maxLife)
      dummy.scale.set(scale, scale, scale)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(idx, dummy.matrix)
      idx++
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 300]}>
      <sphereGeometry args={[0.08, 6, 6]} />
      <meshBasicMaterial color={COLORS.normalParticle} transparent opacity={0.8} />
    </instancedMesh>
  )
}

/* ─────────────────────── SCENE ─────────────────────── */

function FluidScene({
  isPlaying,
  trafficRate,
  mitigationLevel,
  attacks,
  nodes,
  onNodesChange: _onNodesChange,
}: {
  isPlaying: boolean
  trafficRate: number
  mitigationLevel: number
  attacks: DDoSAttack[]
  nodes: NodeData[]
  onNodesChange: (nodes: NodeData[]) => void
}) {
  const { camera } = useThree()
  const timeRef = useRef(0)
  const particlesRef = useRef<ParticleData[]>([])
  const [time, setTime] = useState(0)

  // Camera intro
  useEffect(() => {
    const startPos = { x: 0, y: 25, z: 25 }
    const endPos = { x: 0, y: 12, z: 16 }
    let progress = 0
    const duration = 120 // frames

    const animate = () => {
      progress++
      const t = Math.min(progress / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      camera.position.set(
        startPos.x + (endPos.x - startPos.x) * ease,
        startPos.y + (endPos.y - startPos.y) * ease,
        startPos.z + (endPos.z - startPos.z) * ease
      )
      camera.lookAt(0, 0, 0)
      if (progress < duration) requestAnimationFrame(animate)
    }
    camera.position.set(startPos.x, startPos.y, startPos.z)
    animate()
  }, [camera])

  // Initialize particles
  useEffect(() => {
    const initial: ParticleData[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const row = Math.floor(Math.random() * GRID_SIZE)
      const col = Math.floor(Math.random() * GRID_SIZE)
      initial.push({
        position: new THREE.Vector3(
          (col - GRID_SIZE / 2) * NODE_SPACING,
          0.5 + Math.random() * 0.5,
          (row - GRID_SIZE / 2) * NODE_SPACING
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          0,
          (Math.random() - 0.5) * 0.02
        ),
        color: COLORS.normalParticle,
        life: Math.random() * 100 + 50,
        maxLife: 150,
        size: 0.5 + Math.random() * 0.5,
        type: 'normal',
      })
    }
    particlesRef.current = initial
  }, [])

  // Animate particles
  useFrame((_, delta) => {
    if (!isPlaying) return
    timeRef.current += delta
    setTime(timeRef.current)

    const particles = particlesRef.current
    const spawnRate = Math.max(1, Math.floor(trafficRate / 10))

    // Spawn new normal particles
    for (let s = 0; s < spawnRate && particles.length < PARTICLE_COUNT + MAX_ATTACK_PARTICLES; s++) {
      const row = Math.floor(Math.random() * GRID_SIZE)
      const col = Math.floor(Math.random() * GRID_SIZE)
      particles.push({
        position: new THREE.Vector3(
          (col - GRID_SIZE / 2) * NODE_SPACING,
          0.5,
          (row - GRID_SIZE / 2) * NODE_SPACING
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.03,
          0,
          (Math.random() - 0.5) * 0.03
        ),
        color: COLORS.normalParticle,
        life: 80 + Math.random() * 70,
        maxLife: 150,
        size: 0.5 + Math.random() * 0.5,
        type: 'normal',
      })
    }

    // Spawn attack particles from active DDoS
    for (const attack of attacks) {
      const age = timeRef.current - attack.startTime
      if (age > 0 && age < attack.duration) {
        const sourceNode = nodes[attack.sourceNode]
        if (!sourceNode) continue
        const intensity = Math.floor(attack.intensity * 3)
        for (let a = 0; a < intensity && particles.length < PARTICLE_COUNT + MAX_ATTACK_PARTICLES; a++) {
          particles.push({
            position: new THREE.Vector3(
              sourceNode.position[0] + (Math.random() - 0.5),
              0.5,
              sourceNode.position[2] + (Math.random() - 0.5)
            ),
            velocity: new THREE.Vector3(
              (Math.random() - 0.5) * 0.08,
              0,
              (Math.random() - 0.5) * 0.08
            ),
            color: COLORS.attackParticle,
            life: 40 + Math.random() * 40,
            maxLife: 80,
            size: 0.7,
            type: 'attack',
          })
        }
      }
    }

    // Update particles
    const mitigatedCount = { value: 0 }
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life -= 1

      // Move toward center for attack particles
      if (p.type === 'attack') {
        const centerX = 0
        const centerZ = 0
        const dx = centerX - p.position.x
        const dz = centerZ - p.position.z
        const dist = Math.sqrt(dx * dx + dz * dz)
        if (dist > 0.5) {
          p.velocity.x += (dx / dist) * 0.001
          p.velocity.z += (dz / dist) * 0.001
        }
        // Turbulence
        p.velocity.x += (Math.random() - 0.5) * 0.005
        p.velocity.z += (Math.random() - 0.5) * 0.005
      } else {
        // Normal flow along grid
        const flowX = Math.sin(p.position.z * 0.5 + timeRef.current * 0.5) * 0.001
        const flowZ = Math.cos(p.position.x * 0.5 + timeRef.current * 0.3) * 0.001
        p.velocity.x += flowX
        p.velocity.z += flowZ
      }

      // Check firewall collision
      if (p.type === 'attack' && mitigationLevel > 0) {
        for (const node of nodes) {
          if (!node.isFirewall) continue
          const ddx = p.position.x - node.position[0]
          const ddy = p.position.y - node.position[1]
          const ddz = p.position.z - node.position[2]
          const dist = Math.sqrt(ddx * ddx + ddy * ddy + ddz * ddz)
          if (dist < FIREWALL_RADIUS && Math.random() < mitigationLevel / 100) {
            p.type = 'mitigated'
            p.color = COLORS.mitigatedParticle
            p.velocity.multiplyScalar(0.1)
            mitigatedCount.value++
          }
        }
      }

      // Apply velocity
      p.position.add(p.velocity)

      // Damping
      p.velocity.multiplyScalar(0.98)

      // Remove dead particles
      if (p.life <= 0) {
        particles.splice(i, 1)
      }
    }

    // Cap particles
    if (particles.length > PARTICLE_COUNT + MAX_ATTACK_PARTICLES) {
      particles.splice(0, particles.length - (PARTICLE_COUNT + MAX_ATTACK_PARTICLES))
    }
  })

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      <NetworkMesh nodes={nodes} time={time} attacks={attacks} />
      <TrafficParticles particles={particlesRef} isPlaying={isPlaying} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        maxPolarAngle={Math.PI / 2 + 0.2}
        minDistance={5}
        maxDistance={40}
      />
    </>
  )
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */

export default function VizFluid() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [trafficRate, setTrafficRate] = useState([50])
  const [attackVectors, setAttackVectors] = useState([3])
  const [mitigationLevel, setMitigationLevel] = useState([78])
  const [meshDensity, setMeshDensity] = useState([144])
  const [viscosity, setViscosity] = useState([1.0])
  const [attacks, setAttacks] = useState<DDoSAttack[]>([])
  const [currentLoad, setCurrentLoad] = useState(47.3)
  const [activeAttackCount, setActiveAttackCount] = useState(0)
  const [mitigationRate, setMitigationRate] = useState(78)
  const nextAttackId = useRef(1)

  // Build node grid
  const nodes = useMemo<NodeData[]>(() => {
    const count = meshDensity[0]
    const cols = GRID_SIZE
    const nodeList: NodeData[] = []
    for (let i = 0; i < count && i < GRID_SIZE * GRID_SIZE; i++) {
      const row = Math.floor(i / cols)
      const col = i % cols
      nodeList.push({
        position: [
          (col - GRID_SIZE / 2) * NODE_SPACING,
          0,
          (row - GRID_SIZE / 2) * NODE_SPACING,
        ],
        id: `N-${i}`,
        load: Math.random() * 100,
        isFirewall: false,
        health: 100,
      })
    }
    return nodeList
  }, [meshDensity])

  const [nodeState, setNodeState] = useState<NodeData[]>(nodes)

  useEffect(() => {
    setNodeState(nodes)
  }, [nodes])

  // Simulate metrics
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setCurrentLoad((_prev) => {
        const base = trafficRate[0] * 0.8
        const attackBoost = attacks.filter(
          (a) => Date.now() / 1000 - a.startTime < a.duration
        ).length *
          15 *
          attackVectors[0]
        return Math.max(0.1, base + attackBoost + (Math.random() - 0.5) * 10)
      })
      setActiveAttackCount(attacks.filter((a) => Date.now() / 1000 - a.startTime < a.duration).length)
      setMitigationRate(mitigationLevel[0])
    }, 500)
    return () => clearInterval(interval)
  }, [isPlaying, trafficRate, attacks, mitigationLevel, attackVectors])

  const spawnDDoS = useCallback(() => {
    const edgeNodes = nodeState
      .map((_, i) => i)
      .filter((i) => {
        const row = Math.floor(i / GRID_SIZE)
        const col = i % GRID_SIZE
        return row === 0 || row === GRID_SIZE - 1 || col === 0 || col === GRID_SIZE - 1
      })
    if (edgeNodes.length === 0) return
    const sourceIdx = edgeNodes[Math.floor(Math.random() * edgeNodes.length)]
    const newAttack: DDoSAttack = {
      id: nextAttackId.current++,
      sourceNode: sourceIdx,
      startTime: performance.now() / 1000,
      duration: 5 + Math.random() * 5,
      intensity: 0.5 + Math.random() * 0.5,
    }
    setAttacks((prev) => [...prev.slice(-15), newAttack])
  }, [nodeState])

  const resetScene = useCallback(() => {
    setTrafficRate([50])
    setAttackVectors([3])
    setMitigationLevel([78])
    setMeshDensity([144])
    setViscosity([1.0])
    setAttacks([])
    setIsPlaying(true)
    setCurrentLoad(47.3)
    setActiveAttackCount(0)
  }, [])

  // Auto-spawn DDoS
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      if (Math.random() < 0.3 && attacks.length < attackVectors[0]) {
        spawnDDoS()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [isPlaying, attacks.length, attackVectors, spawnDDoS])

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-bg-void">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas>
          <FluidScene
            isPlaying={isPlaying}
            trafficRate={trafficRate[0]}
            mitigationLevel={mitigationLevel[0]}
            attacks={attacks}
            nodes={nodeState}
            onNodesChange={setNodeState}
          />
        </Canvas>
      </div>

      {/* Back to hub */}
      <div className="absolute left-4 top-4 z-20">
        <Link
          to="/visualizations"
          className="inline-flex items-center gap-2 rounded-md border border-border-subtle bg-bg-surface/90 px-3 py-2 text-sm text-text-secondary backdrop-blur-sm transition-colors hover:text-accent-cyan"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Visualizations</span>
        </Link>
      </div>

      {/* Control Panel */}
      <motion.div
        className="absolute left-4 top-14 z-20 w-[280px] max-h-[80vh] overflow-y-auto rounded-lg border border-border-subtle bg-bg-surface/90 p-4 backdrop-blur-sm"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
      >
        <h3 className="mb-4 font-display text-lg font-bold text-text-primary">
          Controls
        </h3>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs text-text-secondary">
              <span>Traffic Rate</span>
              <span className="font-mono text-accent-cyan">{trafficRate[0]} Gbps</span>
            </label>
            <Slider
              value={trafficRate}
              onValueChange={setTrafficRate}
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs text-text-secondary">
              <span>Attack Vectors</span>
              <span className="font-mono text-accent-rose">{attackVectors[0]}</span>
            </label>
            <Slider
              value={attackVectors}
              onValueChange={setAttackVectors}
              min={1}
              max={16}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs text-text-secondary">
              <span>Mitigation Level</span>
              <span className="font-mono text-accent-emerald">{mitigationLevel[0]}%</span>
            </label>
            <Slider
              value={mitigationLevel}
              onValueChange={setMitigationLevel}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs text-text-secondary">
              <span>Mesh Density</span>
              <span className="font-mono text-accent-cyan">{meshDensity[0]}</span>
            </label>
            <Slider
              value={meshDensity}
              onValueChange={setMeshDensity}
              min={25}
              max={144}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center justify-between text-xs text-text-secondary">
              <span>Viscosity</span>
              <span className="font-mono text-accent-cyan">{viscosity[0]}</span>
            </label>
            <Slider
              value={viscosity}
              onValueChange={setViscosity}
              min={0.1}
              max={10}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={spawnDDoS}
              className="flex-1 bg-accent-rose text-white hover:bg-accent-rose/90"
              size="sm"
            >
              <ShieldAlert size={14} className="mr-1" />
              Spawn DDoS
            </Button>
          </div>

          <div className="flex gap-2">
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
        className="absolute right-4 top-4 z-20 w-[200px] rounded-lg border border-border-subtle bg-bg-surface/90 p-4 backdrop-blur-sm"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.7 }}
      >
        <h3 className="mb-3 font-display text-sm font-bold text-text-primary">
          Metrics
        </h3>
        <div className="space-y-3">
          <div>
            <span className="block text-xs text-text-muted">Current Load</span>
            <span className="font-display text-2xl font-bold text-accent-cyan">
              {currentLoad.toFixed(1)} Gbps
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted">Active Attacks</span>
            <span className="font-display text-lg font-bold text-accent-rose">
              {activeAttackCount} vectors
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted">Mitigation Rate</span>
            <span className="font-display text-lg font-bold text-accent-emerald">
              {mitigationRate}%
            </span>
          </div>
          <div>
            <span className="block text-xs text-text-muted">Node Health</span>
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => {
                const health = nodeState[i]?.health ?? 100
                let color = 'bg-accent-emerald'
                if (health < 60) color = 'bg-accent-amber'
                if (health < 30) color = 'bg-accent-rose'
                return (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-sm ${color} opacity-70`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Legend */}
      <motion.div
        className="absolute bottom-4 left-4 z-20 flex gap-4 rounded-lg border border-border-subtle bg-bg-surface/90 px-4 py-2 backdrop-blur-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.9 }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: COLORS.normalParticle }}
          />
          <span className="text-xs text-text-muted">Normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: COLORS.attackParticle }}
          />
          <span className="text-xs text-text-muted">Attack</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: COLORS.mitigatedParticle }}
          />
          <span className="text-xs text-text-muted">Mitigated</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-2.5 rounded-sm"
            style={{ backgroundColor: COLORS.firewall }}
          />
          <span className="text-xs text-text-muted">Firewall</span>
        </div>
      </motion.div>

      {/* Title overlay */}
      <div className="absolute bottom-4 right-4 z-20">
        <h1 className="font-display text-lg font-bold text-text-primary opacity-60">
          Fluid Dynamics
        </h1>
        <p className="text-xs text-text-muted">
          OpenFOAM → DDoS Mitigation
        </p>
      </div>
    </div>
  )
}
