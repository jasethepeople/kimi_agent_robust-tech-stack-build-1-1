import { useState, useEffect, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

interface ToolCard {
  layer: number;
  layerLabel: string;
  layerColor: string;
  layerColorDim: string;
  toolName: string;
  status: string;
  statusColor: string;
  command: string;
  progress: number;
}

const TOOL_CARDS: ToolCard[] = [
  {
    layer: 1,
    layerLabel: 'Physical & Molecular',
    layerColor: '#F43F5E',
    layerColorDim: '#9F1239',
    toolName: 'LAMMPS',
    status: 'Running — Buffer Overflow Scan',
    statusColor: '#10B981',
    command: 'SET stack_depth=16, buffer_size=256',
    progress: 0,
  },
  {
    layer: 2,
    layerLabel: 'Genomics & Neuroscience',
    layerColor: '#F59E0B',
    layerColorDim: '#92400E',
    toolName: 'NEURON',
    status: 'Monitoring Process Patterns',
    statusColor: '#10B981',
    command: 'ENABLE spike_monitor, threshold=-55mV',
    progress: 0,
  },
  {
    layer: 3,
    layerLabel: 'Political Science & Economics',
    layerColor: '#8B5CF6',
    layerColorDim: '#5B21B6',
    toolName: 'NetLogo',
    status: 'Phishing Simulation Active',
    statusColor: '#10B981',
    command: 'DEPLOY agent_count=500, success_rate=0.23',
    progress: 0,
  },
  {
    layer: 4,
    layerLabel: 'Meteorology & Oceanography',
    layerColor: '#10B981',
    layerColorDim: '#065F46',
    toolName: 'WRF-ARW',
    status: 'APT Front Tracking',
    statusColor: '#10B981',
    command: 'SET resolution=3km, domain=east_sector',
    progress: 0,
  },
];

interface CommandEntry {
  id: number;
  command: string;
  response: string;
}

const SAMPLE_COMMANDS: CommandEntry[] = [
  { id: 1, command: 'LLM → LAMMPS: SET stack_depth=16', response: 'LAMMPS → LLM: Buffer scan initialized, ETA 4m 12s' },
  { id: 2, command: 'LLM → NEURON: ENABLE spike_monitor', response: 'NEURON → LLM: Monitoring 847 active synapses' },
  { id: 3, command: 'LLM → NetLogo: DEPLOY agents=500', response: 'NetLogo → LLM: Simulation running, batch 23/50' },
  { id: 4, command: 'LLM → WRF: SET resolution=3km', response: 'WRF → LLM: Grid configured, forecast cycle active' },
  { id: 5, command: 'LLM → LAMMPS: GET scan_progress', response: 'LAMMPS → LLM: Progress 34%, 12 anomalies detected' },
  { id: 6, command: 'LLM → NEURON: ANALYZE burst_pattern', response: 'NEURON → LLM: Pattern match: DDoS precursor (confidence 0.73)' },
];

const ToolOrchestration = memo(function ToolOrchestration() {
  const [progressValues, setProgressValues] = useState<number[]>([0, 0, 0, 0]);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const startTimes = [
      Date.now() - 60000,
      Date.now() - 90000,
      Date.now() - 45000,
      Date.now() - 120000,
    ];
    const durations = [240000, 180000, 300000, 200000]; // ms

    const animate = () => {
      const now = Date.now();
      setProgressValues(
        startTimes.map((start, i) => {
          const elapsed = now - start;
          const p = Math.min(100, (elapsed / durations[i]) * 100);
          return p;
        })
      );
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div>
      {/* Tool Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TOOL_CARDS.map((card, i) => (
          <motion.div
            key={card.layer}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="rounded-lg border border-border-subtle bg-bg-surface p-4"
            style={{ borderLeft: `3px solid ${card.layerColor}` }}
          >
            {/* Header */}
            <div className="mb-2">
              <div className="flex items-center justify-between">
                <span
                  className="font-mono text-[10px] uppercase tracking-wider"
                  style={{ color: card.layerColor }}
                >
                  LAYER {card.layer}
                </span>
              </div>
              <p className="text-xs text-text-muted">{card.layerLabel}</p>
            </div>

            {/* Tool name */}
            <div className="mb-2 flex items-center gap-2">
              <Cpu size={14} style={{ color: card.layerColor }} />
              <span className="font-mono text-base font-medium text-text-primary">
                {card.toolName}
              </span>
            </div>

            {/* Status */}
            <p className="mb-3 text-xs" style={{ color: card.statusColor }}>
              {card.status}
            </p>

            {/* Progress bar */}
            <div className="mb-3 h-1 overflow-hidden rounded-full bg-bg-deep">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: card.layerColor }}
                animate={{ width: `${progressValues[i]}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Command */}
            <p className="truncate font-mono text-[10px] text-text-muted">
              {card.command}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Command Log */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ amount: 0.2 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mt-6 overflow-hidden rounded-md border border-border-subtle bg-bg-void"
      >
        <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2">
          <span className="text-xs font-semibold text-text-primary">Command Log</span>
        </div>
        <div className="max-h-[200px] overflow-y-auto px-4 py-2">
          {SAMPLE_COMMANDS.map((entry) => (
            <div key={entry.id} className="mb-1 flex gap-4 font-mono text-[10px] leading-relaxed">
              <span className="shrink-0 text-accent-cyan">{entry.command}</span>
              <span className="text-text-muted">|</span>
              <span className="text-accent-emerald">{entry.response}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
});

export default ToolOrchestration;
