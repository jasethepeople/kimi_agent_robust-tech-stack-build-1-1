import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Link } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { ArrowLeft, Dna, Sparkles, RotateCcw, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

/* ─────────────────────── TYPES ─────────────────────── */

type Base = 'A' | 'T' | 'C' | 'G'

interface Mutation {
  id: number
  position: number
  oldBase: Base
  newBase: Base
  timestamp: number
  isLLM: boolean
}

interface TreeNode {
  id: string
  parentId: string | null
  mutations: Mutation[]
  x: number
  y: number
  label: string
  children: string[]
}

/* ─────────────────────── CONSTANTS ─────────────────────── */

const BASE_COLORS: Record<Base, string> = {
  A: '#F43F5E',
  T: '#06B6D4',
  C: '#10B981',
  G: '#F59E0B',
}

const BASE_PAIRS: Record<Base, Base> = { A: 'T', T: 'A', C: 'G', G: 'C' }

const BASE_SEQUENCE: Base[] = Array.from({ length: 1000 }, () => {
  const bases: Base[] = ['A', 'T', 'C', 'G']
  return bases[Math.floor(Math.random() * 4)]
})

const SELECTION_PRESSURES = [
  { value: 'stealth', label: 'High stealth' },
  { value: 'spread', label: 'Rapid spread' },
  { value: 'evasion', label: 'Evasion focus' },
]

/* ─────────────────────── 3D DNA HELIX ─────────────────────── */

function DNAHelix({
  sequence,
  scrollOffset,
  mutatedPositions,
  llmPositions,
}: {
  sequence: Base[]
  scrollOffset: number
  mutatedPositions: Set<number>
  llmPositions: Set<number>
}) {
  const groupRef = useRef<THREE.Group>(null)
  const helixRadius = 2
  const helixPitch = 10
  const pairsPerTurn = 10
  const visiblePairs = 60
  const startIdx = Math.floor(scrollOffset)

  useFrame((_state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.002
    }
  })

  const pairs = useMemo(() => {
    const result: {
      idx: number
      base1: Base
      base2: Base
      angle: number
      y: number
      isMutated: boolean
      isLLM: boolean
    }[] = []
    for (let i = 0; i < visiblePairs; i++) {
      const idx = (startIdx + i) % sequence.length
      const base1 = sequence[idx]
      const base2 = BASE_PAIRS[base1]
      const angle = (i / pairsPerTurn) * Math.PI * 2
      const y = (i / pairsPerTurn) * helixPitch - helixPitch * 2
      result.push({
        idx,
        base1,
        base2,
        angle,
        y,
        isMutated: mutatedPositions.has(idx),
        isLLM: llmPositions.has(idx),
      })
    }
    return result
  }, [sequence, startIdx, mutatedPositions, llmPositions])

  return (
    <group ref={groupRef}>
      {/* Strand 1 */}
      {pairs.map((pair, i) => {
        const x = Math.cos(pair.angle) * helixRadius
        const z = Math.sin(pair.angle) * helixRadius
        const glowScale = pair.isMutated ? 1.4 : 1.0
        const emissive = pair.isLLM ? '#8B5CF6' : '#000000'
        const emissiveIntensity = pair.isLLM ? 0.5 : 0
        return (
          <group key={`s1-${i}`}>
            <mesh position={[x, pair.y, z]}>
              <sphereGeometry args={[0.25 * glowScale, 12, 12]} />
              <meshStandardMaterial
                color={BASE_COLORS[pair.base1]}
                emissive={emissive}
                emissiveIntensity={emissiveIntensity}
                transparent
                opacity={0.9}
              />
            </mesh>
            {/* Label */}
            <mesh position={[x * 1.3, pair.y, z * 1.3]}>
              {/* Label placeholder */}
            </mesh>
          </group>
        )
      })}

      {/* Strand 2 */}
      {pairs.map((pair, i) => {
        const angle = pair.angle + Math.PI
        const x = Math.cos(angle) * helixRadius
        const z = Math.sin(angle) * helixRadius
        const glowScale = pair.isMutated ? 1.4 : 1.0
        const emissive = pair.isLLM ? '#8B5CF6' : '#000000'
        const emissiveIntensity = pair.isLLM ? 0.5 : 0
        return (
          <mesh key={`s2-${i}`} position={[x, pair.y, z]}>
            <sphereGeometry args={[0.25 * glowScale, 12, 12]} />
            <meshStandardMaterial
              color={BASE_COLORS[pair.base2]}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
              transparent
              opacity={0.9}
            />
          </mesh>
        )
      })}

      {/* Base pair connections */}
      {pairs.map((pair, i) => {
        const angle1 = pair.angle
        const angle2 = pair.angle + Math.PI
        const x1 = Math.cos(angle1) * helixRadius
        const z1 = Math.sin(angle1) * helixRadius
        const x2 = Math.cos(angle2) * helixRadius
        const z2 = Math.sin(angle2) * helixRadius
        const midX = (x1 + x2) / 2
        const midZ = (z1 + z2) / 2
        const dist = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
        return (
          <mesh
            key={`conn-${i}`}
            position={[midX, pair.y, midZ]}
            rotation={[0, 0, Math.atan2(z2 - z1, x2 - x1)]}
          >
            <cylinderGeometry args={[0.04, 0.04, dist, 6]} />
            <meshStandardMaterial
              color={BASE_COLORS[pair.base1]}
              transparent
              opacity={0.5}
            />
          </mesh>
        )
      })}

      {/* Backbone lines (simplified as a series of small cylinders) */}
      {pairs.slice(0, -1).map((pair, i) => {
        const next = pairs[i + 1]
        if (!next) return null
        const x1 = Math.cos(pair.angle) * helixRadius
        const z1 = Math.sin(pair.angle) * helixRadius
        const x2 = Math.cos(next.angle) * helixRadius
        const z2 = Math.sin(next.angle) * helixRadius
        const dx = x2 - x1
        const dy = next.y - pair.y
        const dz = z2 - z1
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (len === 0) return null
        const midX = (x1 + x2) / 2
        const midY = (pair.y + next.y) / 2
        const midZ = (z1 + z2) / 2
        const q = new THREE.Quaternion()
        const up = new THREE.Vector3(0, 1, 0)
        const dir = new THREE.Vector3(dx, dy, dz).normalize()
        q.setFromUnitVectors(up, dir)
        return (
          <mesh key={`bb1-${i}`} position={[midX, midY, midZ]} quaternion={q}>
            <cylinderGeometry args={[0.03, 0.03, len, 4]} />
            <meshStandardMaterial color="#475569" transparent opacity={0.4} />
          </mesh>
        )
      })}
      {pairs.slice(0, -1).map((pair, i) => {
        const next = pairs[i + 1]
        if (!next) return null
        const angle1 = pair.angle + Math.PI
        const angle2 = next.angle + Math.PI
        const x1 = Math.cos(angle1) * helixRadius
        const z1 = Math.sin(angle1) * helixRadius
        const x2 = Math.cos(angle2) * helixRadius
        const z2 = Math.sin(angle2) * helixRadius
        const dx = x2 - x1
        const dy = next.y - pair.y
        const dz = z2 - z1
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (len === 0) return null
        const midX = (x1 + x2) / 2
        const midY = (pair.y + next.y) / 2
        const midZ = (z1 + z2) / 2
        const q = new THREE.Quaternion()
        const up = new THREE.Vector3(0, 1, 0)
        const dir = new THREE.Vector3(dx, dy, dz).normalize()
        q.setFromUnitVectors(up, dir)
        return (
          <mesh key={`bb2-${i}`} position={[midX, midY, midZ]} quaternion={q}>
            <cylinderGeometry args={[0.03, 0.03, len, 4]} />
            <meshStandardMaterial color="#475569" transparent opacity={0.4} />
          </mesh>
        )
      })}

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#8B5CF6" />
    </group>
  )
}

/* ─────────────────────── SEQUENCE EDITOR (Canvas 2D) ─────────────────────── */

function SequenceEditor({
  sequence,
  selectedBase,
  onSelectBase,
  onMutateBase,
  mutations,
}: {
  sequence: Base[]
  selectedBase: number | null
  onSelectBase: (idx: number) => void
  onMutateBase: (idx: number) => void
  mutations: Mutation[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef(0)
  const [scrollOffset, setScrollOffset] = useState(0)

  const basesPerRow = 40
  const blockSize = 22
  const gap = 2
  const padding = 8
  const rowHeight = blockSize + gap + 20 // extra for position labels

  const totalRows = Math.ceil(sequence.length / basesPerRow)
  const canvasHeight = totalRows * rowHeight + padding * 2

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const width = basesPerRow * (blockSize + gap) + padding * 2 + 40 // extra for row labels
    canvas.width = width * dpr
    canvas.height = canvasHeight * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${canvasHeight}px`
    ctx.scale(dpr, dpr)

    // Clear
    ctx.fillStyle = '#0F172A'
    ctx.fillRect(0, 0, width, canvasHeight)

    // Draw bases
    for (let i = 0; i < sequence.length; i++) {
      const row = Math.floor(i / basesPerRow)
      const col = i % basesPerRow
      const x = padding + 40 + col * (blockSize + gap)
      const y = padding + row * rowHeight + 16

      const base = sequence[i]
      const isSelected = i === selectedBase
      const isMutated = mutations.some((m) => m.position === i)

      // Block background
      if (isSelected) {
        ctx.strokeStyle = '#F1F5F9'
        ctx.lineWidth = 2
        ctx.strokeRect(x - 1, y - 1, blockSize + 2, blockSize + 2)
      }

      ctx.fillStyle = BASE_COLORS[base]
      if (isMutated) {
        ctx.globalAlpha = 1.0
      } else {
        ctx.globalAlpha = 0.85
      }
      ctx.fillRect(x, y, blockSize, blockSize)
      ctx.globalAlpha = 1.0

      // Base letter
      ctx.fillStyle = '#FFFFFF'
      ctx.font = '500 11px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(base, x + blockSize / 2, y + blockSize / 2)

      // Position number every 10 bases
      if (i % 10 === 0) {
        ctx.fillStyle = '#64748B'
        ctx.font = '400 9px "JetBrains Mono", monospace'
        ctx.textAlign = 'right'
        ctx.fillText(`${i}`, padding + 35, y + blockSize / 2)
      }

      // Row label
      if (col === 0) {
        ctx.fillStyle = '#475569'
        ctx.font = '400 9px "JetBrains Mono", monospace'
        ctx.textAlign = 'left'
        ctx.fillText(`${row * basesPerRow}-${Math.min((row + 1) * basesPerRow - 1, sequence.length - 1)}`, padding, y - 4)
      }
    }
  }, [sequence, selectedBase, mutations, canvasHeight])

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top + scrollOffset

      const basesPerRow = 40
      const blockSize = 22
      const gap = 2
      const padding = 8
      const rowHeight = blockSize + gap + 20

      const col = Math.floor((clickX - padding - 40) / (blockSize + gap))
      const row = Math.floor((clickY - padding - 16) / rowHeight)
      const idx = row * basesPerRow + col

      if (idx >= 0 && idx < sequence.length) {
        onSelectBase(idx)
        onMutateBase(idx)
      }
    },
    [onSelectBase, onMutateBase, scrollOffset, sequence.length]
  )

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    scrollRef.current = target.scrollTop
    setScrollOffset(target.scrollTop)
  }, [])

  return (
    <div
      ref={containerRef}
      className="h-full overflow-auto"
      onScroll={handleScroll}
    >
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        className="cursor-pointer"
      />
    </div>
  )
}

/* ─────────────────────── PHYLOGENETIC TREE (Canvas 2D) ─────────────────────── */

function PhyloTree({ mutations }: { mutations: Mutation[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

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

    // Clear
    ctx.fillStyle = '#0F172A'
    ctx.fillRect(0, 0, width, height)

    // Build tree nodes
    const nodes: Record<string, TreeNode> = {
      root: {
        id: 'root',
        parentId: null,
        mutations: [],
        x: 30,
        y: height / 2,
        label: 'Original',
        children: [],
      },
    }

    let currentParent = 'root'
    mutations.slice(0, 12).forEach((mut, i) => {
      const nodeId = `node-${i}`
      nodes[nodeId] = {
        id: nodeId,
        parentId: currentParent,
        mutations: [mut],
        x: 60 + (i + 1) * ((width - 100) / 13),
        y: height / 2 + (i % 2 === 0 ? -1 : 1) * (20 + i * 6),
        label: `${mut.oldBase}${mut.position}${mut.newBase}`,
        children: [],
      }
      nodes[currentParent].children.push(nodeId)
      if (i % 3 === 2) currentParent = nodeId
    })

    // Draw branches
    ctx.strokeStyle = '#1E293B'
    ctx.lineWidth = 2
    Object.values(nodes).forEach((node) => {
      if (node.parentId && nodes[node.parentId]) {
        const parent = nodes[node.parentId]
        ctx.beginPath()
        ctx.moveTo(parent.x, parent.y)
        ctx.bezierCurveTo(
          parent.x + (node.x - parent.x) * 0.5,
          parent.y,
          parent.x + (node.x - parent.x) * 0.5,
          node.y,
          node.x,
          node.y
        )
        ctx.stroke()
      }
    })

    // Draw nodes
    Object.values(nodes).forEach((node) => {
      const isLeaf = node.children.length === 0
      const radius = isLeaf ? 6 : 4

      ctx.beginPath()
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2)
      ctx.fillStyle = isLeaf ? '#10B981' : '#06B6D4'
      ctx.fill()

      // Label
      ctx.fillStyle = '#94A3B8'
      ctx.font = '400 9px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(node.label, node.x, node.y + radius + 12)
    })
  }, [mutations])

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
    />
  )
}

/* ─────────────────────── YARA RULE PREVIEW ─────────────────────── */

function generateYaraRule(sequence: Base[], mutations: Mutation[]): string {
  const signature = sequence.slice(0, 32).join('')
  const hexSig = signature
    .replace(/A/g, '41')
    .replace(/T/g, '54')
    .replace(/C/g, '43')
    .replace(/G/g, '47')

  return `rule Malware_Variant_${mutations.length}
{
    meta:
        description = "Auto-generated signature for DNA-morphed variant"
        author = "Scientisec LLM Engine"
        date = "${new Date().toISOString().split('T')[0]}"
        mutation_count = ${mutations.length}
    
    strings:
        $dna_sig = { ${hexSig.match(/.{1,2}/g)?.join(' ') ?? hexSig} }
        
        ${mutations.length > 0 ? '// Mutated positions:' : ''}
        ${mutations
          .slice(0, 5)
          .map(
            (m) =>
              `//   Pos ${m.position}: ${m.oldBase} -> ${m.newBase}${
                m.isLLM ? ' (LLM)' : ''
              }`
          )
          .join('\n        ')}
    
    condition:
        $dna_sig or filesize < 100KB
}`
}

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */

export default function VizDNA() {
  const [sequence, setSequence] = useState<Base[]>([...BASE_SEQUENCE])
  const [selectedBase, setSelectedBase] = useState<number | null>(null)
  const [mutations, setMutations] = useState<Mutation[]>([])
  const [selectionPressure, setSelectionPressure] = useState('stealth')
  const [scrollOffset] = useState(0)
  const nextMutationId = useRef(1)

  const mutatedPositions = useMemo(
    () => new Set(mutations.map((m) => m.position)),
    [mutations]
  )
  const llmPositions = useMemo(
    () => new Set(mutations.filter((m) => m.isLLM).map((m) => m.position)),
    [mutations]
  )

  const handleSelectBase = useCallback((idx: number) => {
    setSelectedBase(idx)
  }, [])

  const handleMutateBase = useCallback(
    (idx: number) => {
      const bases: Base[] = ['A', 'T', 'C', 'G']
      const current = sequence[idx]
      const nextIndex = (bases.indexOf(current) + 1) % 4
      const newBase = bases[nextIndex]

      setSequence((prev) => {
        const next = [...prev]
        next[idx] = newBase
        return next
      })

      const mutation: Mutation = {
        id: nextMutationId.current++,
        position: idx,
        oldBase: current,
        newBase,
        timestamp: Date.now(),
        isLLM: false,
      }
      setMutations((prev) => [...prev, mutation])
    },
    [sequence]
  )

  const triggerRandomMutation = useCallback(() => {
    const count = 1 + Math.floor(Math.random() * 10)
    const newMutations: Mutation[] = []
    setSequence((prevSeq) => {
      const next = [...prevSeq]
      for (let i = 0; i < count; i++) {
        const pos = Math.floor(Math.random() * next.length)
        const bases: Base[] = ['A', 'T', 'C', 'G']
        const oldBase = next[pos]
        const newBase = bases.filter((b) => b !== oldBase)[
          Math.floor(Math.random() * 3)
        ]
        next[pos] = newBase
        newMutations.push({
          id: nextMutationId.current++,
          position: pos,
          oldBase,
          newBase,
          timestamp: Date.now(),
          isLLM: false,
        })
      }
      return next
    })
    setMutations((prev) => [...prev, ...newMutations])
  }, [])

  const llmMutate = useCallback(() => {
    // Simulate LLM-driven strategic mutations
    const count = 3 + Math.floor(Math.random() * 8)
    const newMutations: Mutation[] = []
    setSequence((prevSeq) => {
      const next = [...prevSeq]
      const positions: number[] = []

      // LLM selects positions "strategically" based on pressure
      if (selectionPressure === 'stealth') {
        // Target dispersed positions
        for (let i = 0; i < count; i++) {
          positions.push(Math.floor(Math.random() * next.length))
        }
      } else if (selectionPressure === 'spread') {
        // Target clustered positions
        const cluster = Math.floor(Math.random() * (next.length - count))
        for (let i = 0; i < count; i++) positions.push(cluster + i)
      } else {
        // Evasion: target specific regions
        const regions = [0, 250, 500, 750]
        const region = regions[Math.floor(Math.random() * regions.length)]
        for (let i = 0; i < count; i++) {
          positions.push(region + Math.floor(Math.random() * 250))
        }
      }

      for (const pos of positions) {
        const safePos = pos % next.length
        const bases: Base[] = ['A', 'T', 'C', 'G']
        const oldBase = next[safePos]
        const newBase = bases.filter((b) => b !== oldBase)[
          Math.floor(Math.random() * 3)
        ]
        next[safePos] = newBase
        newMutations.push({
          id: nextMutationId.current++,
          position: safePos,
          oldBase,
          newBase,
          timestamp: Date.now(),
          isLLM: true,
        })
      }
      return next
    })
    setMutations((prev) => [...prev, ...newMutations])
  }, [selectionPressure])

  const resetSequence = useCallback(() => {
    setSequence([...BASE_SEQUENCE])
    setMutations([])
    setSelectedBase(null)
  }, [])

  const yaraRule = useMemo(
    () => generateYaraRule(sequence, mutations),
    [sequence, mutations]
  )

  return (
    <div className="flex h-[100dvh] flex-col bg-bg-void">
      {/* Control Bar */}
      <div className="flex h-14 shrink-0 items-center gap-4 border-b border-border-subtle bg-bg-surface px-4">
        <Link
          to="/visualizations"
          className="flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-accent-cyan"
        >
          <ArrowLeft size={16} />
        </Link>
        <Dna size={18} className="text-accent-emerald" />
        <h1 className="font-display text-base font-bold text-text-primary">
          DNA Morphing Engine
        </h1>
        <span className="font-mono text-xs text-accent-emerald">
          Bioconductor + LLM → Malware Phylogenetics
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={triggerRandomMutation}
            size="sm"
            className="bg-accent-amber text-bg-deep hover:bg-accent-amber/90"
          >
            <Sparkles size={14} className="mr-1" />
            Trigger Mutation
          </Button>
          <Button
            onClick={llmMutate}
            size="sm"
            className="bg-accent-violet text-white hover:bg-accent-violet/90"
          >
            <Sparkles size={14} className="mr-1" />
            LLM Mutate
          </Button>
          <Select value={selectionPressure} onValueChange={setSelectionPressure}>
            <SelectTrigger className="h-8 w-[140px] border-border-subtle bg-bg-deep text-xs text-text-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-bg-surface border-border-subtle">
              {SELECTION_PRESSURES.map((p) => (
                <SelectItem
                  key={p.value}
                  value={p.value}
                  className="text-xs text-text-secondary focus:bg-bg-elevated focus:text-text-primary"
                >
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={resetSequence}
            variant="outline"
            size="sm"
            className="border-border-subtle text-text-secondary hover:text-text-primary"
          >
            <RotateCcw size={14} className="mr-1" />
            Reset
          </Button>

          {/* YARA Rule Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/10"
              >
                Generated YARA Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg border-border-subtle bg-bg-surface">
              <DialogHeader>
                <DialogTitle className="font-display text-text-primary">
                  YARA Rule Preview
                </DialogTitle>
              </DialogHeader>
              <pre className="max-h-[400px] overflow-auto rounded-md bg-bg-void p-4 font-mono text-xs leading-relaxed text-text-secondary">
                <code className="text-accent-cyan">
                  {yaraRule}
                </code>
              </pre>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Split Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sequence Editor */}
        <div className="flex w-2/5 flex-col border-r border-border-subtle">
          <div className="flex items-center justify-between border-b border-border-subtle bg-bg-deep px-3 py-2">
            <span className="font-mono text-xs text-text-muted">
              Sequence Editor ({sequence.length} bases, {mutations.length} mutations)
            </span>
            <span className="text-xs text-text-muted">Click a base to mutate</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <SequenceEditor
              sequence={sequence}
              selectedBase={selectedBase}
              onSelectBase={handleSelectBase}
              onMutateBase={handleMutateBase}
              mutations={mutations}
            />
          </div>

          {/* Mutation Log */}
          <div className="h-[120px] shrink-0 border-t border-border-subtle bg-bg-deep">
            <div className="flex items-center justify-between border-b border-border-subtle px-3 py-1.5">
              <span className="font-mono text-xs text-text-muted">
                Mutation Log
              </span>
            </div>
            <div className="h-[calc(100%-28px)] overflow-y-auto p-2">
              {mutations.length === 0 ? (
                <p className="text-xs text-text-muted italic">
                  No mutations yet. Click bases or use mutation buttons.
                </p>
              ) : (
                <div className="space-y-0.5">
                  <AnimatePresence>
                    {mutations.slice(-20).map((mut) => (
                      <motion.div
                        key={mut.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-2 font-mono text-[10px]"
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: BASE_COLORS[mut.newBase] }}
                        />
                        <span className="text-text-muted">
                          Pos {mut.position}:
                        </span>
                        <span style={{ color: BASE_COLORS[mut.oldBase] }}>
                          {mut.oldBase}
                        </span>
                        <ChevronDown size={8} className="text-text-muted" />
                        <span style={{ color: BASE_COLORS[mut.newBase] }}>
                          {mut.newBase}
                        </span>
                        {mut.isLLM && (
                          <span className="rounded px-1 text-accent-violet bg-accent-violet-dim/30">
                            LLM
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: 3D DNA Helix */}
        <div className="flex w-3/5 flex-col">
          <div className="flex items-center border-b border-border-subtle bg-bg-deep px-3 py-2">
            <span className="font-mono text-xs text-text-muted">
              3D Helix Visualization
            </span>
          </div>
          <div className="relative flex-1">
            <Canvas camera={{ position: [8, 2, 8], fov: 50 }}>
              <DNAHelix
                sequence={sequence}
                scrollOffset={scrollOffset}
                mutatedPositions={mutatedPositions}
                llmPositions={llmPositions}
              />
              <OrbitControls enablePan={false} minDistance={5} maxDistance={20} />
            </Canvas>
          </div>
        </div>
      </div>

      {/* Bottom: Phylogenetic Tree */}
      <div className="h-[220px] shrink-0 border-t border-border-subtle bg-bg-deep">
        <div className="flex items-center justify-between border-b border-border-subtle bg-bg-deep px-3 py-1.5">
          <span className="font-mono text-xs text-text-muted">
            Phylogenetic Tree
          </span>
          <span className="text-[10px] text-text-muted">
            {mutations.length} mutation events
          </span>
        </div>
        <div className="h-[calc(100%-28px)]">
          <PhyloTree mutations={mutations} />
        </div>
      </div>
    </div>
  )
}
