import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Brain, Activity, Clock } from 'lucide-react';
import NeuralParticles from '@/components/cognitive/NeuralParticles';
import ArchitectureCanvas from '@/components/cognitive/ArchitectureCanvas';
import ReasoningStream from '@/components/cognitive/ReasoningStream';
import NetworkGraph from '@/components/cognitive/NetworkGraph';
import ToolOrchestration from '@/components/cognitive/ToolOrchestration';
import LatencyMonitor from '@/components/cognitive/LatencyMonitor';

/* ── Response Time Badge (isolated re-render) ── */
const ResponseTimeBadge = memo(function ResponseTimeBadge() {
  const [responseTime, setResponseTime] = useState(847);

  useEffect(() => {
    const interval = setInterval(() => {
      setResponseTime(820 + Math.floor(Math.random() * 60));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="font-mono text-xs text-text-muted">
      Response Time: {responseTime}ms
    </span>
  );
});

/* ── Main Page ── */
export default function Cognitive() {
  return (
    <div className="min-h-[100dvh] bg-bg-deep">
      {/* ═══════════════ Section 1: Hero ═══════════════ */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: '60vh', minHeight: 400 }}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-bg-void" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url(/hero-cognitive.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />

        {/* Neural particle animation */}
        <NeuralParticles />

        {/* Content */}
        <div
          className="relative z-10 mx-auto flex max-w-[800px] flex-col items-center px-6 text-center"
          style={{ paddingTop: 32 }}
        >
          {/* Eyebrow */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-4 font-mono text-xs font-medium uppercase tracking-[4px] text-accent-violet"
          >
            Cognitive Security Layer
          </motion.span>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="font-display text-4xl font-bold text-text-primary md:text-5xl lg:text-[48px]"
            style={{ lineHeight: 1.1 }}
          >
            The Executive Function
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mx-auto mt-6 max-w-[600px] text-base leading-relaxed text-text-secondary lg:text-lg"
          >
            An LLM-powered cognitive layer that reasons across all four security domains,
            orchestrating tool selection, interpreting results, and generating strategic
            recommendations in real-time.
          </motion.p>

          {/* Status Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="mt-6 flex items-center gap-4"
          >
            {/* LLM Active badge */}
            <span
              className="flex h-9 items-center gap-2 rounded-full border px-4 font-mono text-xs"
              style={{
                backgroundColor: 'rgba(91, 33, 182, 0.3)',
                borderColor: '#8B5CF6',
                color: '#8B5CF6',
              }}
            >
              <span className="relative flex h-2 w-2">
                <span
                  className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full"
                  style={{ backgroundColor: '#8B5CF6' }}
                />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: '#8B5CF6' }} />
              </span>
              LLM Active — GPT-4 Turbo
            </span>

            {/* Response time */}
            <ResponseTimeBadge />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════ Section 2: Architecture Overview ═══════════════ */}
      <section className="border-y border-border-subtle bg-bg-deep">
        <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="mb-6 font-display text-2xl font-bold text-text-primary md:text-[32px]"
            style={{ lineHeight: 1.2 }}
          >
            Cognitive Architecture
          </motion.h2>

          <ArchitectureCanvas />

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ amount: 0.2 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mx-auto mt-6 max-w-[640px] text-center text-base leading-relaxed text-text-secondary"
          >
            The LLM serves as a central orchestrator, receiving observations from all four
            layers, reasoning about cross-domain relationships, and issuing commands to
            activate specific tools, adjust simulation parameters, and generate security
            recommendations.
          </motion.p>
        </div>
      </section>

      {/* ═══════════════ Section 3: Real-Time Reasoning Stream ═══════════════ */}
      <section className="bg-bg-deep py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-center gap-3"
          >
            <Brain size={22} className="text-accent-violet" />
            <h2
              className="font-display text-2xl font-bold text-text-primary md:text-[32px]"
              style={{ lineHeight: 1.2 }}
            >
              Real-Time Reasoning
            </h2>
          </motion.div>

          <ReasoningStream />
        </div>
      </section>

      {/* ═══════════════ Section 4: Cognitive Network Graph ═══════════════ */}
      <section className="bg-bg-deep py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.15 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-center gap-3"
          >
            <Activity size={22} className="text-accent-violet" />
            <h2
              className="font-display text-2xl font-bold text-text-primary md:text-[32px]"
              style={{ lineHeight: 1.2 }}
            >
              Cognitive Network Graph
            </h2>
          </motion.div>

          <NetworkGraph />
        </div>
      </section>

      {/* ═══════════════ Section 5: Tool Orchestration Panel ═══════════════ */}
      <section className="border-t border-border-subtle bg-bg-deep py-10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex items-center gap-3"
          >
            <Clock size={22} className="text-accent-violet" />
            <h2
              className="font-display text-2xl font-bold text-text-primary md:text-[32px]"
              style={{ lineHeight: 1.2 }}
            >
              Active Tool Orchestration
            </h2>
          </motion.div>

          <ToolOrchestration />
        </div>
      </section>

      {/* ═══════════════ Section 6: Response Latency Monitor ═══════════════ */}
      <section className="border-t border-border-subtle bg-bg-surface py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="mb-6 font-display text-xl font-bold text-text-primary lg:text-2xl"
            style={{ lineHeight: 1.3 }}
          >
            Cognitive Performance
          </motion.h2>

          <LatencyMonitor />
        </div>
      </section>

      {/* Bottom spacer */}
      <div className="h-8 bg-bg-deep" />
    </div>
  );
}
