import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Search,
  Cpu,
  Zap,
  Network,
  Dna,
  Brain,
  Waves,
  Globe,
  ChartLine,
  FlaskConical,
  Activity,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

interface Tool {
  name: string
  domain: string
  security: string
  description: string
  layerColor: string
  layerColorDim: string
  icon: React.ElementType
  link: string
  layer: number
}

const tools: Tool[] = [
  /* Layer 1 — Physical & Molecular Systems (rose) */
  {
    name: 'LAMMPS',
    domain: 'Molecular Dynamics Simulator',
    security: 'Binary Vulnerability Analysis',
    description: 'Molecular dynamics force-field simulations map to buffer overflow chain analysis. Atomic interactions model memory corruption propagation through the stack.',
    layerColor: 'accent-rose',
    layerColorDim: 'accent-rose-dim',
    icon: Cpu,
    link: '/workbench',
    layer: 1,
  },
  {
    name: 'Quantum ESPRESSO',
    domain: 'Quantum Chemistry',
    security: 'Encryption Key Molecular Stability',
    description: 'DFT calculations model quantum key stability under stress. Simulates superposition collapse scenarios to predict key degradation over time.',
    layerColor: 'accent-rose',
    layerColorDim: 'accent-rose-dim',
    icon: Zap,
    link: '/viz/quantum',
    layer: 1,
  },
  {
    name: 'OpenFOAM',
    domain: 'Computational Fluid Dynamics',
    security: 'Network Traffic & DDoS Mitigation',
    description: 'CFD turbulence models simulate network traffic flow. Visualizes DDoS attacks as fluid instabilities and designs mitigation as flow control.',
    layerColor: 'accent-rose',
    layerColorDim: 'accent-rose-dim',
    icon: Waves,
    link: '/viz/fluid',
    layer: 1,
  },
  {
    name: 'GADGET-4',
    domain: 'Astrophysical Simulation',
    security: 'N-Body Process Management',
    description: 'TreePM N-body gravitation models process hierarchy hijacking. Simulates how a rogue process attracts and subverts child processes over time.',
    layerColor: 'accent-rose',
    layerColorDim: 'accent-rose-dim',
    icon: Globe,
    link: '/workbench',
    layer: 1,
  },
  /* Layer 2 — Genomics & Neuroscience (amber) */
  {
    name: 'Bioconductor',
    domain: 'Genomic Data Analysis',
    security: 'Malware Phylogenetics & YARA Rules',
    description: 'Genomic alignment algorithms trace malware lineage and evolution. Phylogenetic trees map malware family relationships, while sequence patterns auto-generate YARA detection rules for variant identification.',
    layerColor: 'accent-amber',
    layerColorDim: 'accent-amber-dim',
    icon: Dna,
    link: '/viz/dna',
    layer: 2,
  },
  {
    name: 'NEURON',
    domain: 'Neuroscience Simulation',
    security: 'Process Firing Pattern Simulation',
    description: 'Neural action potential models detect anomalous process firing patterns. Simulates how legitimate process trees are hijacked by mimicking normal behavioral signatures.',
    layerColor: 'accent-amber',
    layerColorDim: 'accent-amber-dim',
    icon: Brain,
    link: '/viz/hollowing',
    layer: 2,
  },
  /* Layer 3 — Political Science & Economics (violet) */
  {
    name: 'NetLogo',
    domain: 'Agent-Based Modeling',
    security: 'Phishing Spread Simulation',
    description: 'Agent-based models simulate phishing email propagation through organizational networks. Tests how different user behaviors and security policies affect infection rates.',
    layerColor: 'accent-violet',
    layerColorDim: 'accent-violet-dim',
    icon: Network,
    link: '/workbench',
    layer: 3,
  },
  {
    name: 'Stan',
    domain: 'Statistical Modeling',
    security: 'Attack Probability Prediction',
    description: 'Bayesian inference models predict attack probability distributions. Hierarchical models correlate threat indicators to forecast likely attack vectors and timing.',
    layerColor: 'accent-violet',
    layerColorDim: 'accent-violet-dim',
    icon: ChartLine,
    link: '/workbench',
    layer: 3,
  },
  {
    name: 'QuantEcon',
    domain: 'Economic Computing',
    security: 'Trading Bot & Sandwich Attack Modeling',
    description: 'Dynamic programming models simulate MEV extraction and sandwich attacks on blockchain. Optimizes bot strategies by modeling adversarial transaction ordering.',
    layerColor: 'accent-violet',
    layerColorDim: 'accent-violet-dim',
    icon: Activity,
    link: '/workbench',
    layer: 3,
  },
  {
    name: 'MGGG',
    domain: 'Spatial Political Science',
    security: 'Network Zone Analysis',
    description: 'Spatial partitioning algorithms analyze network segmentation efficiency. Gerrymandering metrics evaluate whether security zones actually protect critical assets.',
    layerColor: 'accent-violet',
    layerColorDim: 'accent-violet-dim',
    icon: Globe,
    link: '/workbench',
    layer: 3,
  },
  {
    name: 'V-Dem',
    domain: 'Global Political Data',
    security: 'Access Pattern Modeling',
    description: 'Large-scale political behavior datasets model insider threat access patterns. Correlates authorization anomalies with behavioral indicators across organizational hierarchies.',
    layerColor: 'accent-violet',
    layerColorDim: 'accent-violet-dim',
    icon: Globe,
    link: '/workbench',
    layer: 3,
  },
  {
    name: 'Z-Tree',
    domain: 'Experimental Economics',
    security: 'Strategic Interaction Programming',
    description: 'Experimental game theory frameworks model red team vs. blue team strategic interactions. Tests optimal defensive resource allocation under adversarial conditions.',
    layerColor: 'accent-violet',
    layerColorDim: 'accent-violet-dim',
    icon: FlaskConical,
    link: '/workbench',
    layer: 3,
  },
  /* Layer 4 — Meteorology & Oceanography (emerald) */
  {
    name: 'WRF-ARW',
    domain: 'Numerical Weather Prediction',
    security: 'APT Movement Prediction',
    description: 'Numerical weather prediction models forecast APT campaign progression. Tracks threat actor fronts as they move through network infrastructure over time.',
    layerColor: 'accent-emerald',
    layerColorDim: 'accent-emerald-dim',
    icon: Activity,
    link: '/workbench',
    layer: 4,
  },
  {
    name: 'ROMS',
    domain: 'Ocean Modeling',
    security: 'Network Segment Modeling',
    description: 'Ocean current circulation models map data exfiltration pathways through segmented networks. Models how lateral movement flows between security zones.',
    layerColor: 'accent-emerald',
    layerColorDim: 'accent-emerald-dim',
    icon: Waves,
    link: '/workbench',
    layer: 4,
  },
  {
    name: 'FESOM',
    domain: 'Climate System Modeling',
    security: 'Global Network Condition Modeling',
    description: 'Unstructured mesh climate models simulate global network topology stress. Predicts cascading failures from regional outages in distributed infrastructure.',
    layerColor: 'accent-emerald',
    layerColorDim: 'accent-emerald-dim',
    icon: Globe,
    link: '/workbench',
    layer: 4,
  },
  {
    name: 'MALLET',
    domain: 'Machine Learning for NLP',
    security: 'Social Gravity & Influence Analysis',
    description: 'Topic modeling and document classification analyze social engineering payload effectiveness. Measures gravity of phishing lures by modeling linguistic influence patterns.',
    layerColor: 'accent-emerald',
    layerColorDim: 'accent-emerald-dim',
    icon: Brain,
    link: '/workbench',
    layer: 4,
  },
]

const layerConfig = [
  {
    id: 1,
    badge: 'LAYER 1',
    title: 'Physical & Molecular Systems',
    subtitle: 'Molecular dynamics, quantum chemistry, fluid simulation, and astrophysical modeling repurposed for binary exploitation, cryptographic analysis, network traffic manipulation, and process-level attacks.',
    color: 'accent-rose',
    colorHex: '#F43F5E',
  },
  {
    id: 2,
    badge: 'LAYER 2',
    title: 'Genomics & Neuroscience',
    subtitle: 'Genomic sequencing tools and neural network simulators adapted for malware phylogenetic analysis, behavioral pattern detection, and evolutionary threat modeling.',
    color: 'accent-amber',
    colorHex: '#F59E0B',
  },
  {
    id: 3,
    badge: 'LAYER 3',
    title: 'Political Science & Economics',
    subtitle: 'Agent-based modeling, statistical inference, economic simulation, spatial analysis, and behavioral economics repurposed for phishing propagation modeling, attack probability prediction, and strategic adversary analysis.',
    color: 'accent-violet',
    colorHex: '#8B5CF6',
  },
  {
    id: 4,
    badge: 'LAYER 4',
    title: 'Meteorology & Oceanography',
    subtitle: 'Weather forecasting, ocean circulation, climate system modeling, and natural language processing repurposed for APT movement prediction, network infrastructure modeling, and social engineering influence analysis.',
    color: 'accent-emerald',
    colorHex: '#10B981',
  },
]

/* ------------------------------------------------------------------ */
/*  HOOKS                                                              */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, duration: number, delay: number, inView: boolean) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!inView || started.current) return
    started.current = true

    const timer = setTimeout(() => {
      const startTime = Date.now()
      const step = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / (duration * 1000), 1)
        setCount(Math.floor(progress * target))
        if (progress < 1) requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, delay * 1000)

    return () => clearTimeout(timer)
  }, [inView, target, duration, delay])

  return count
}

/* ------------------------------------------------------------------ */
/*  HERO SECTION                                                       */
/* ------------------------------------------------------------------ */

function HeroSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <section
      ref={ref}
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-bg-void"
    >
      {/* Grid pattern background */}
      <div
        className="pointer-events-none absolute inset-0 animate-grid-drift opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='256' height='256' viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h256v256H0z' fill='none'/%3E%3Cpath d='M0 0h2v256H0z' fill='%2306B6D4'/%3E%3Cpath d='M0 0h256v2H0z' fill='%2306B6D4'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }}
      />

      {/* Gradient mesh */}
      <div
        className="pointer-events-none absolute animate-gradient-mesh opacity-30"
        style={{
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
          top: '10%',
          left: '60%',
        }}
      />

      {/* Noise texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: 'url(/noise-texture.png)', backgroundSize: '512px' }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1200px] px-6 text-center">
        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
          className="mb-6 font-mono text-xs font-medium uppercase tracking-[4px] text-accent-cyan"
        >
          Scientific Offensive Security Workbench
        </motion.p>

        {/* Main Title */}
        <div className="mb-5 space-y-1">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
            className="font-display text-4xl font-bold leading-[1.05] text-text-primary md:text-5xl lg:text-[64px]"
          >
            Mapping Scientific Computing
          </motion.h1>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.65, ease: 'easeOut' }}
            className="font-display text-4xl font-bold leading-[1.05] md:text-5xl lg:text-[64px]"
            style={{
              background: 'linear-gradient(135deg, #06B6D4, #10B981)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            to Offensive Security
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-text-secondary"
        >
          Explore 16+ scientific tools repurposed for red teaming, vulnerability
          analysis, and defensive patching across four security domains.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 1.1, ease: 'easeOut' }}
          className="mb-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <button
            onClick={() => {
              const el = document.getElementById('layer-1')
              el?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="rounded-md bg-accent-cyan px-6 py-3 text-sm font-semibold text-bg-void shadow-glow-cyan transition-all hover:bg-accent-cyan/90 hover:shadow-lg w-full sm:w-auto"
          >
            Explore Layers
          </button>
          <button
            onClick={() => navigate('/evolution')}
            className="rounded-md border border-border-active px-6 py-3 text-sm font-semibold text-text-primary transition-all hover:border-accent-cyan hover:text-accent-cyan w-full sm:w-auto"
          >
            View Evolution Cycle
          </button>
        </motion.div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          <StatItem target={16} suffix="+" label="Scientific Tools" inView={inView} delay={1.3} />
          <StatItem target={4} suffix="" label="Security Layers" inView={inView} delay={1.5} />
          <StatItem target={48} suffix="" label="Evolution Phases" inView={inView} delay={1.7} />
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: scrolled ? 0 : 1 } : {}}
        transition={{ duration: 0.4, delay: 1.8 }}
        className="absolute bottom-10 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <ChevronDown
          size={20}
          className="animate-bounce-chevron text-text-muted"
        />
        <span className="text-xs text-text-muted">Scroll to explore</span>
      </motion.div>
    </section>
  )
}

function StatItem({
  target,
  suffix,
  label,
  inView,
  delay,
}: {
  target: number
  suffix: string
  label: string
  inView: boolean
  delay: number
}) {
  const count = useCountUp(target, 1.5, delay, inView)

  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-3xl font-bold text-accent-cyan md:text-[32px]">
        {count}
        {suffix}
      </span>
      <span className="mt-1 text-xs text-text-muted">{label}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  STATUS BAR                                                         */
/* ------------------------------------------------------------------ */

function StatusBar() {
  const [time, setTime] = useState('')
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    const update = () => {
      const now = new Date()
      setTime(
        now.toUTCString().slice(17, 25)
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="sticky top-0 z-30 flex h-14 items-center border-y border-border-subtle bg-bg-surface"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 lg:px-8">
        {/* Live clock */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-accent-emerald opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-emerald" />
          </span>
          <span className="font-mono text-xs text-text-muted">UTC {time}</span>
        </div>

        {/* Platform status */}
        <div className="hidden items-center gap-3 sm:flex">
          <span className="text-sm text-text-secondary">
            Platform Status:{" "}
            <span className="text-accent-emerald font-medium">Active</span>
          </span>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-1.5 rounded-sm bg-accent-rose" />
            <div className="h-1.5 w-1.5 rounded-sm bg-accent-amber" />
            <div className="h-1.5 w-1.5 rounded-sm bg-accent-violet" />
            <div className="h-1.5 w-1.5 rounded-sm bg-accent-emerald" />
          </div>
        </div>

        {/* Active simulations */}
        <div className="flex items-center gap-2">
          <FlaskConical size={12} className="text-text-muted" />
          <span className="text-sm text-text-muted">0 Simulations Running</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  FILTER TOOLBAR                                                     */
/* ------------------------------------------------------------------ */

const filterPills = [
  { label: 'All', layer: 0, color: '' },
  { label: 'Layer 1', layer: 1, color: 'accent-rose' },
  { label: 'Layer 2', layer: 2, color: 'accent-amber' },
  { label: 'Layer 3', layer: 3, color: 'accent-violet' },
  { label: 'Layer 4', layer: 4, color: 'accent-emerald' },
]

function FilterToolbar({
  activeLayer,
  onLayerChange,
  searchQuery,
  onSearchChange,
}: {
  activeLayer: number
  onLayerChange: (layer: number) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -10 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="sticky top-14 z-20 border-b border-border-subtle bg-bg-deep/90 backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        {/* Filter pills */}
        <div className="flex flex-wrap items-center gap-2">
          {filterPills.map((pill) => {
            const isActive = activeLayer === pill.layer
            const colorClass = pill.color
              ? {
                  'accent-rose': {
                    active: 'bg-accent-rose/15 text-accent-rose border-accent-rose/30',
                    inactive: 'text-text-muted border-border-subtle hover:bg-accent-rose/[0.08]',
                  },
                  'accent-amber': {
                    active: 'bg-accent-amber/15 text-accent-amber border-accent-amber/30',
                    inactive: 'text-text-muted border-border-subtle hover:bg-accent-amber/[0.08]',
                  },
                  'accent-violet': {
                    active: 'bg-accent-violet/15 text-accent-violet border-accent-violet/30',
                    inactive: 'text-text-muted border-border-subtle hover:bg-accent-violet/[0.08]',
                  },
                  'accent-emerald': {
                    active: 'bg-accent-emerald/15 text-accent-emerald border-accent-emerald/30',
                    inactive: 'text-text-muted border-border-subtle hover:bg-accent-emerald/[0.08]',
                  },
                }[pill.color]
              : {
                  active: 'bg-text-primary/10 text-text-primary border-text-primary/20',
                  inactive: 'text-text-muted border-border-subtle hover:bg-text-primary/[0.04]',
                }

            return (
              <button
                key={pill.layer}
                onClick={() => onLayerChange(pill.layer)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                  isActive ? colorClass?.active : colorClass?.inactive
                }`}
              >
                {pill.label}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative flex-shrink-0">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search tools, domains..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-9 w-full rounded-md border border-border-subtle bg-bg-surface py-2 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-cyan focus:shadow-glow-cyan focus:outline-none transition-all sm:w-[280px]"
          />
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  TOOL CARD                                                          */
/* ------------------------------------------------------------------ */

function ToolCard({ tool, index }: { tool: Tool; index: number }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-15% 0px' })
  const navigate = useNavigate()
  const Icon = tool.icon as React.ComponentType<{ size?: number; className?: string }>

  const colorMap: Record<string, { border: string; badge: string; badgeText: string; hoverGlow: string }> = {
    'accent-rose': {
      border: 'border-l-accent-rose',
      badge: 'bg-accent-rose-dim',
      badgeText: 'text-accent-rose',
      hoverGlow: 'hover:shadow-glow-rose',
    },
    'accent-amber': {
      border: 'border-l-accent-amber',
      badge: 'bg-accent-amber-dim',
      badgeText: 'text-accent-amber',
      hoverGlow: 'hover:shadow-glow-cyan',
    },
    'accent-violet': {
      border: 'border-l-accent-violet',
      badge: 'bg-accent-violet-dim',
      badgeText: 'text-accent-violet',
      hoverGlow: 'hover:shadow-glow-cyan',
    },
    'accent-emerald': {
      border: 'border-l-accent-emerald',
      badge: 'bg-accent-emerald-dim',
      badgeText: 'text-accent-emerald',
      hoverGlow: 'hover:shadow-glow-cyan',
    },
  }

  const colors = colorMap[tool.layerColor] || colorMap['accent-rose']

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      layout
      className={`group relative flex min-h-[180px] flex-col rounded-lg border border-border-subtle border-l-4 ${colors.border} bg-bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-cyan-dim hover:shadow-elevated ${colors.hoverGlow} cursor-pointer`}
      onClick={() => navigate(tool.link)}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="font-mono text-sm font-semibold text-text-primary">
          {tool.name}
        </h3>
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-medium ${colors.badge} ${colors.badgeText}`}
        >
          {tool.security}
        </span>
      </div>

      {/* Meta */}
      <div className="mb-2 flex items-center gap-2 text-text-muted">
        <Icon size={14} />
        <span className="text-xs">{tool.domain}</span>
      </div>

      {/* Description */}
      <p className="mb-4 line-clamp-2 flex-1 text-sm leading-relaxed text-text-secondary">
        {tool.description}
      </p>

      {/* Footer */}
      <div className="mt-auto flex items-center gap-4">
        <button
          onClick={(e) => {
            e.stopPropagation()
          }}
          className="text-xs font-medium text-accent-cyan transition-colors hover:text-accent-cyan/80"
        >
          Map
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(tool.link)
          }}
          className="text-xs font-medium text-accent-cyan transition-colors hover:text-accent-cyan/80"
        >
          Simulate
        </button>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  LAYER SECTION                                                      */
/* ------------------------------------------------------------------ */

function LayerSection({
  layer,
  layerTools,
}: {
  layer: (typeof layerConfig)[0]
  layerTools: Tool[]
}) {
  const headerRef = useRef(null)
  const inView = useInView(headerRef, { once: true, margin: '-20% 0px' })

  const gradientColors: Record<string, string> = {
    'accent-rose': 'from-accent-rose/[0.03]',
    'accent-amber': 'from-accent-amber/[0.03]',
    'accent-violet': 'from-accent-violet/[0.03]',
    'accent-emerald': 'from-accent-emerald/[0.03]',
  }

  return (
    <section
      id={`layer-${layer.id}`}
      className={`relative bg-gradient-to-r ${gradientColors[layer.color] || ''} to-transparent`}
    >
      <div className="mx-auto max-w-[1440px] px-6 pb-16 pt-20 lg:px-8 lg:pt-[120px]">
        {/* Layer Header */}
        <div ref={headerRef} className="mb-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="mb-3 inline-flex"
          >
            <span
              className="rounded-full px-4 py-1.5 text-xs font-medium"
              style={{
                backgroundColor: `${layer.colorHex}20`,
                color: layer.colorHex,
              }}
            >
              {layer.badge}
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
            className="mb-3 font-display text-2xl font-bold text-text-primary md:text-3xl"
          >
            {layer.title}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
            className="max-w-2xl text-base leading-relaxed text-text-secondary"
          >
            {layer.subtitle}
          </motion.p>
        </div>

        {/* Tool Cards Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {layerTools.map((tool, i) => (
              <ToolCard key={tool.name} tool={tool} index={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  END INDICATOR                                                      */
/* ------------------------------------------------------------------ */

function EndIndicator() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center py-16"
    >
      <div className="flex items-center gap-4">
        <div className="h-px w-12 bg-border-subtle" />
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-cyan/10">
          <Shield size={14} className="text-accent-cyan" />
        </div>
        <div className="h-px w-12 bg-border-subtle" />
      </div>
    </motion.div>
  )
}

function Shield(props: React.SVGProps<SVGSVGElement> & { size?: number }) {
  const { size = 24, ...rest } = props
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
      {...rest}
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  )
}

/* ------------------------------------------------------------------ */
/*  HOME PAGE                                                          */
/* ------------------------------------------------------------------ */

export default function Home() {
  const [activeLayer, setActiveLayer] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTools = tools.filter((tool) => {
    const matchesLayer = activeLayer === 0 || tool.layer === activeLayer
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      !q ||
      tool.name.toLowerCase().includes(q) ||
      tool.domain.toLowerCase().includes(q) ||
      tool.security.toLowerCase().includes(q)
    return matchesLayer && matchesSearch
  })

  return (
    <div className="bg-bg-deep">
      <HeroSection />
      <StatusBar />
      <FilterToolbar
        activeLayer={activeLayer}
        onLayerChange={setActiveLayer}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {layerConfig.map((layer) => {
        const layerTools = filteredTools.filter((t) => t.layer === layer.id)
        if (layerTools.length === 0) return null
        return (
          <LayerSection key={layer.id} layer={layer} layerTools={layerTools} />
        )
      })}

      {filteredTools.length === 0 && (
        <div className="flex min-h-[300px] items-center justify-center">
          <p className="text-text-muted">No tools match your criteria.</p>
        </div>
      )}

      {filteredTools.length > 0 && <EndIndicator />}
    </div>
  )
}
