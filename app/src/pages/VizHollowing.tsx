import { useState, useRef, useCallback, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Cpu,
  Zap,
  Layers,
  Code,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

/* ─────────────────────── TYPES ─────────────────────── */

interface MemorySection {
  name: string
  color: string
  opacity: number
  position: [number, number, number]
  size: [number, number, number]
  label: string
}

interface InjectedThread {
  id: number
  color: string
  entryPoint: [number, number, number]
  targetSection: string
  startTime: number
  isActive: boolean
}

interface Spark {
  id: number
  position: [number, number, number]
  color: string
  velocity: [number, number, number]
  life: number
  maxLife: number
}

interface TimelineEvent {
  time: number
  threadId: number
  type: 'create' | 'hollow' | 'inject' | 'activate'
  label: string
}

/* ─────────────────────── SECTIONS CONFIG ─────────────────────── */

const INITIAL_SECTIONS: MemorySection[] = [
  {
    name: '.text',
    color: '#F43F5E',
    opacity: 0.8,
    position: [0, 2.5, 0],
    size: [6, 2, 6],
    label: '.text (code)',
  },
  {
    name: '.data',
    color: '#F59E0B',
    opacity: 0.7,
    position: [-2, 0, 0],
    size: [3, 1.8, 6],
    label: '.data',
  },
  {
    name: '.bss',
    color: '#F59E0B',
    opacity: 0.35,
    position: [2, 0, 0],
    size: [3, 1.8, 6],
    label: '.bss',
  },
  {
    name: '.rdata',
    color: '#06B6D4',
    opacity: 0.6,
    position: [-2.5, -2.5, 0],
    size: [2.5, 1.5, 5],
    label: '.rdata',
  },
  {
    name: 'heap',
    color: '#8B5CF6',
    opacity: 0.5,
    position: [2.5, -2.5, 0],
    size: [3, 2, 5],
    label: 'Heap',
  },
  {
    name: 'stack',
    color: '#10B981',
    opacity: 0.6,
    position: [3.5, 3.5, -2],
    size: [1, 5, 1],
    label: 'Stack',
  },
]

const THREAD_COLORS = [
  '#06B6D4',
  '#F43F5E',
  '#F59E0B',
  '#8B5CF6',
  '#10B981',
  '#EC4899',
]

/* ─────────────────────── 3D COMPONENTS ─────────────────────── */

function ProcessContainer({
  isHollowed,
  flashTime,
}: {
  isHollowed: boolean
  flashTime: number
}) {
  const groupRef = useRef<THREE.Group>(null)
  const materialRef = useRef<THREE.MeshBasicMaterial>(null)

  useFrame(() => {
    if (materialRef.current && flashTime > 0) {
      const elapsed = (Date.now() - flashTime) / 1000
      if (elapsed < 0.5) {
        const flash = Math.sin(elapsed * Math.PI * 4) * 0.3 + 0.3
        materialRef.current.opacity = flash
        materialRef.current.color.set('#F43F5E')
      } else {
        materialRef.current.opacity = 0.3
        materialRef.current.color.set(isHollowed ? '#F43F5E' : '#06B6D4')
      }
    }
  })

  return (
    <group ref={groupRef}>
      {/* Wireframe box */}
      <mesh>
        <boxGeometry args={[10, 10, 10]} />
        <meshBasicMaterial
          ref={materialRef}
          color={isHollowed ? '#F43F5E' : '#06B6D4'}
          transparent
          opacity={0.3}
          wireframe
        />
      </mesh>

      {/* Corner markers */}
      {[
        [-5, 5, 5], [5, 5, 5], [-5, 5, -5], [5, 5, -5],
        [-5, -5, 5], [5, -5, 5], [-5, -5, -5], [5, -5, -5],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.1, 6, 6]} />
          <meshBasicMaterial
            color={isHollowed ? '#F43F5E' : '#06B6D4'}
            transparent
            opacity={0.5}
          />
        </mesh>
      ))}

      {/* Label */}
      <Text
        position={[0, 5.8, 0]}
        fontSize={0.3}
        color="#64748B"
        anchorX="center"
        anchorY="bottom"
        font="/fonts/JetBrainsMono-Regular.woff"
      >
        Process Address Space
      </Text>
    </group>
  )
}

function MemorySections({
  sections,
  isHollowed,
}: {
  sections: MemorySection[]
  isHollowed: boolean
}) {
  return (
    <group>
      {sections.map((section) => {
        const isTextSection = section.name === '.text'
        const opacity = isHollowed && isTextSection ? 0.15 : section.opacity
        const color = isHollowed && isTextSection ? '#F43F5E' : section.color

        return (
          <group key={section.name}>
            <mesh position={section.position}>
              <boxGeometry args={section.size} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={opacity}
              />
            </mesh>

            {/* Section label */}
            <Text
              position={[
                section.position[0],
                section.position[1] - section.size[1] / 2 - 0.3,
                section.position[2],
              ]}
              fontSize={0.2}
              color="#94A3B8"
              anchorX="center"
              anchorY="top"
            >
              {section.label}
            </Text>

            {/* Hollowed section: malicious code block */}
            {isHollowed && isTextSection && (
              <MaliciousCodeBlock position={section.position} size={section.size} />
            )}
          </group>
        )
      })}
    </group>
  )
}

function MaliciousCodeBlock({
  position,
  size,
}: {
  position: [number, number, number]
  size: [number, number, number]
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1
      meshRef.current.scale.set(pulse, pulse, pulse)
    }
  })

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[size[0] * 0.6, size[1] * 0.6, size[2] * 0.6]} />
      <meshStandardMaterial
        color="#F43F5E"
        emissive="#9F1239"
        emissiveIntensity={0.6}
        transparent
        opacity={0.7}
      />
    </mesh>
  )
}

function InjectedThreads({
  threads,
  currentTime,
}: {
  threads: InjectedThread[]
  currentTime: number
}) {
  return (
    <group>
      {threads.map((thread) => {
        const age = (currentTime - thread.startTime) / 1000
        const progress = Math.min(age / 1.0, 1)
        const entry = thread.entryPoint
        const targetY = thread.targetSection === '.text' ? 2.5 :
          thread.targetSection === '.data' ? 0 :
          thread.targetSection === '.bss' ? 0 :
          thread.targetSection === '.rdata' ? -2.5 : -2.5

        const currentPos: [number, number, number] = [
          entry[0] + (0 - entry[0]) * progress * 0.3,
          entry[1] + (targetY - entry[1]) * progress,
          entry[2] + (0 - entry[2]) * progress * 0.3,
        ]

        const trailPoints: [number, number, number][] = []
        for (let i = 0; i < 10; i++) {
          const t = progress * (i / 10)
          trailPoints.push([
            entry[0] + (0 - entry[0]) * t * 0.3,
            entry[1] + (targetY - entry[1]) * t,
            entry[2] + (0 - entry[2]) * t * 0.3,
          ])
        }

        return (
          <group key={thread.id}>
            {/* Thread pathway (tube) */}
            {progress < 1 && trailPoints.length > 1 && (
              <Line
                points={trailPoints}
                color={thread.color}
                lineWidth={2}
                transparent
                opacity={0.7}
              />
            )}
            {progress >= 1 && (
              <Line
                points={[entry, [entry[0] * 0.7, targetY, entry[2] * 0.7]]}
                color={thread.color}
                lineWidth={2}
                transparent
                opacity={0.5}
              />
            )}
            {/* Traveling particle */}
            {progress < 1 && (
              <mesh position={currentPos}>
                <sphereGeometry args={[0.12, 8, 8]} />
                <meshBasicMaterial color={thread.color} />
              </mesh>
            )}
            {/* Active pulse */}
            {progress >= 1 && thread.isActive && (
              <mesh position={[entry[0] * 0.7, targetY, entry[2] * 0.7]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshBasicMaterial
                  color={thread.color}
                  transparent
                  opacity={0.8}
                />
              </mesh>
            )}
          </group>
        )
      })}
    </group>
  )
}

function NeuralSparks({ sparks }: { sparks: Spark[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const meshRefs = useRef<THREE.Mesh[]>([])

  useFrame(() => {
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh || !sparks[i]) return
      const s = sparks[i]
      mesh.position.set(
        s.position[0] + s.velocity[0] * (1 - s.life / s.maxLife) * 20,
        s.position[1] + s.velocity[1] * (1 - s.life / s.maxLife) * 20,
        s.position[2] + s.velocity[2] * (1 - s.life / s.maxLife) * 20
      )
      const scale = (s.life / s.maxLife) * 0.1
      mesh.scale.set(scale, scale, scale)
    })
  })

  return (
    <group ref={groupRef}>
      {sparks.map((spark, i) => (
        <mesh
          key={spark.id}
          ref={(el) => {
            if (el) meshRefs.current[i] = el
          }}
          position={spark.position}
        >
          <sphereGeometry args={[1, 4, 4]} />
          <meshBasicMaterial
            color={spark.color}
            transparent
            opacity={spark.life / spark.maxLife}
          />
        </mesh>
      ))}
    </group>
  )
}

/* ─────────────────────── SCENE ─────────────────────── */

function HollowingScene({
  isHollowed,
  sections,
  threads,
  sparks,
  currentTime,
  flashTime,
}: {
  isHollowed: boolean
  sections: MemorySection[]
  threads: InjectedThread[]
  sparks: Spark[]
  currentTime: number
  flashTime: number
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.6} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#F43F5E" />
      <ProcessContainer isHollowed={isHollowed} flashTime={flashTime} />
      <MemorySections sections={sections} isHollowed={isHollowed} />
      <InjectedThreads threads={threads} currentTime={currentTime} />
      <NeuralSparks sparks={sparks} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={8}
        maxDistance={30}
      />
    </>
  )
}

/* ─────────────────────── TIMELINE COMPONENT ─────────────────────── */

function ThreadTimeline({
  threads,
  events,
  currentTime,
  startTime,
}: {
  threads: InjectedThread[]
  events: TimelineEvent[]
  currentTime: number
  startTime: number
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const elapsed = (currentTime - startTime) / 1000
  const maxTime = Math.max(60, elapsed + 5)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = canvas.offsetWidth
    const height = canvas.offsetHeight
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = '#0F172A'
    ctx.fillRect(0, 0, width, height)

    const padding = 20
    const plotWidth = width - padding * 2 - 60
    const plotHeight = height - padding * 2

    // Y-axis labels (Thread IDs)
    ctx.fillStyle = '#64748B'
    ctx.font = '400 9px "JetBrains Mono", monospace'
    ctx.textAlign = 'right'
    threads.slice(0, 6).forEach((thread, i) => {
      const y = padding + (i / 6) * plotHeight + plotHeight / 12
      ctx.fillText(`T${thread.id}`, padding + 50, y + 3)
    })

    // X-axis
    ctx.strokeStyle = '#1E293B'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding + 60, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Time labels
    ctx.fillStyle = '#475569'
    ctx.textAlign = 'center'
    for (let t = 0; t <= maxTime; t += 10) {
      const x = padding + 60 + (t / maxTime) * plotWidth
      ctx.fillText(`${t}s`, x, height - padding + 12)
      ctx.strokeStyle = '#1E293B'
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Thread bars
    threads.slice(0, 6).forEach((thread, i) => {
      const threadStart = (thread.startTime - startTime) / 1000
      const barStart = padding + 60 + (threadStart / maxTime) * plotWidth
      const barEnd = padding + 60 + (elapsed / maxTime) * plotWidth
      const y = padding + (i / 6) * plotHeight + plotHeight / 12 - 4

      ctx.fillStyle = thread.color
      ctx.globalAlpha = 0.4
      ctx.fillRect(barStart, y, barEnd - barStart, 8)
      ctx.globalAlpha = 1.0

      // Activation diamond
      if (thread.isActive) {
        ctx.fillStyle = thread.color
        const diamondX = barEnd
        const diamondY = y + 4
        ctx.beginPath()
        ctx.moveTo(diamondX, diamondY - 4)
        ctx.lineTo(diamondX + 4, diamondY)
        ctx.lineTo(diamondX, diamondY + 4)
        ctx.lineTo(diamondX - 4, diamondY)
        ctx.closePath()
        ctx.fill()
      }
    })

    // Current time line
    const currentX = padding + 60 + (elapsed / maxTime) * plotWidth
    ctx.strokeStyle = '#06B6D4'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(currentX, padding)
    ctx.lineTo(currentX, height - padding)
    ctx.stroke()
    ctx.setLineDash([])

    // Events markers
    events.forEach((event) => {
      const eventTime = (event.time - startTime) / 1000
      if (eventTime < 0 || eventTime > elapsed) return
      const x = padding + 60 + (eventTime / maxTime) * plotWidth

      ctx.fillStyle =
        event.type === 'hollow'
          ? '#F43F5E'
          : event.type === 'inject'
            ? '#F59E0B'
            : event.type === 'activate'
              ? '#10B981'
              : '#06B6D4'

      ctx.beginPath()
      ctx.arc(x, padding - 6, 3, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [threads, events, currentTime, startTime, elapsed, maxTime])

  return <canvas ref={canvasRef} className="h-full w-full" />
}

/* ─────────────────────── MEMORY MAP COMPONENT ─────────────────────── */

function MemoryMap({
  sections,
  isHollowed,
}: {
  sections: MemorySection[]
  isHollowed: boolean
}) {
  const totalSize = sections.reduce((acc, s) => acc + s.size[0] * s.size[1] * s.size[2], 0)

  return (
    <div className="flex h-full flex-col px-2 py-1">
      <span className="mb-1 font-mono text-[10px] text-text-muted">Memory Map</span>
      <div className="flex flex-1 flex-col gap-0.5">
        {sections.map((section) => {
          const size = section.size[0] * section.size[1] * section.size[2]
          const pct = (size / totalSize) * 100
          const isText = section.name === '.text'
          return (
            <div key={section.name} className="flex items-center gap-1.5">
              <div
                className="h-3 rounded-sm"
                style={{
                  width: `${pct * 1.5}px`,
                  backgroundColor: isHollowed && isText ? '#F43F5E' : section.color,
                  opacity: isHollowed && isText ? 0.5 : 0.8,
                }}
              />
              <span className="font-mono text-[9px] text-text-muted">
                {section.name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */

export default function VizHollowing() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [hasProcess, setHasProcess] = useState(false)
  const [isHollowed, setIsHollowed] = useState(false)
  const [sections, setSections] = useState<MemorySection[]>(INITIAL_SECTIONS)
  const [threads, setThreads] = useState<InjectedThread[]>([])
  const [sparks, setSparks] = useState<Spark[]>([])
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [flashTime, setFlashTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(Date.now())
  const nextThreadId = useRef(1)
  const nextSparkId = useRef(1)
  const startTimeRef = useRef(Date.now())

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return
    const interval = setInterval(() => {
      setCurrentTime(Date.now())

      // Update sparks
      setSparks((prev) =>
        prev
          .map((s) => ({ ...s, life: s.life - 1 }))
          .filter((s) => s.life > 0)
      )
    }, 50)
    return () => clearInterval(interval)
  }, [isPlaying])

  const createProcess = useCallback(() => {
    setHasProcess(true)
    setIsHollowed(false)
    setThreads([])
    setSparks([])
    setEvents([])
    setSections(INITIAL_SECTIONS)
    startTimeRef.current = Date.now()
    setEvents((prev) => [
      ...prev,
      {
        time: Date.now(),
        threadId: 0,
        type: 'create',
        label: 'Process Created',
      },
    ])
  }, [])

  const hollowProcess = useCallback(() => {
    if (!hasProcess) return
    setIsHollowed(true)
    setFlashTime(Date.now())
    setSections((prev) =>
      prev.map((s) =>
        s.name === '.text' ? { ...s, opacity: 0.15 } : s
      )
    )
    setEvents((prev) => [
      ...prev,
      {
        time: Date.now(),
        threadId: 0,
        type: 'hollow',
        label: 'Process Hollowed',
      },
    ])

    // Emit sparks
    const newSparks: Spark[] = []
    for (let i = 0; i < 15; i++) {
      newSparks.push({
        id: nextSparkId.current++,
        position: [0, 2.5, 0],
        color: '#F43F5E',
        velocity: [
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
        ],
        life: 30 + Math.floor(Math.random() * 20),
        maxLife: 50,
      })
    }
    setSparks((prev) => [...prev, ...newSparks])
  }, [hasProcess])

  const injectThread = useCallback(() => {
    if (!hasProcess) return
    const sectionNames = ['.text', '.data', '.bss', '.rdata', 'heap']
    const target = sectionNames[Math.floor(Math.random() * sectionNames.length)]
    const color = THREAD_COLORS[threads.length % THREAD_COLORS.length]
    const entryPoints: [number, number, number][] = [
      [7, 0, 3], [-7, 0, -3], [7, 3, -5], [-7, -3, 5], [0, -6, 6],
    ]

    const newThread: InjectedThread = {
      id: nextThreadId.current++,
      color,
      entryPoint: entryPoints[threads.length % entryPoints.length],
      targetSection: target,
      startTime: Date.now(),
      isActive: false,
    }
    setThreads((prev) => [...prev, newThread])

    setTimeout(() => {
      setThreads((prev) =>
        prev.map((t) => (t.id === newThread.id ? { ...t, isActive: true } : t))
      )

      // Neural sparks on activation
      const targetY =
        target === '.text' ? 2.5 :
        target === '.data' ? 0 :
        target === '.bss' ? 0 :
        target === '.rdata' ? -2.5 : -2.5

      const newSparks: Spark[] = []
      for (let i = 0; i < 10; i++) {
        newSparks.push({
          id: nextSparkId.current++,
          position: [0, targetY, 0],
          color,
          velocity: [
            (Math.random() - 0.5) * 0.5,
            Math.random() * 0.3,
            (Math.random() - 0.5) * 0.5,
          ],
          life: 20 + Math.floor(Math.random() * 15),
          maxLife: 35,
        })
      }
      setSparks((prev) => [...prev, ...newSparks])

      setEvents((prev) => [
        ...prev,
        {
          time: Date.now(),
          threadId: newThread.id,
          type: 'activate',
          label: `Thread T${newThread.id} Activated`,
        },
      ])
    }, 1200)

    setEvents((prev) => [
      ...prev,
      {
        time: Date.now(),
        threadId: newThread.id,
        type: 'inject',
        label: `Thread T${newThread.id} Injected`,
      },
    ])
  }, [hasProcess, threads.length])

  const createRemoteThread = useCallback(() => {
    if (!hasProcess) return
    if (!isHollowed) hollowProcess()
    // Inject multiple threads
    for (let i = 0; i < 3; i++) {
      setTimeout(() => injectThread(), i * 500)
    }
  }, [hasProcess, isHollowed, hollowProcess, injectThread])

  const mapSection = useCallback(() => {
    if (!hasProcess) return
    const sectionNames = ['.text', '.data', '.bss', '.rdata', 'heap', 'stack']
    const toHighlight = sectionNames[Math.floor(Math.random() * sectionNames.length)]
    setSections((prev) =>
      prev.map((s) =>
        s.name === toHighlight ? { ...s, opacity: Math.min(s.opacity + 0.3, 1) } : s
      )
    )
  }, [hasProcess])

  const resetScene = useCallback(() => {
    setHasProcess(false)
    setIsHollowed(false)
    setThreads([])
    setSparks([])
    setEvents([])
    setFlashTime(0)
    setSections(INITIAL_SECTIONS)
    nextThreadId.current = 1
    nextSparkId.current = 1
  }, [])

  return (
    <div className="flex h-[100dvh] flex-col bg-bg-void">
      {/* Control Bar */}
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border-subtle bg-bg-surface px-4">
        <Link
          to="/visualizations"
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent-cyan"
        >
          <ArrowLeft size={16} />
        </Link>
        <Cpu size={18} className="text-accent-amber" />
        <h1 className="font-display text-base font-bold text-text-primary">
          Process Hollowing
        </h1>
        <span className="font-mono text-xs text-accent-amber">
          OpenFOAM + NEURON → Injection Simulation
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={createProcess}
            size="sm"
            className="bg-accent-cyan text-bg-deep hover:bg-accent-cyan/90"
          >
            <Layers size={14} className="mr-1" />
            Create Process
          </Button>
          <Button
            onClick={hollowProcess}
            size="sm"
            disabled={!hasProcess}
            className="bg-accent-rose text-white hover:bg-accent-rose/90 disabled:opacity-30"
          >
            <Code size={14} className="mr-1" />
            Hollow Process
          </Button>
          <Button
            onClick={injectThread}
            size="sm"
            disabled={!hasProcess}
            className="bg-accent-amber text-bg-deep hover:bg-accent-amber/90 disabled:opacity-30"
          >
            <Zap size={14} className="mr-1" />
            Inject Thread
          </Button>
          <Button
            onClick={createRemoteThread}
            size="sm"
            disabled={!hasProcess}
            className="bg-accent-violet text-white hover:bg-accent-violet/90 disabled:opacity-30"
          >
            <Activity size={14} className="mr-1" />
            CreateRemoteThread
          </Button>
          <Button
            onClick={mapSection}
            size="sm"
            disabled={!hasProcess}
            variant="outline"
            className="border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30"
          >
            Map Section
          </Button>
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            variant="outline"
            size="sm"
            className="border-border-subtle text-text-secondary hover:text-text-primary"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </Button>
          <Button
            onClick={resetScene}
            variant="outline"
            size="sm"
            className="border-border-subtle text-text-secondary hover:text-text-primary"
          >
            <RotateCcw size={14} />
          </Button>
        </div>
      </div>

      {/* Main 3D Viewer */}
      <div className="relative flex-1">
        <Canvas camera={{ position: [12, 8, 12], fov: 50 }}>
          <HollowingScene
            isHollowed={isHollowed}
            sections={sections}
            threads={threads}
            sparks={sparks}
            currentTime={currentTime}
            flashTime={flashTime}
          />
        </Canvas>

        {/* Info overlay */}
        <AnimatePresence>
          {isHollowed && (
            <motion.div
              className="absolute right-4 top-4 rounded-lg border border-accent-rose/30 bg-bg-surface/90 px-4 py-2 backdrop-blur-sm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="font-mono text-xs text-accent-rose">
                PROCESS HOLLOWED — Code Injected
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {threads.filter((t) => t.isActive).length > 0 && (
            <motion.div
              className="absolute left-4 top-4 rounded-lg border border-accent-amber/30 bg-bg-surface/90 px-4 py-2 backdrop-blur-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
            >
              <span className="font-mono text-xs text-accent-amber">
                {threads.filter((t) => t.isActive).length} Active Thread
                {threads.filter((t) => t.isActive).length > 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Panel: Timeline + Memory Map */}
      <div className="flex h-[30%] shrink-0 border-t border-border-subtle">
        {/* Thread Timeline */}
        <div className="flex w-3/4 flex-col border-r border-border-subtle">
          <div className="flex items-center justify-between border-b border-border-subtle bg-bg-deep px-3 py-1.5">
            <span className="font-mono text-xs text-text-muted">
              Thread Timeline
            </span>
            <span className="font-mono text-[10px] text-text-muted">
              {((currentTime - startTimeRef.current) / 1000).toFixed(0)}s elapsed
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ThreadTimeline
              threads={threads}
              events={events}
              currentTime={currentTime}
              startTime={startTimeRef.current}
            />
          </div>
        </div>

        {/* Memory Map */}
        <div className="flex w-1/4 flex-col">
          <div className="border-b border-border-subtle bg-bg-deep px-3 py-1.5">
            <span className="font-mono text-xs text-text-muted">
              Memory Layout
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            <MemoryMap sections={sections} isHollowed={isHollowed} />
          </div>
        </div>
      </div>
    </div>
  )
}
