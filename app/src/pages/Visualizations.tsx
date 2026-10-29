import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { motion } from 'framer-motion'
import { Waves, Dna, Cpu, Atom, ArrowLeft } from 'lucide-react'

const vizCards = [
  {
    title: 'Fluid Dynamics',
    subtitle: 'OpenFOAM → DDoS Mitigation',
    description:
      'Network traffic visualized as turbulent fluid flow. Drag nodes, spawn DDoS attacks, and observe mitigation strategies as flow control.',
    image: '/assets/viz-fluid-placeholder.jpg',
    borderColor: 'border-l-accent-cyan',
    accentColor: 'text-accent-cyan',
    glowColor: 'hover:shadow-glow-cyan',
    link: '/viz/fluid',
    icon: Waves,
  },
  {
    title: 'DNA Morphing Engine',
    subtitle: 'Bioconductor + LLM → Malware Phylogenetics',
    description:
      'Interactive DNA sequence editor with LLM-driven mutation. Edit bases, trigger mutations, and watch phylogenetic trees evolve in real-time.',
    image: '/assets/viz-dna-placeholder.jpg',
    borderColor: 'border-l-accent-emerald',
    accentColor: 'text-accent-emerald',
    glowColor: 'hover:shadow-glow-emerald',
    link: '/viz/dna',
    icon: Dna,
  },
  {
    title: 'Process Hollowing',
    subtitle: 'OpenFOAM + NEURON → Injection Simulation',
    description:
      'Visualize process hollowing and code injection as fluid dynamics meets neural firing. Create hollow processes, inject threads, and observe system responses.',
    image: '/assets/viz-hollowing-placeholder.jpg',
    borderColor: 'border-l-accent-amber',
    accentColor: 'text-accent-amber',
    glowColor: 'hover:shadow-glow-amber',
    link: '/viz/hollowing',
    icon: Cpu,
  },
  {
    title: 'Quantum Tunneling',
    subtitle: 'LAMMPS + Quantum ESPRESSO → Key Stability',
    description:
      'Explore quantum key stability through tunneling probability visualizations. Adjust potential barriers, observe tunneling rates, and detect eavesdropping attempts.',
    image: '/assets/viz-quantum-placeholder.jpg',
    borderColor: 'border-l-accent-violet',
    accentColor: 'text-accent-violet',
    glowColor: 'hover:shadow-glow-violet',
    link: '/viz/quantum',
    icon: Atom,
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
}

const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      staggerChildren: 0.15,
    },
  },
}

const headerItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  },
}

export default function Visualizations() {
  const gridRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-[100dvh] bg-bg-void">
      {/* Header Section */}
      <motion.section
        className="relative flex min-h-[50vh] flex-col items-center justify-center overflow-hidden px-6"
        variants={headerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(#06B6D4 1px, transparent 1px), linear-gradient(90deg, #06B6D4 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <motion.span
          className="mb-4 font-mono text-xs uppercase tracking-[4px] text-accent-cyan"
          variants={headerItemVariants}
        >
          Interactive Demonstrations
        </motion.span>
        <motion.h1
          className="mb-4 text-center font-display text-4xl font-bold text-text-primary md:text-5xl lg:text-[48px]"
          variants={headerItemVariants}
        >
          Scientific Security Visualizations
        </motion.h1>
        <motion.p
          className="max-w-[640px] text-center text-base leading-relaxed text-text-secondary md:text-lg"
          variants={headerItemVariants}
        >
          Interactive 3D simulations that bridge scientific computing and
          offensive security. Explore network traffic as fluid, malware evolution
          as DNA, process injection as neural activity, and encryption as quantum
          states.
        </motion.p>
      </motion.section>

      {/* Viz Card Grid */}
      <section className="mx-auto max-w-[1200px] px-6 pb-16">
        <motion.div
          ref={gridRef}
          className="grid grid-cols-1 gap-6 md:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {vizCards.map((card) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.link}
                variants={cardVariants}
                className="group relative"
              >
                <Link to={card.link} className="block h-full">
                  <div
                    className={`
                      relative flex h-[400px] flex-col justify-end overflow-hidden rounded-lg border border-border-subtle ${card.borderColor} border-l-4 bg-bg-surface
                      transition-all duration-200 ${card.glowColor} hover:-translate-y-0.5 hover:border-opacity-50
                      md:h-[520px]
                    `}
                  >
                    {/* Background image */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{
                        backgroundImage: `url(${card.image})`,
                      }}
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-deep via-bg-deep/90 to-bg-deep/30 transition-opacity duration-300 group-hover:opacity-95" />

                    {/* Content */}
                    <div className="relative z-10 p-6">
                      <div className="mb-3 flex items-center gap-2">
                        <Icon
                          size={18}
                          className={`${card.accentColor}`}
                        />
                        <span
                          className={`font-mono text-xs ${card.accentColor}`}
                        >
                          {card.subtitle}
                        </span>
                      </div>
                      <h2 className="mb-2 font-display text-2xl font-bold text-text-primary">
                        {card.title}
                      </h2>
                      <p className="mb-4 max-w-[480px] text-sm leading-relaxed text-text-secondary">
                        {card.description}
                      </p>
                      <span
                        className={`
                          inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium text-bg-deep
                          transition-all duration-200
                          ${
                            card.borderColor.includes('cyan')
                              ? 'bg-accent-cyan hover:shadow-glow-cyan'
                              : card.borderColor.includes('emerald')
                                ? 'bg-accent-emerald hover:shadow-glow-emerald'
                                : card.borderColor.includes('amber')
                                  ? 'bg-accent-amber hover:shadow-glow-amber'
                                  : 'bg-accent-violet hover:shadow-glow-violet'
                          }
                        `}
                      >
                        Launch Visualization
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </motion.div>

        {/* Back to Dashboard CTA */}
        <motion.div
          className="mt-16 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.6,
            duration: 0.5,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-md border border-border-subtle px-5 py-2.5 text-sm text-text-secondary transition-colors duration-150 hover:border-accent-cyan hover:text-accent-cyan"
          >
            <ArrowLeft size={16} />
            Return to Dashboard
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
