import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import {
  ChevronDown,
  Check,
  Eye,
  Database,
  Search,
  Box,
  Play,
  Zap,
  BookOpen,
  HeartPulse,
  Shield,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  phases,
  superPhases,
  getSuperPhaseById,
} from '../data/evolutionData'
import type { Phase } from '../data/evolutionData'

gsap.registerPlugin(ScrollTrigger)

/* ------------------------------------------------------------------ */
/*  CONSTANTS                                                          */
/* ------------------------------------------------------------------ */

const TOTAL_PHASES = 48
const ROWS = 6
const COLS = 8

const superPhaseIcons: Record<string, React.ElementType> = {
  eye: Eye,
  database: Database,
  search: Search,
  box: Box,
  play: Play,
  zap: Zap,
  'book-open': BookOpen,
  'heart-pulse': HeartPulse,
}

/* ------------------------------------------------------------------ */
/*  HELPER: calculate snake-pattern node positions                     */
/* ------------------------------------------------------------------ */

interface NodePos {
  x: number
  y: number
  phase: Phase
  row: number
  col: number
}

function calculateNodePositions(): NodePos[] {
  const nodes: NodePos[] = []
  const paddingX = 60
  const paddingY = 40
  const svgW = 800
  const svgH = 520
  const cellW = (svgW - paddingX * 2) / (COLS - 1)
  const cellH = (svgH - paddingY * 2) / (ROWS - 1)

  for (let i = 0; i < TOTAL_PHASES; i++) {
    const row = Math.floor(i / COLS)
    const isReverse = row % 2 === 1
    const colInRow = i % COLS
    const col = isReverse ? COLS - 1 - colInRow : colInRow
    const x = paddingX + col * cellW
    const y = paddingY + row * cellH
    nodes.push({
      x,
      y,
      phase: phases[i],
      row,
      col,
    })
  }
  return nodes
}

/* ------------------------------------------------------------------ */
/*  HELPER: build SVG snake path                                       */
/* ------------------------------------------------------------------ */

function buildSnakePath(nodes: NodePos[]): string {
  if (nodes.length === 0) return ''
  let d = `M ${nodes[0].x} ${nodes[0].y}`
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1]
    const curr = nodes[i]
    if (prev.row !== curr.row) {
      // Row transition — add a curved turn
      const midY = (prev.y + curr.y) / 2
      const direction = prev.row % 2 === 0 ? 1 : -1
      d += ` L ${prev.x} ${midY - 8}`
      d += ` Q ${prev.x} ${midY} ${prev.x + direction * 8} ${midY}`
      d += ` L ${curr.x - direction * 8} ${midY}`
      d += ` Q ${curr.x} ${midY} ${curr.x} ${midY + 8}`
      d += ` L ${curr.x} ${curr.y}`
    } else {
      d += ` L ${curr.x} ${curr.y}`
    }
  }
  return d
}

/* ------------------------------------------------------------------ */
/*  HELPER: tool color mapping                                         */
/* ------------------------------------------------------------------ */

function getToolColor(tool: string): string {
  const colors: Record<string, string> = {
    'LAMMPS': '#06B6D4',
    'OpenFOAM': '#06B6D4',
    'FESOM': '#06B6D4',
    'Quantum ESPRESSO': '#8B5CF6',
    'GADGET-4': '#F59E0B',
    'Stan': '#8B5CF6',
    'MALLET': '#8B5CF6',
    'V-Dem': '#10B981',
    'Bioconductor': '#10B981',
    'ROMS': '#06B6D4',
    'NetLogo': '#F59E0B',
    'Z-Tree': '#F59E0B',
    'NEURON': '#F43F5E',
    'MGGG': '#06B6D4',
    'WRF-ARW': '#06B6D4',
    'QuantEcon': '#F59E0B',
    'All tools': '#06B6D4',
    'All Layer 1 tools': '#F43F5E',
  }
  return colors[tool] ?? '#64748B'
}

/* ================================================================== */
/*  HERO SECTION — Framer Motion only                                 */
/* ================================================================== */

function HeroSection({ scrollY }: { scrollY: number }) {
  const scrollPromptOpacity = scrollY > 100 ? 0 : 1

  return (
    <section
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden"
      style={{ backgroundColor: '#030712' }}
    >
      {/* Background overlays */}
      <div
        className="absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'url(/hero-evolution.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      {/* Noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'url(/noise-texture.png)',
          backgroundSize: '256px 256px',
        }}
      />

      <div className="relative z-10 mx-auto max-w-[800px] px-6 text-center">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="font-mono text-xs font-medium uppercase tracking-[4px] text-accent-emerald"
        >
          48-PHASE EVOLUTIONARY FRAMEWORK
        </motion.p>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="font-display mt-4 text-[48px] font-bold leading-[1.1] text-text-primary md:text-[48px]"
          style={{ fontSize: '48px', lineHeight: 1.1 }}
        >
          The Evolution Cycle
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-5 text-base leading-relaxed text-text-secondary"
          style={{ maxWidth: '680px', margin: '20px auto 0' }}
        >
          From initial observation through automated healing — a continuous 48-phase cycle
          that models how the Scientisec system evolves its offensive and defensive capabilities
          over time. Each phase feeds into the next, creating a self-improving security organism.
        </motion.p>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-10"
        >
          {[
            { value: '8', label: 'Super-Phases', color: '#10B981' },
            { value: '48', label: 'Stages', color: '#10B981' },
            { value: '4', label: 'Security Layers', color: '#10B981' },
            { value: '\u221E', label: 'Continuous Loop', color: '#06B6D4' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1">
              <span
                className="font-display text-[28px] font-bold"
                style={{ color: stat.color }}
              >
                {stat.value}
              </span>
              <span className="text-xs text-text-muted">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll prompt */}
      <div
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-300"
        style={{ opacity: scrollPromptOpacity }}
      >
        <span className="text-xs text-text-muted">Scroll to begin the cycle</span>
        <ChevronDown size={18} className="animate-bounce-chevron text-text-muted" />
      </div>
    </section>
  )
}

/* ================================================================== */
/*  PROGRESS BAR — GSAP ScrollTrigger driven                          */
/* ================================================================== */

function ProgressBar({
  progress,
  activePhase,
}: {
  progress: number
  activePhase: number
}) {
  return (
    <div
      className="sticky top-0 z-50 border-b border-border-subtle"
      style={{
        backgroundColor: 'rgba(30,41,59,0.95)',
        backdropFilter: 'blur(12px)',
        height: '48px',
      }}
    >
      <div className="flex h-full items-center px-4 md:px-8">
        {/* Progress track */}
        <div className="relative flex-1">
          <div
            className="h-1 w-full overflow-hidden rounded-full"
            style={{ backgroundColor: '#334155' }}
          >
            <div
              className="h-full rounded-full transition-all duration-100"
              style={{
                width: `${progress * 100}%`,
                background: 'linear-gradient(90deg, #06B6D4, #10B981)',
              }}
            />
          </div>

          {/* Super-phase markers */}
          <div className="absolute top-1/2 flex w-full -translate-y-1/2 justify-between">
            {superPhases.map((sp) => {
              const spStartPhase = (sp.id - 1) * 6 + 1
              const spEndPhase = sp.id * 6
              const isCompleted = activePhase > spEndPhase
              const isActive = activePhase >= spStartPhase && activePhase <= spEndPhase

              return (
                <div
                  key={sp.id}
                  className="flex flex-col items-center"
                  style={{ position: 'absolute', left: `${((sp.id - 0.5) / 8) * 100}%`, transform: 'translateX(-50%)' }}
                >
                  <div
                    className="flex h-3 w-3 items-center justify-center rounded-full border-2 transition-all duration-300"
                    style={{
                      backgroundColor: isCompleted
                        ? '#10B981'
                        : isActive
                          ? '#06B6D4'
                          : '#334155',
                      borderColor: isCompleted
                        ? '#10B981'
                        : isActive
                          ? '#06B6D4'
                          : '#475569',
                      boxShadow: isActive
                        ? '0 0 0 4px rgba(6,182,212,0.2)'
                        : 'none',
                    }}
                  >
                    {isCompleted && <Check size={8} className="text-white" />}
                  </div>
                  <span
                    className="mt-1 hidden font-mono text-[10px] uppercase tracking-wider text-text-muted md:block"
                  >
                    {sp.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Phase counter */}
        <div className="ml-4 flex shrink-0 items-center gap-1 font-mono text-xs text-text-secondary md:ml-8">
          <span className="text-accent-cyan">
            Phase {String(activePhase).padStart(2, '0')}
          </span>
          <span className="text-text-muted">/ {TOTAL_PHASES}</span>
        </div>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  PHASE DETAIL SIDEBAR                                               */
/* ================================================================== */

function PhaseDetailSidebar({
  activePhase,
  onNavigate,
}: {
  activePhase: number
  onNavigate: (phase: number) => void
}) {
  const phase = phases[activePhase - 1]
  const [displayPhase, setDisplayPhase] = useState(activePhase)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const prevPhaseRef = useRef(activePhase)

  // Cross-fade on phase change
  useEffect(() => {
    if (activePhase !== prevPhaseRef.current) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setDisplayPhase(activePhase)
        setIsTransitioning(false)
        prevPhaseRef.current = activePhase
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [activePhase])

  const displayPhaseData = phases[displayPhase - 1]
  const displaySuperPhase = getSuperPhaseById(displayPhaseData?.superPhaseId ?? 1)

  if (!phase || !displayPhaseData) return null

  return (
    <div
      className="pointer-events-auto w-full rounded-lg border border-border-subtle p-5 md:p-6"
      style={{
        backgroundColor: '#1E293B',
        boxShadow: '0 4px 12px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
        maxWidth: '420px',
        minWidth: '280px',
      }}
    >
      <div
        className="transition-all duration-200"
        style={{
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'translateX(-10px)' : 'translateX(0)',
        }}
      >
        {/* Phase badge */}
        <span
          className="inline-block rounded px-2 py-0.5 font-mono text-xs uppercase tracking-wider"
          style={{
            backgroundColor: `${displaySuperPhase?.color ?? '#06B6D4'}22`,
            color: displaySuperPhase?.color ?? '#06B6D4',
          }}
        >
          PHASE {String(displayPhaseData.id).padStart(2, '0')}
        </span>

        {/* Phase title */}
        <h3 className="mt-3 font-body text-lg font-semibold text-text-primary">
          {displayPhaseData.name}
        </h3>

        {/* Super-phase label */}
        <div className="mt-2 flex items-center gap-2">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: displaySuperPhase?.color ?? '#06B6D4' }}
          />
          <span className="text-xs text-text-muted">
            Part of: {displaySuperPhase?.name ?? ''}
          </span>
        </div>

        {/* Description */}
        <div
          className="mt-4 overflow-y-auto text-sm leading-relaxed text-text-secondary"
          style={{ maxHeight: '200px' }}
        >
          {displayPhaseData.description}
        </div>

        {/* Associated tools */}
        <div className="mt-4">
          <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
            Associated Tools
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {displayPhaseData.tools.map((tool, i) => (
              <span
                key={`${tool}-${i}`}
                className="inline-flex h-7 items-center rounded px-2.5 font-mono text-xs font-medium"
                style={{
                  backgroundColor: `${getToolColor(tool)}1A`,
                  color: getToolColor(tool),
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        </div>

        {/* Security mapping */}
        <div className="mt-4 flex items-start gap-2">
          <Shield size={14} className="mt-0.5 shrink-0 text-accent-cyan" />
          <span className="text-xs leading-relaxed text-text-secondary">
            {displayPhaseData.securityMapping}
          </span>
        </div>

        {/* Entry / Exit conditions */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div
            className="rounded-md p-3"
            style={{ backgroundColor: '#0F172A' }}
          >
            <span className="block font-mono text-xs font-medium text-accent-emerald">
              Entry
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
              {displayPhaseData.entryCondition}
            </span>
          </div>
          <div
            className="rounded-md p-3"
            style={{ backgroundColor: '#0F172A' }}
          >
            <span className="block font-mono text-xs font-medium text-accent-rose">
              Exit
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-text-secondary">
              {displayPhaseData.exitCondition}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          onClick={() => onNavigate(Math.max(1, activePhase - 1))}
          disabled={activePhase <= 1}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30 text-text-secondary hover:bg-bg-elevated hover:text-text-primary"
        >
          <ChevronLeft size={14} />
          Previous
        </button>
        <button
          onClick={() => onNavigate(Math.min(TOTAL_PHASES, activePhase + 1))}
          disabled={activePhase >= TOTAL_PHASES}
          className="flex items-center gap-1 rounded-md px-3 py-2 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-30"
          style={{
            backgroundColor: activePhase >= TOTAL_PHASES ? '#334155' : '#06B6D4',
            color: activePhase >= TOTAL_PHASES ? '#64748B' : '#030712',
          }}
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

/* ================================================================== */
/*  MOBILE TIMELINE — vertical non-pinned layout                       */
/* ================================================================== */

function MobileTimeline({
  activePhase,
  onPhaseClick,
}: {
  activePhase: number
  onPhaseClick: (phase: number) => void
}) {
  return (
    <div className="space-y-3 px-4 py-6 md:hidden">
      {phases.map((phase) => {
        const superPhase = getSuperPhaseById(phase.superPhaseId)
        const isActive = phase.id === activePhase
        const isCompleted = phase.id < activePhase

        return (
          <button
            key={phase.id}
            onClick={() => onPhaseClick(phase.id)}
            className="flex w-full items-center gap-3 rounded-lg border border-border-subtle p-3 text-left transition-all"
            style={{
              backgroundColor: isActive ? '#1E293B' : '#0F172A',
              borderColor: isActive
                ? superPhase?.color ?? '#06B6D4'
                : '#1E293B',
            }}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-mono font-bold"
              style={{
                backgroundColor: isCompleted
                  ? '#10B981'
                  : isActive
                    ? superPhase?.color ?? '#06B6D4'
                    : '#334155',
                color: isCompleted || isActive ? '#fff' : '#64748B',
              }}
            >
              {isCompleted ? (
                <Check size={14} />
              ) : (
                String(phase.id).padStart(2, '0')
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: superPhase?.color ?? '#06B6D4' }}
                />
                <span className="truncate text-sm font-medium text-text-primary">
                  {phase.name}
                </span>
              </div>
              <span className="mt-0.5 block truncate text-xs text-text-muted">
                {superPhase?.name ?? ''}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/* ================================================================== */
/*  MAIN EVOLUTION PAGE                                                */
/* ================================================================== */

export default function Evolution() {
  const [activePhase, setActivePhase] = useState(1)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const [showMobileSheet, setShowMobileSheet] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)

  /* Check mobile */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  /* Track scroll Y for hero fade */
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /* Node positions — memoized */
  const nodes = useMemo(() => calculateNodePositions(), [])
  const snakePath = useMemo(() => buildSnakePath(nodes), [nodes])
  const pathLength = useMemo(() => {
    if (typeof window === 'undefined') return 2000
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', snakePath)
    svg.appendChild(path)
    document.body.appendChild(svg)
    const len = path.getTotalLength()
    document.body.removeChild(svg)
    return len
  }, [snakePath])

  /* GSAP ScrollTrigger for desktop timeline */
  useGSAP(
    () => {
      if (isMobile || !timelineRef.current || !pathRef.current) return

      // Set initial path state
      gsap.set(pathRef.current, {
        strokeDasharray: pathLength,
        strokeDashoffset: pathLength,
      })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: timelineRef.current,
          start: 'top top',
          end: '+=400%',
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            const prog = self.progress
            setScrollProgress(prog)
            const newPhase = Math.min(
              TOTAL_PHASES,
              Math.max(1, Math.floor(prog * TOTAL_PHASES) + 1)
            )
            setActivePhase((prev) => {
              if (prev !== newPhase) {
                return newPhase
              }
              return prev
            })
          },
        },
      })

      // Animate the path reveal
      tl.to(
        pathRef.current,
        {
          strokeDashoffset: 0,
          ease: 'none',
          duration: 1,
        },
        0
      )

      return () => {
        tl.kill()
      }
    },
    { scope: containerRef, dependencies: [isMobile, pathLength] }
  )

  /* Navigation handler */
  const handleNavigate = useCallback((phase: number) => {
    setActivePhase(phase)
    // Scroll to corresponding position
    if (timelineRef.current) {
      const st = ScrollTrigger.getAll().find(
        (t) => t.vars.trigger === timelineRef.current
      )
      if (st) {
        const targetProgress = (phase - 1) / (TOTAL_PHASES - 1)
        const scrollTarget = st.start + (st.end - st.start) * targetProgress
        window.scrollTo({
          top: scrollTarget,
          behavior: 'smooth',
        })
      }
    }
  }, [])

  /* Handle phase click on mobile */
  const handlePhaseClick = useCallback((phase: number) => {
    setActivePhase(phase)
    setShowMobileSheet(true)
  }, [])

  /* Progress bar progress from 0 to 1 */
  const progressValue = scrollProgress

  /* Calculate active node positions and states for SVG overlay */
  const getNodeState = (phaseId: number) => {
    if (phaseId < activePhase) return 'completed'
    if (phaseId === activePhase) return 'active'
    return 'locked'
  }

  return (
    <div ref={containerRef} className="min-h-[100dvh]" style={{ backgroundColor: '#0F172A' }}>
      {/* Hero */}
      <HeroSection scrollY={scrollY} />

      {/* Progress bar */}
      <ProgressBar progress={progressValue} activePhase={activePhase} />

      {/* Mobile: vertical timeline */}
      {isMobile && (
        <MobileTimeline activePhase={activePhase} onPhaseClick={handlePhaseClick} />
      )}

      {/* Mobile: bottom sheet for phase details */}
      {isMobile && showMobileSheet && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowMobileSheet(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 rounded-t-lg border-t border-border-subtle p-4"
            style={{
              backgroundColor: '#1E293B',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
          >
            <div className="mx-auto mb-3 h-1 w-8 rounded-full bg-bg-elevated" />
            <PhaseDetailSidebar
              activePhase={activePhase}
              onNavigate={(phase) => {
                setActivePhase(phase)
              }}
            />
          </motion.div>
        </div>
      )}

      {/* Desktop: pinned snake timeline */}
      {!isMobile && (
        <div
          ref={timelineRef}
          className="relative hidden min-h-[100dvh] overflow-hidden md:block"
          style={{ backgroundColor: '#0F172A' }}
        >
          {/* Background grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Main content area: timeline + sidebar */}
          <div className="relative z-10 flex h-[100dvh] items-center justify-center px-4 lg:px-8">
            {/* Timeline SVG */}
            <div className="flex-1" style={{ maxWidth: '60%' }}>
              <svg
                viewBox="0 0 800 520"
                className="h-auto w-full"
                style={{ maxHeight: 'calc(100dvh - 100px)' }}
              >
                {/* Definitions for glow filters */}
                <defs>
                  <filter id="glow-cyan" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="glow-emerald" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Unrevealed path (subtle) */}
                <path
                  d={snakePath}
                  fill="none"
                  stroke="#334155"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Revealed path (cyan, animated) */}
                <path
                  ref={pathRef}
                  d={snakePath}
                  fill="none"
                  stroke="#06B6D4"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: 'drop-shadow(0 0 4px rgba(6,182,212,0.4))',
                  }}
                />

                {/* Phase nodes */}
                {nodes.map((node) => {
                  const state = getNodeState(node.phase.id)
                  const sp = getSuperPhaseById(node.phase.superPhaseId)
                  const isActive = state === 'active'
                  const isCompleted = state === 'completed'
                  const radius = isActive ? 18 : 14
                  const fillColor = isCompleted
                    ? '#10B981'
                    : isActive
                      ? sp?.color ?? '#06B6D4'
                      : '#334155'
                  const strokeColor = isCompleted
                    ? '#10B981'
                    : isActive
                      ? sp?.color ?? '#06B6D4'
                      : '#475569'

                  return (
                    <g key={node.phase.id}>
                      {/* Active pulse ring */}
                      {isActive && (
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={26}
                          fill="none"
                          stroke={sp?.color ?? '#06B6D4'}
                          strokeWidth="1"
                          opacity="0.3"
                        >
                          <animate
                            attributeName="r"
                            values="22;28;22"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.3;0.1;0.3"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      {/* Node circle */}
                      <circle
                        cx={node.x}
                        cy={node.y}
                        r={radius}
                        fill={fillColor}
                        stroke={strokeColor}
                        strokeWidth={isActive ? 3 : 1.5}
                        style={{
                          filter: isActive ? 'url(#glow-cyan)' : 'none',
                          transition: 'all 0.3s ease',
                        }}
                      />

                      {/* Checkmark for completed */}
                      {isCompleted && (
                        <text
                          x={node.x}
                          y={node.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#fff"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          &#x2713;
                        </text>
                      )}

                      {/* Phase number for locked / active */}
                      {!isCompleted && (
                        <text
                          x={node.x}
                          y={node.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isActive ? '#fff' : '#64748B'}
                          fontSize={isActive ? '10' : '9'}
                          fontWeight="bold"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {String(node.phase.id).padStart(2, '0')}
                        </text>
                      )}

                      {/* Phase name label */}
                      <text
                        x={node.x}
                        y={node.y + radius + 14}
                        textAnchor="middle"
                        fill={isActive ? '#F1F5F9' : '#64748B'}
                        fontSize="8"
                        fontFamily="JetBrains Mono, monospace"
                        style={{ transition: 'all 0.3s ease' }}
                      >
                        {node.phase.name.length > 14
                          ? node.phase.name.substring(0, 14) + '...'
                          : node.phase.name}
                      </text>
                    </g>
                  )
                })}

                {/* Super-phase divider labels */}
                {[1, 2, 3, 4, 5, 6, 7].map((spId) => {
                  // Place labels between super-phases
                  const lastPhaseOfPrev = spId * 6
                  const nextPhaseNode = nodes[lastPhaseOfPrev]
                  const prevPhaseNode = nodes[lastPhaseOfPrev - 1]
                  if (!nextPhaseNode || !prevPhaseNode) return null

                  const sp = getSuperPhaseById(spId + 1)
                  const midX = (prevPhaseNode.x + nextPhaseNode.x) / 2
                  const midY = (prevPhaseNode.y + nextPhaseNode.y) / 2

                  return (
                    <g key={`sp-divider-${spId}`}>
                      <line
                        x1={midX}
                        y1={midY - 15}
                        x2={midX}
                        y2={midY + 15}
                        stroke={sp?.color ?? '#06B6D4'}
                        strokeWidth="1"
                        strokeDasharray="3,3"
                        opacity="0.5"
                      />
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Sidebar */}
            <div className="flex items-center justify-center" style={{ width: '35%', minWidth: '300px', maxWidth: '420px' }}>
              <PhaseDetailSidebar
                activePhase={activePhase}
                onNavigate={handleNavigate}
              />
            </div>
          </div>

          {/* Row labels (super-phase names on the left) */}
          <div className="absolute left-4 top-1/2 hidden -translate-y-1/2 flex-col gap-8 lg:flex">
            {superPhases.map((sp) => {
              const spStartPhase = (sp.id - 1) * 6 + 1
              const spEndPhase = sp.id * 6
              const isActiveSp =
                activePhase >= spStartPhase && activePhase <= spEndPhase
              const IconComp = superPhaseIcons[sp.icon] as React.ComponentType<{ size?: number; style?: React.CSSProperties }>
              return (
                <div
                  key={sp.id}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-all duration-300"
                  style={{
                    opacity: isActiveSp ? 1 : 0.4,
                    backgroundColor: isActiveSp
                      ? `${sp.color}18`
                      : 'transparent',
                  }}
                >
                  {IconComp && (
                    <IconComp
                      size={14}
                      style={{ color: sp.color }}
                    />
                  )}
                  <span
                    className="font-mono text-[10px] uppercase tracking-wider"
                    style={{ color: sp.color }}
                  >
                    {sp.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Spacer for scroll distance (desktop only) */}
      {!isMobile && <div style={{ height: '400vh' }} />}

      {/* Cycle completion section */}
      <section
        className="relative border-t border-border-subtle py-16 md:py-24"
        style={{ backgroundColor: '#0F172A' }}
      >
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <span className="font-mono text-xs uppercase tracking-[4px] text-accent-emerald">
              Cycle Complete
            </span>
            <h2
              className="font-display mt-4 font-bold text-text-primary"
              style={{ fontSize: '32px', lineHeight: 1.2 }}
            >
              The Loop Continues
            </h2>
            <p className="mt-4 text-base leading-relaxed text-text-secondary">
              Phase 48 feeds directly back into Phase 01, carrying all learned
              intelligence to enhance the next cycle. Each iteration strengthens
              the system&apos;s offensive and defensive capabilities, creating a
              continuously evolving security organism.
            </p>
            <div className="mt-8 flex items-center justify-center gap-2 text-accent-cyan">
              <RotateCcwIcon size={16} className="animate-spin" style={{ animationDuration: '8s' }} />
              <span className="font-mono text-sm">
                {activePhase === TOTAL_PHASES
                  ? 'Cycle complete — restarting...'
                  : `Phase ${String(activePhase).padStart(2, '0')} of ${TOTAL_PHASES}`}
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

/* Icon wrapper for the cycle completion section */
function RotateCcwIcon({ size, className, style }: { size: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}
