import { useState } from 'react'
import { NavLink } from 'react-router'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  RotateCcw,
  FlaskConical,
  Brain,
  Waves,
  Dna,
  Cpu,
  Atom,
  Menu,
  X,
  Shield,
} from 'lucide-react'

const navGroups = [
  {
    label: 'Core',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/evolution', label: 'Evolution Cycle', icon: RotateCcw },
      { to: '/workbench', label: 'Workbench', icon: FlaskConical },
      { to: '/cognitive', label: 'Cognitive Layer', icon: Brain },
    ],
  },
  {
    label: 'Visualizations',
    items: [
      { to: '/viz/fluid', label: 'Fluid Dynamics', icon: Waves },
      { to: '/viz/dna', label: 'DNA Morph', icon: Dna },
      { to: '/viz/hollowing', label: 'Process Hollowing', icon: Cpu },
      { to: '/viz/quantum', label: 'Quantum Tunnel', icon: Atom },
    ],
  },
]

export default function Navbar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-md bg-bg-surface border border-border-subtle text-text-primary shadow-card md:hidden"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`
          fixed left-0 top-0 z-40 flex h-full flex-col border-r border-border-subtle bg-bg-surface
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:translate-x-0 transition-transform duration-200
        `}
        style={{ width: collapsed ? 64 : 260 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-cyan/10">
            <Shield size={22} className="text-accent-cyan" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
                className="font-display text-xl font-bold text-text-primary whitespace-nowrap overflow-hidden"
              >
                Scientisec
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="mx-4 h-px bg-border-subtle" />

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex mx-3 mt-3 mb-1 items-center justify-center h-8 rounded-md hover:bg-accent-cyan/5 transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <Menu size={16} className="text-text-muted" />
          ) : (
            <X size={16} className="text-text-muted rotate-90" />
          )}
        </button>

        {/* Nav groups */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="mb-2 px-3 block text-xs font-medium uppercase tracking-wider text-text-muted"
                  >
                    {group.label}
                  </motion.span>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      end={item.to === '/'}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-3 py-3 text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? 'bg-accent-cyan-dim/30 text-accent-cyan border-l-[3px] border-accent-cyan'
                            : 'text-text-secondary hover:bg-accent-cyan/[0.04] hover:text-text-primary border-l-[3px] border-transparent'
                        } ${collapsed ? 'justify-center px-2' : ''}`
                      }
                    >
                      <Icon size={20} className="shrink-0" />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="whitespace-nowrap overflow-hidden"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Status indicator */}
        <div className="border-t border-border-subtle px-4 py-4">
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-accent-emerald opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent-emerald" />
            </span>
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-text-muted whitespace-nowrap"
                >
                  System Active
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
