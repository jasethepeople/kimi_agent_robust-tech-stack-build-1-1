import { useState, useCallback, useRef, useMemo } from 'react'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import type { Mesh } from 'three'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import {
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Copy,
  ChevronUp,
  ChevronDown,
  Terminal,
  Check,
  FlaskConical,
  Waves,
  Dna,
  Atom,
  BarChart3,
  Globe,
  Sparkles,
  Wind,
} from 'lucide-react'

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

interface SimParam {
  key: string
  label: string
  type: 'slider' | 'toggle'
  min?: number
  max?: number
  step?: number
  defaultValue: number | boolean
  unit?: string
}

interface ToolDef {
  id: string
  name: string
  layer: number
  layerLabel: string
  icon: React.ElementType
  params: SimParam[]
  presets: Record<string, Record<string, number | boolean>>
}

interface ConsoleLine {
  id: string
  timestamp: string
  text: string
  type: 'command' | 'output' | 'success' | 'warning' | 'error'
}

/* ──────────────────────────────────────────────
   Tool Data
   ────────────────────────────────────────────── */

const LAYER_COLORS: Record<number, { main: string; dim: string; glow: string }> = {
  1: { main: '#F43F5E', dim: '#9F1239', glow: 'rgba(244,63,94,0.15)' },
  2: { main: '#F59E0B', dim: '#92400E', glow: 'rgba(245,158,11,0.15)' },
  3: { main: '#8B5CF6', dim: '#5B21B6', glow: 'rgba(139,92,246,0.15)' },
  4: { main: '#10B981', dim: '#065F46', glow: 'rgba(16,185,129,0.15)' },
}

const TOOLS: ToolDef[] = [
  {
    id: 'lammps',
    name: 'LAMMPS',
    layer: 1,
    layerLabel: 'LAYER 1 — EXPLOITATION & PATCHING',
    icon: Atom,
    params: [
      { key: 'stack_depth', label: 'Stack Frame Depth', type: 'slider', min: 1, max: 64, step: 1, defaultValue: 16 },
      { key: 'buffer_size', label: 'Buffer Allocation Size', type: 'slider', min: 8, max: 4096, step: 8, defaultValue: 256, unit: 'bytes' },
      { key: 'overflow_size', label: 'Overflow Payload Size', type: 'slider', min: 0, max: 8192, step: 16, defaultValue: 512, unit: 'bytes' },
      { key: 'nop_sled_ratio', label: 'NOP Sled Ratio', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
      { key: 'canary_enabled', label: 'Stack Canary', type: 'toggle', defaultValue: true },
      { key: 'aslr_level', label: 'ASLR Entropy', type: 'slider', min: 0, max: 32, step: 1, defaultValue: 16, unit: 'bits' },
    ],
    presets: {
      Default: { stack_depth: 16, buffer_size: 256, overflow_size: 512, nop_sled_ratio: 0.3, canary_enabled: true, aslr_level: 16 },
      Aggressive: { stack_depth: 32, buffer_size: 64, overflow_size: 2048, nop_sled_ratio: 0.7, canary_enabled: false, aslr_level: 4 },
      Stealth: { stack_depth: 4, buffer_size: 1024, overflow_size: 128, nop_sled_ratio: 0.05, canary_enabled: true, aslr_level: 32 },
    },
  },
  {
    id: 'openfoam',
    name: 'OpenFOAM',
    layer: 2,
    layerLabel: 'LAYER 2 — NETWORK & FLOW',
    icon: Waves,
    params: [
      { key: 'traffic_rate', label: 'Traffic Volume', type: 'slider', min: 0.1, max: 1000, step: 0.1, defaultValue: 10, unit: 'Gbps' },
      { key: 'attack_vectors', label: 'Concurrent Attack Vectors', type: 'slider', min: 1, max: 16, step: 1, defaultValue: 4 },
      { key: 'mitigation_response', label: 'Mitigation Response Time', type: 'slider', min: 1, max: 10000, step: 1, defaultValue: 100, unit: 'ms' },
      { key: 'topology_mesh', label: 'Network Mesh Density', type: 'slider', min: 10, max: 10000, step: 10, defaultValue: 1000, unit: 'nodes' },
      { key: 'fluid_viscosity', label: 'Equivalent Viscosity', type: 'slider', min: 0.001, max: 10, step: 0.001, defaultValue: 0.1 },
    ],
    presets: {
      Default: { traffic_rate: 10, attack_vectors: 4, mitigation_response: 100, topology_mesh: 1000, fluid_viscosity: 0.1 },
      Aggressive: { traffic_rate: 500, attack_vectors: 12, mitigation_response: 10, topology_mesh: 500, fluid_viscosity: 0.5 },
      Stealth: { traffic_rate: 1, attack_vectors: 1, mitigation_response: 5000, topology_mesh: 8000, fluid_viscosity: 0.01 },
    },
  },
  {
    id: 'bioc',
    name: 'Bioconductor',
    layer: 4,
    layerLabel: 'LAYER 4 — BIOLOGICAL & GENETIC',
    icon: Dna,
    params: [
      { key: 'sequence_length', label: 'Sequence Length', type: 'slider', min: 100, max: 100000, step: 100, defaultValue: 10000, unit: 'bp' },
      { key: 'mutation_rate', label: 'Mutation Rate', type: 'slider', min: 0, max: 0.1, step: 0.0001, defaultValue: 0.001 },
      { key: 'primer_matches', label: 'Primer Matches', type: 'slider', min: 0, max: 50, step: 1, defaultValue: 8 },
      { key: 'gene_coverage', label: 'Gene Coverage', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.85 },
    ],
    presets: {
      Default: { sequence_length: 10000, mutation_rate: 0.001, primer_matches: 8, gene_coverage: 0.85 },
      Aggressive: { sequence_length: 50000, mutation_rate: 0.05, primer_matches: 2, gene_coverage: 0.2 },
      Stealth: { sequence_length: 5000, mutation_rate: 0.0001, primer_matches: 20, gene_coverage: 0.98 },
    },
  },
  {
    id: 'wrf',
    name: 'WRF-ARW',
    layer: 2,
    layerLabel: 'LAYER 2 — NETWORK & FLOW',
    icon: Wind,
    params: [
      { key: 'grid_resolution', label: 'Grid Resolution', type: 'slider', min: 1, max: 100, step: 1, defaultValue: 12, unit: 'km' },
      { key: 'threat_fronts', label: 'Threat Fronts', type: 'slider', min: 1, max: 20, step: 1, defaultValue: 3 },
      { key: 'sim_hours', label: 'Simulation Hours', type: 'slider', min: 1, max: 168, step: 1, defaultValue: 24, unit: 'h' },
      { key: 'ensemble_size', label: 'Ensemble Size', type: 'slider', min: 1, max: 50, step: 1, defaultValue: 10 },
    ],
    presets: {
      Default: { grid_resolution: 12, threat_fronts: 3, sim_hours: 24, ensemble_size: 10 },
      Aggressive: { grid_resolution: 3, threat_fronts: 15, sim_hours: 72, ensemble_size: 30 },
      Stealth: { grid_resolution: 50, threat_fronts: 1, sim_hours: 6, ensemble_size: 3 },
    },
  },
  {
    id: 'stan',
    name: 'Stan',
    layer: 3,
    layerLabel: 'LAYER 3 — COGNITIVE & STATISTICAL',
    icon: BarChart3,
    params: [
      { key: 'mcmc_iterations', label: 'MCMC Iterations', type: 'slider', min: 100, max: 100000, step: 100, defaultValue: 10000 },
      { key: 'chain_count', label: 'Parallel Chains', type: 'slider', min: 1, max: 16, step: 1, defaultValue: 4 },
      { key: 'warmup_ratio', label: 'Warmup Ratio', type: 'slider', min: 0.1, max: 0.9, step: 0.01, defaultValue: 0.5 },
      { key: 'adapt_delta', label: 'Adapt Delta', type: 'slider', min: 0.5, max: 0.99, step: 0.001, defaultValue: 0.8 },
    ],
    presets: {
      Default: { mcmc_iterations: 10000, chain_count: 4, warmup_ratio: 0.5, adapt_delta: 0.8 },
      Aggressive: { mcmc_iterations: 50000, chain_count: 8, warmup_ratio: 0.3, adapt_delta: 0.95 },
      Stealth: { mcmc_iterations: 2000, chain_count: 2, warmup_ratio: 0.7, adapt_delta: 0.6 },
    },
  },
  {
    id: 'netlogo',
    name: 'NetLogo',
    layer: 2,
    layerLabel: 'LAYER 2 — NETWORK & FLOW',
    icon: Globe,
    params: [
      { key: 'agent_count', label: 'Agent Count', type: 'slider', min: 10, max: 10000, step: 10, defaultValue: 500 },
      { key: 'infection_rate', label: 'Infection Rate', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.15 },
      { key: 'recovery_time', label: 'Recovery Time', type: 'slider', min: 1, max: 100, step: 1, defaultValue: 14, unit: 'ticks' },
      { key: 'network_density', label: 'Network Density', type: 'slider', min: 0, max: 1, step: 0.01, defaultValue: 0.3 },
    ],
    presets: {
      Default: { agent_count: 500, infection_rate: 0.15, recovery_time: 14, network_density: 0.3 },
      Aggressive: { agent_count: 5000, infection_rate: 0.8, recovery_time: 3, network_density: 0.8 },
      Stealth: { agent_count: 100, infection_rate: 0.01, recovery_time: 50, network_density: 0.05 },
    },
  },
  {
    id: 'gadget',
    name: 'GADGET',
    layer: 2,
    layerLabel: 'LAYER 2 — NETWORK & FLOW',
    icon: Sparkles,
    params: [
      { key: 'body_count', label: 'Orbiting Bodies', type: 'slider', min: 2, max: 1000, step: 1, defaultValue: 50 },
      { key: 'time_step', label: 'Time Step', type: 'slider', min: 0.001, max: 1, step: 0.001, defaultValue: 0.01 },
      { key: 'gravitational_const', label: 'Gravitational Constant', type: 'slider', min: 0.1, max: 100, step: 0.1, defaultValue: 6.67 },
      { key: 'softening_length', label: 'Softening Length', type: 'slider', min: 0.001, max: 10, step: 0.001, defaultValue: 0.1 },
    ],
    presets: {
      Default: { body_count: 50, time_step: 0.01, gravitational_const: 6.67, softening_length: 0.1 },
      Aggressive: { body_count: 500, time_step: 0.1, gravitational_const: 50, softening_length: 0.001 },
      Stealth: { body_count: 10, time_step: 0.001, gravitational_const: 1, softening_length: 5 },
    },
  },
  {
    id: 'qe',
    name: 'Quantum ESPRESSO',
    layer: 3,
    layerLabel: 'LAYER 3 — COGNITIVE & STATISTICAL',
    icon: FlaskConical,
    params: [
      { key: 'cutoff_energy', label: 'Cutoff Energy', type: 'slider', min: 10, max: 200, step: 1, defaultValue: 50, unit: 'Ry' },
      { key: 'kpoint_grid', label: 'K-Point Grid', type: 'slider', min: 1, max: 20, step: 1, defaultValue: 6 },
      { key: 'mixing_beta', label: 'Mixing Beta', type: 'slider', min: 0.1, max: 0.9, step: 0.01, defaultValue: 0.7 },
      { key: 'conv_threshold', label: 'Convergence Threshold', type: 'slider', min: 1e-10, max: 1e-4, step: 1e-10, defaultValue: 1e-6 },
    ],
    presets: {
      Default: { cutoff_energy: 50, kpoint_grid: 6, mixing_beta: 0.7, conv_threshold: 1e-6 },
      Aggressive: { cutoff_energy: 150, kpoint_grid: 12, mixing_beta: 0.3, conv_threshold: 1e-8 },
      Stealth: { cutoff_energy: 20, kpoint_grid: 2, mixing_beta: 0.9, conv_threshold: 1e-4 },
    },
  },
]

/* ──────────────────────────────────────────────
   Code Generation
   ────────────────────────────────────────────── */

function generateCode(tool: ToolDef, values: Record<string, number | boolean>): string {
  const cfg = tool.params.map(p => {
    const v = values[p.key]
    const comment = p.unit ? `  # ${p.label} (${p.unit})` : `  # ${p.label}`
    if (typeof v === 'boolean') {
      return `    "${p.key}": ${v},${comment}`
    }
    if (p.step && p.step < 1) {
      return `    "${p.key}": ${v.toFixed(p.step < 0.001 ? 6 : 3)},${comment}`
    }
    return `    "${p.key}": ${v},${comment}`
  }).join('\n')

  return `# Scientisec Simulation — ${tool.name} Security Analysis
# Generated by Simulation Workbench

from scientisec.${tool.id.toLowerCase()} import SecuritySimulator

sim = SecuritySimulator()

# ${tool.layerLabel}
sim.configure({
${cfg}
})

# Run simulation
result = sim.run_analysis()
print(f"Analysis complete: {result.summary}")
print(f"Risk score: {result.risk_score:.2f}/100")
print(f"Recommendations: {len(result.recommendations)}")`
}

/* ──────────────────────────────────────────────
   3D Preview Scene
   ────────────────────────────────────────────── */

function PreviewScene({ toolId }: { toolId: string }) {
  const groupRef = useRef<Mesh>(null)
  const particlesRef = useRef<Mesh>(null)
  const time = useRef(0)

  useFrame((_, delta) => {
    time.current += delta
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.15
    }
    if (particlesRef.current) {
      particlesRef.current.rotation.x = Math.sin(time.current * 0.3) * 0.2
      particlesRef.current.rotation.y += delta * 0.25
    }
  })

  const color = useMemo(() => {
    switch (toolId) {
      case 'lammps': return '#F43F5E'
      case 'openfoam': return '#06B6D4'
      case 'bioc': return '#10B981'
      case 'wrf': return '#F59E0B'
      case 'stan': return '#8B5CF6'
      case 'netlogo': return '#F59E0B'
      case 'gadget': return '#F59E0B'
      case 'qe': return '#8B5CF6'
      default: return '#06B6D4'
    }
  }, [toolId])

  const particles = useMemo(() => {
    const pts: [number, number, number][] = []
    const count = 40
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 1.5 + Math.random() * 2
      pts.push([
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ])
    }
    return pts
  }, [toolId])

  return (
    <>
      <color attach="background" args={['#030712']} />
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} color={color} />
      <pointLight position={[-5, -3, 2]} intensity={0.5} color="#06B6D4" />
      <Stars radius={50} depth={50} count={800} factor={3} fade speed={0.5} />

      {/* Main structure */}
      <mesh ref={groupRef}>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial
          color={color}
          wireframe
          transparent
          opacity={0.3}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Inner core */}
      <mesh>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.15}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* Orbiting particles */}
      <group ref={particlesRef}>
        {particles.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
            />
          </mesh>
        ))}
      </group>

      {/* Ground grid */}
      <gridHelper args={[20, 40, color, '#1E293B']} position={[0, -4, 0]} />

      <OrbitControls enableZoom enablePan={false} autoRotate autoRotateSpeed={0.5} />
    </>
  )
}

/* ──────────────────────────────────────────────
   Console Hook
   ────────────────────────────────────────────── */

function useConsole() {
  const [lines, setLines] = useState<ConsoleLine[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const addLine = useCallback((text: string, type: ConsoleLine['type'] = 'output') => {
    const now = new Date()
    const ts = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
    setLines(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, timestamp: ts, text, type }])
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const runSimulation = useCallback((tool: ToolDef, values: Record<string, number | boolean>) => {
    if (isRunning) return
    setIsRunning(true)
    setProgress(0)
    clear()

    const entries = Object.entries(values)
    const lines: { text: string; type: ConsoleLine['type']; delay: number }[] = [
      { text: `Initializing ${tool.name} Security Simulator...`, type: 'command', delay: 0 },
      { text: 'Loading parameter configuration...', type: 'output', delay: 200 },
      ...entries.flatMap(([k, v], i) => [
        { text: `  ${k}: ${typeof v === 'boolean' ? v : v}`, type: 'output' as const, delay: 100 + i * 50 },
      ]),
      { text: 'Building simulation model...', type: 'output', delay: 300 },
      { text: 'Running security analysis...', type: 'output', delay: 500 },
      { text: 'Processing results...', type: 'output', delay: 400 },
      { text: '\u2713 Simulation complete', type: 'success', delay: 200 },
      { text: 'Results:', type: 'output', delay: 100 },
      { text: `  Risk score: ${(Math.random() * 40 + 30).toFixed(1)}/100`, type: 'success', delay: 100 },
      { text: `  Vulnerabilities found: ${Math.floor(Math.random() * 8 + 2)}`, type: 'warning', delay: 100 },
      { text: `  Analysis time: ${(Math.random() * 2 + 0.5).toFixed(2)}s`, type: 'output', delay: 100 },
      { text: `  Recommendations: ${Math.floor(Math.random() * 5 + 1)} items`, type: 'success', delay: 100 },
    ]

    let cumulativeDelay = 0
    let lineIndex = 0

    lines.forEach((line) => {
      cumulativeDelay += line.delay
      const prog = Math.min(100, Math.round((lineIndex / lines.length) * 100))
      setTimeout(() => {
        addLine(line.text, line.type)
        setProgress(prog)
        scrollToBottom()
      }, cumulativeDelay)
      lineIndex++
    })

    setTimeout(() => {
      setProgress(100)
      setIsRunning(false)
    }, cumulativeDelay + 200)
  }, [isRunning, clear, addLine, scrollToBottom])

  return { lines, isRunning, progress, addLine, clear, runSimulation, bottomRef, scrollToBottom }
}

/* ──────────────────────────────────────────────
   Main Workbench Component
   ────────────────────────────────────────────── */

export default function Workbench() {
  const [selectedTool, setSelectedTool] = useState<ToolDef>(TOOLS[0])
  const [paramValues, setParamValues] = useState<Record<string, number | boolean>>(() => {
    const initial: Record<string, number | boolean> = {}
    TOOLS[0].params.forEach(p => { initial[p.key] = p.defaultValue })
    return initial
  })
  const [activePreset, setActivePreset] = useState<string>('Custom')
  const [codeExpanded, setCodeExpanded] = useState(true)
  const [copied, setCopied] = useState(false)
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set())
  const [previewPlaying, setPreviewPlaying] = useState(true)
  const [consoleHeight, setConsoleHeight] = useState(300)
  const isDragging = useRef(false)

  const { lines, isRunning, progress, clear, runSimulation, bottomRef } = useConsole()

  const layerColor = LAYER_COLORS[selectedTool.layer] || LAYER_COLORS[1]

  // Update param values when tool changes
  const handleToolSelect = useCallback((tool: ToolDef) => {
    setSelectedTool(tool)
    const newValues: Record<string, number | boolean> = {}
    tool.params.forEach(p => { newValues[p.key] = p.defaultValue })
    setParamValues(newValues)
    setActivePreset('Default')
    clear()
  }, [clear])

  // Update a parameter value
  const updateParam = useCallback((key: string, value: number | boolean) => {
    setParamValues(prev => ({ ...prev, [key]: value }))
    setActivePreset('Custom')
    setChangedKeys(prev => {
      const next = new Set(prev)
      next.add(key)
      setTimeout(() => {
        setChangedKeys(p => { const n = new Set(p); n.delete(key); return n })
      }, 800)
      return next
    })
  }, [])

  // Apply a preset
  const applyPreset = useCallback((presetName: string) => {
    const preset = selectedTool.presets[presetName]
    if (!preset) return
    setActivePreset(presetName)
    setParamValues(prev => {
      const next = { ...prev }
      Object.entries(preset).forEach(([k, v]) => { next[k] = v })
      return next
    })
  }, [selectedTool])

  // Copy code
  const handleCopy = useCallback(() => {
    const code = generateCode(selectedTool, paramValues)
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [selectedTool, paramValues])

  // Console drag handle
  const handleDragStart = useCallback(() => { isDragging.current = true }, [])
  const handleDragEnd = useCallback(() => { isDragging.current = false }, [])
  const handleDragMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return
    const newH = Math.max(150, Math.min(600, window.innerHeight - e.clientY))
    setConsoleHeight(newH)
  }, [])

  // Generated code
  const generatedCode = useMemo(
    () => generateCode(selectedTool, paramValues),
    [selectedTool, paramValues]
  )

  // Group tools by layer
  const toolsByLayer = useMemo(() => {
    const groups: Record<number, ToolDef[]> = {}
    TOOLS.forEach(t => {
      if (!groups[t.layer]) groups[t.layer] = []
      groups[t.layer].push(t)
    })
    return groups
  }, [])

  return (
    <TooltipProvider>
      <div
        className="min-h-[100dvh] bg-bg-deep"
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
      >
        {/* ═══════ Section 1: Header ═══════ */}
        <section className="relative overflow-hidden border-b border-border-subtle" style={{ height: 120 }}>
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: 'url(/hero-workbench.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              mixBlendMode: 'overlay',
            }}
          />
          <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-sm text-text-muted"
            >
              <Link to="/" className="text-accent-cyan hover:underline">Dashboard</Link>
              <span>/</span>
              <span>{selectedTool.name}</span>
              <span>/</span>
              <span>Workbench</span>
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="font-display text-3xl font-bold text-text-primary md:text-4xl lg:text-[48px]"
            >
              Simulation Workbench
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-1 max-w-[600px] text-base text-text-secondary"
            >
              Configure parameters, generate simulation code, and execute security scenarios across all four layers.
            </motion.p>
          </div>
        </section>

        {/* ═══════ Section 2: Tool Selection Panel ═══════ */}
        <section className="border-b border-border-subtle bg-bg-surface" style={{ height: 80 }}>
          <div className="mx-auto flex h-full max-w-7xl items-center gap-2 overflow-x-auto px-6 scrollbar-none lg:px-8" style={{ padding: '16px 24px' }}>
            {Object.entries(toolsByLayer).map(([layerNum, tools]) => (
              <div key={layerNum} className="flex items-center gap-2 shrink-0">
                <span
                  className="shrink-0 rounded-full"
                  style={{
                    width: 6,
                    height: 6,
                    backgroundColor: LAYER_COLORS[Number(layerNum)]?.main || '#06B6D4',
                  }}
                />
                {tools.map(tool => {
                  const isActive = tool.id === selectedTool.id
                  const tc = LAYER_COLORS[Number(layerNum)]
                  return (
                    <Tooltip key={tool.id}>
                      <TooltipTrigger asChild>
                        <motion.button
                          whileTap={{ scale: 1.05 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                          onClick={() => handleToolSelect(tool)}
                          className="shrink-0 rounded-full border font-mono text-xs font-medium transition-all duration-200"
                          style={{
                            height: 44,
                            padding: '0 16px',
                            borderRadius: 22,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 12,
                            fontWeight: 500,
                            backgroundColor: isActive
                              ? `${tc?.main}26`
                              : 'var(--bg-elevated)',
                            color: isActive ? tc?.main : 'var(--text-secondary)',
                            borderColor: isActive
                              ? `${tc?.main}4D`
                              : 'var(--border-subtle)',
                            borderLeftWidth: isActive ? 3 : 1,
                            borderLeftColor: isActive ? tc?.main : 'var(--border-subtle)',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) {
                              (e.target as HTMLElement).style.backgroundColor = `${tc?.main}14`
                            }
                          }}
                          onMouseLeave={e => {
                            if (!isActive) {
                              (e.target as HTMLElement).style.backgroundColor = 'var(--bg-elevated)'
                            }
                          }}
                        >
                          {tool.name}
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{tool.layerLabel}</p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>
        </section>

        {/* ═══════ Section 3: Parameter Configuration (40/60 Split) ═══════ */}
        <section className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row" style={{ minHeight: 600 }}>

            {/* ─── Left Panel: Parameter Controls (40%) ─── */}
            <div className="w-full md:w-[40%] shrink-0">
              <div className="mb-3">
                <span
                  className="font-mono text-xs font-medium uppercase tracking-[2px]"
                  style={{
                    color: layerColor.main,
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  {selectedTool.layerLabel}
                </span>
              </div>

              <div className="space-y-5">
                {selectedTool.params.map(param => (
                  <div key={param.key} className="space-y-2">
                    {param.type === 'toggle' ? (
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-text-primary">{param.label}</span>
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={!!paramValues[param.key]}
                            onCheckedChange={(checked) => updateParam(param.key, checked)}
                          />
                          <span className="text-sm text-text-secondary">
                            {paramValues[param.key] ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-text-primary">{param.label}</span>
                          <span
                            className="font-mono text-xs"
                            style={{
                              color: '#06B6D4',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            {typeof paramValues[param.key] === 'number'
                              ? (param.step && param.step < 1)
                                ? (paramValues[param.key] as number).toFixed(3)
                                : paramValues[param.key]
                              : paramValues[param.key]}
                            {param.unit ? ` ${param.unit}` : ''}
                          </span>
                        </div>
                        <Slider
                          min={param.min}
                          max={param.max}
                          step={param.step}
                          value={[paramValues[param.key] as number]}
                          onValueChange={([v]) => updateParam(param.key, v)}
                        />
                        <div className="flex justify-between text-xs text-text-muted">
                          <span>{param.min}{param.unit ? ` ${param.unit}` : ''}</span>
                          <span>{param.max}{param.unit ? ` ${param.unit}` : ''}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>

              {/* Preset Buttons */}
              <div className="mt-6 flex flex-wrap gap-2">
                {['Default', 'Aggressive', 'Stealth'].map(preset => (
                  <button
                    key={preset}
                    onClick={() => applyPreset(preset)}
                    className="rounded-md px-3 text-sm font-medium transition-all duration-200"
                    style={{
                      height: 32,
                      padding: '0 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: activePreset === preset ? '#06B6D4' : 'transparent',
                      color: activePreset === preset ? '#030712' : 'var(--text-secondary)',
                      border: activePreset === preset
                        ? '1px solid #06B6D4'
                        : '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={e => {
                      if (activePreset !== preset) {
                        (e.target as HTMLElement).style.borderColor = '#06B6D4'
                        ;(e.target as HTMLElement).style.color = '#06B6D4'
                      }
                    }}
                    onMouseLeave={e => {
                      if (activePreset !== preset) {
                        (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'
                        ;(e.target as HTMLElement).style.color = 'var(--text-secondary)'
                      }
                    }}
                  >
                    {preset}
                  </button>
                ))}
                <span
                  className="flex items-center rounded-md px-3 text-xs font-medium"
                  style={{
                    height: 32,
                    backgroundColor: activePreset === 'Custom' ? 'rgba(6,182,212,0.15)' : 'transparent',
                    color: activePreset === 'Custom' ? '#06B6D4' : 'var(--text-muted)',
                    border: '1px dashed var(--border-subtle)',
                  }}
                >
                  Custom
                </span>
              </div>

              {/* Live Parameter Readout */}
              <div
                className="mt-6 overflow-auto rounded-md border border-border-subtle p-3"
                style={{
                  backgroundColor: 'var(--bg-void)',
                  maxHeight: 200,
                }}
              >
                <pre className="font-mono text-xs leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {Object.entries(paramValues).map(([key, value]) => (
                    <div
                      key={key}
                      className="transition-colors duration-500"
                      style={{
                        backgroundColor: changedKeys.has(key) ? 'rgba(6,182,212,0.12)' : 'transparent',
                        borderRadius: 3,
                        padding: '1px 4px',
                      }}
                    >
                      <span className="text-text-muted">{key}</span>
                      <span className="text-text-muted">: </span>
                      <span style={{ color: '#06B6D4' }}>
                        {typeof value === 'boolean' ? String(value) : value}
                      </span>
                    </div>
                  ))}
                </pre>
              </div>
            </div>

            {/* ─── Right Panel: Live Preview (60%) ─── */}
            <div className="relative w-full md:w-[60%]">
              <div
                className="relative overflow-hidden rounded-lg border border-border-subtle"
                style={{
                  backgroundColor: 'var(--bg-void)',
                  minHeight: 500,
                  height: '100%',
                }}
              >
                {/* FPS / Info Overlay */}
                <div
                  className="pointer-events-none absolute left-4 top-4 z-10"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  <div>{selectedTool.name}</div>
                  <div className="text-accent-emerald">~60 FPS</div>
                </div>

                {/* 3D Canvas */}
                <Canvas
                  style={{ width: '100%', height: '100%', minHeight: 500 }}
                  camera={{ position: [0, 0, 7], fov: 50 }}
                >
                  <PreviewScene toolId={selectedTool.id} />
                </Canvas>

                {/* Preview Controls Overlay */}
                <div
                  className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-lg px-4 py-2"
                  style={{
                    backgroundColor: 'rgba(30,41,59,0.8)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <button
                    onClick={() => setPreviewPlaying(!previewPlaying)}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary"
                    aria-label={previewPlaying ? 'Pause' : 'Play'}
                  >
                    {previewPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary"
                    aria-label="Reset"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-text-primary"
                    aria-label="Fullscreen"
                  >
                    <Maximize size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* ═══════ Section 4: Code Preview Panel ═══════ */}
        <section className="border-y border-border-subtle" style={{ backgroundColor: 'var(--bg-void)' }}>
          <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">
            {/* Panel Header */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-text-primary">Generated Code</h2>
                <Badge
                  variant="outline"
                  className="border-accent-cyan/40 text-accent-cyan"
                >
                  Python
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-xs text-text-secondary hover:text-text-primary"
                  onClick={handleCopy}
                >
                  {copied ? <Check size={14} className="text-accent-emerald" /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-8 w-8 text-text-secondary hover:text-text-primary"
                  onClick={() => setCodeExpanded(!codeExpanded)}
                >
                  {codeExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </div>
            </div>

            {/* Code Block */}
            <AnimatePresence>
              {codeExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  className="overflow-hidden"
                >
                  <ScrollArea className="rounded-lg border border-border-subtle" style={{ maxHeight: 400 }}>
                    <SyntaxHighlighter
                      language="python"
                      style={atomDark}
                      customStyle={{
                        margin: 0,
                        padding: '20px 24px',
                        fontSize: 14,
                        lineHeight: 1.6,
                        fontFamily: "'JetBrains Mono', monospace",
                        backgroundColor: 'transparent',
                      }}
                      showLineNumbers
                      lineNumberStyle={{
                        color: 'var(--text-muted)',
                        minWidth: 40,
                        fontSize: 12,
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {generatedCode}
                    </SyntaxHighlighter>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* ═══════ Section 5: Execution Console ═══════ */}
        <section className="border-t border-border-subtle">
          {/* Drag Handle */}
          <div
            className="flex h-1 cursor-row-resize items-center justify-center bg-border-subtle hover:bg-accent-cyan/50 transition-colors"
            onMouseDown={handleDragStart}
          />

          {/* Console Header */}
          <div
            className="flex items-center justify-between border-b border-border-subtle px-4"
            style={{
              height: 40,
              backgroundColor: 'var(--bg-surface)',
            }}
          >
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-text-muted" />
              <span className="text-sm font-semibold text-text-primary">Console</span>
              {isRunning && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-accent-emerald opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-emerald" />
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs text-text-secondary hover:text-text-primary"
                onClick={clear}
              >
                Clear
              </Button>
              <Button
                size="sm"
                className="h-7 gap-1.5 bg-accent-cyan text-xs font-medium hover:bg-accent-cyan/90"
                style={{ color: 'var(--bg-void)' }}
                onClick={() => runSimulation(selectedTool, paramValues)}
                disabled={isRunning}
              >
                {isRunning ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-bg-void border-t-transparent" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    Run Simulation
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <Progress value={progress} className="h-0.5 rounded-none" />
          )}

          {/* Console Output */}
          <div
            style={{
              backgroundColor: 'var(--bg-void)',
              height: consoleHeight,
              overflow: 'auto',
            }}
          >
            <ScrollArea style={{ height: consoleHeight }}>
              <div className="p-4 font-mono text-xs leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {lines.length === 0 && (
                  <span className="text-text-muted">
                    <span style={{ color: '#06B6D4' }}>scientisec&gt;</span> Ready. Click &quot;Run Simulation&quot; to start.
                  </span>
                )}
                {lines.map(line => (
                  <div key={line.id} className="mb-0.5">
                    <span className="text-text-muted">[{line.timestamp}] </span>
                    <span style={{ color: '#06B6D4' }}>scientisec&gt; </span>
                    <span
                      className={
                        line.type === 'success' ? 'text-accent-emerald'
                        : line.type === 'warning' ? 'text-accent-amber'
                        : line.type === 'error' ? 'text-accent-rose'
                        : 'text-text-secondary'
                      }
                    >
                      {line.text}
                    </span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>
          </div>
        </section>
      </div>
    </TooltipProvider>
  )
}
