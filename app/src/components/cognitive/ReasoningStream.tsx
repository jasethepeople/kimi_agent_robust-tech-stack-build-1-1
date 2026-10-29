import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface LogEntry {
  id: number;
  timestamp: string;
  type: ReasoningType;
  message: string;
  fullText: string;
  charIndex: number;
}

type ReasoningType = 'OBSERVE' | 'REASON' | 'PLAN' | 'EXECUTE' | 'REFLECT';

const TYPE_COLORS: Record<ReasoningType, string> = {
  OBSERVE: '#06B6D4',
  REASON: '#8B5CF6',
  PLAN: '#F59E0B',
  EXECUTE: '#10B981',
  REFLECT: '#F43F5E',
};

const SAMPLE_ENTRIES: { type: ReasoningType; message: string }[] = [
  { type: 'OBSERVE', message: 'New network traffic anomaly detected on segment 192.168.4.0/24' },
  { type: 'REASON', message: 'Traffic pattern resembles DDoS precursor — burst alignment suggests coordinated probe' },
  { type: 'REASON', message: 'Cross-referencing with Layer 4 WRF-ARW model — threat front approaching from east segment' },
  { type: 'PLAN', message: 'Activate OpenFOAM fluid simulation with traffic_rate=50Gbps, attack_vectors=8' },
  { type: 'PLAN', message: 'Notify Layer 1 LAMMPS to prepare buffer overflow scan on exposed services' },
  { type: 'EXECUTE', message: 'Simulation workbench configured — OpenFOAM parameters set' },
  { type: 'OBSERVE', message: 'Simulation output: 73% probability of DDoS within 15 minutes' },
  { type: 'REFLECT', message: 'Previous similar scenario (Phase 17, Cycle 12) had 68% accuracy — confidence: HIGH' },
  { type: 'PLAN', message: 'Recommend: Activate DDoS mitigation at 75% threshold, pre-position Layer 4 defenses' },
  { type: 'OBSERVE', message: 'Layer 4 defense grid reports all systems nominal, readiness 100%' },
  { type: 'REASON', message: 'Historical correlation: 73% DDoS probability + HIGH confidence = action required within 5 min' },
  { type: 'EXECUTE', message: 'Dispatched pre-position command to Layer 4 WRF-ARW sentinel nodes' },
  { type: 'OBSERVE', message: 'Anomaly volume increasing — traffic burst rate now 12.3 Gbps, trending upward' },
  { type: 'REASON', message: 'Pattern match: Spectral signature aligns with known Mirai variant propagation wave' },
  { type: 'PLAN', message: 'Escalate to full incident response — notify SOC and activate kill-switch standby' },
  { type: 'EXECUTE', message: 'Kill-switch armed on segments 192.168.4.0/24 through 192.168.7.0/24' },
  { type: 'REFLECT', message: 'Decision tree evaluation: 94.2% accuracy on similar historical patterns — proceed' },
  { type: 'OBSERVE', message: 'Threat containment successful — traffic normalized, anomaly resolved at 14:34:22' },
  { type: 'REASON', message: 'Root cause: Coordinated probe from 847 compromised IoT devices — geographic cluster Eastern EU' },
  { type: 'REFLECT', message: 'Post-incident analysis complete: Response time 2m 18s, 15% faster than historical average' },
];

let globalId = 0;

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 8);
}

const ReasoningStream = memo(function ReasoningStream() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [isLive, setIsLive] = useState(true);
  const [typingEntryId, setTypingEntryId] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sampleIndexRef = useRef(0);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const addTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries.length, typingEntryId]);

  const startTyping = useCallback((entry: LogEntry) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    setTypingEntryId(entry.id);

    typingIntervalRef.current = setInterval(() => {
      setEntries((prev) => {
        const idx = prev.findIndex((e) => e.id === entry.id);
        if (idx === -1) return prev;
        const target = prev[idx];
        if (target.charIndex >= target.fullText.length) {
          if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
          setTypingEntryId(null);
          return prev;
        }
        const updated = { ...target, charIndex: target.charIndex + 1, message: target.fullText.slice(0, target.charIndex + 1) };
        const next = [...prev];
        next[idx] = updated;
        return next;
      });
    }, 30);
  }, []);

  const addEntry = useCallback(() => {
    if (!isLive) return;

    const sample = SAMPLE_ENTRIES[sampleIndexRef.current % SAMPLE_ENTRIES.length];
    sampleIndexRef.current += 1;

    const now = new Date();
    now.setSeconds(now.getSeconds() + sampleIndexRef.current); // offset for realism

    const newEntry: LogEntry = {
      id: globalId++,
      timestamp: formatTime(now),
      type: sample.type,
      message: '',
      fullText: sample.message,
      charIndex: 0,
    };

    setEntries((prev) => {
      const next = [...prev, newEntry];
      if (next.length > 500) next.shift();
      return next;
    });

    startTyping(newEntry);
  }, [isLive, startTyping]);

  // Add entries periodically
  useEffect(() => {
    if (!isLive) return;

    const scheduleNext = () => {
      const delay = 2000 + Math.random() * 3000; // 2-5 seconds between entries
      addTimeoutRef.current = setTimeout(() => {
        addEntry();
        scheduleNext();
      }, delay);
    };

    // Add first entry after a short delay
    addTimeoutRef.current = setTimeout(() => {
      addEntry();
      scheduleNext();
    }, 1500);

    return () => {
      if (addTimeoutRef.current) clearTimeout(addTimeoutRef.current);
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, [isLive, addEntry]);

  const handleClear = useCallback(() => {
    setEntries([]);
    setTypingEntryId(null);
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
  }, []);

  const handleToggleLive = useCallback(() => {
    setIsLive((prev) => !prev);
  }, []);

  // Keep only last 500 entries
  useEffect(() => {
    setEntries((prev) => {
      if (prev.length > 500) return prev.slice(prev.length - 500);
      return prev;
    });
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ amount: 0.15 }}
      transition={{ duration: 0.5 }}
      className="w-full overflow-hidden rounded-lg border border-border-subtle bg-bg-void"
      style={{ height: 500 }}
    >
      {/* Panel Header */}
      <div className="flex h-9 items-center justify-between border-b border-border-subtle px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">Cognitive Stream</span>
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{
                backgroundColor: isLive ? '#8B5CF6' : '#64748B',
                animation: isLive ? 'pulse-dot 2s infinite' : 'none',
              }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: isLive ? '#8B5CF6' : '#64748B' }}
            />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleLive}
            className="rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-colors"
            style={{
              color: isLive ? '#8B5CF6' : '#64748B',
              border: `1px solid ${isLive ? '#5B21B6' : '#1E293B'}`,
              backgroundColor: isLive ? 'rgba(91, 33, 182, 0.2)' : 'transparent',
            }}
          >
            {isLive ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={handleClear}
            className="flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-text-muted transition-colors hover:bg-bg-surface hover:text-text-primary"
          >
            <Trash2 size={10} />
            Clear
          </button>
        </div>
      </div>

      {/* Log Content */}
      <div ref={scrollRef} className="overflow-y-auto px-4 py-3" style={{ height: 465 }}>
        {entries.map((entry, idx) => (
          <div key={entry.id} className="mb-1 font-mono text-xs leading-relaxed">
            <span className="text-text-muted">[{entry.timestamp}]</span>{' '}
            <span
              className="inline-block font-medium"
              style={{ color: TYPE_COLORS[entry.type] }}
            >
              [{entry.type}]
            </span>{' '}
            <span className="text-text-secondary">
              {entry.message}
              {typingEntryId === entry.id && idx === entries.length - 1 && (
                <span
                  className="ml-0.5 inline-block"
                  style={{
                    width: 2,
                    height: 14,
                    backgroundColor: '#8B5CF6',
                    animation: 'caret-blink 1.25s ease-out infinite',
                    verticalAlign: 'middle',
                  }}
                />
              )}
            </span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="flex h-full items-center justify-center text-text-muted">
            <span className="font-mono text-xs">Waiting for cognitive stream...</span>
          </div>
        )}
      </div>
    </motion.div>
  );
});

export default ReasoningStream;
