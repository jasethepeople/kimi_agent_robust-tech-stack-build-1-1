import { useState, useEffect, useRef, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Metric {
  label: string;
  value: string;
  numericValue: number;
  unit: string;
  data: number[];
  trend: number; // percentage
  improving: boolean; // true if lower is better and trend is down, or higher is better and trend is up
}

const DATA_POINTS = 20;

function generateInitialData(base: number, variance: number): number[] {
  return Array.from({ length: DATA_POINTS }, () =>
    Math.round(base + (Math.random() - 0.5) * variance)
  );
}

function sparklinePath(data: number[], width: number, height: number): string {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  return data
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');
}

function sparklineAreaPath(data: number[], width: number, height: number): string {
  const linePath = sparklinePath(data, width, height);
  const lastX = width;
  const firstX = 0;
  return `${linePath} L${lastX},${height} L${firstX},${height} Z`;
}

const LatencyMonitor = memo(function LatencyMonitor() {
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      label: 'Avg Response Time',
      value: '847',
      numericValue: 847,
      unit: 'ms',
      data: generateInitialData(847, 200),
      trend: -3.2,
      improving: true,
    },
    {
      label: 'Token Throughput',
      value: '2.4K',
      numericValue: 2400,
      unit: 'tok/s',
      data: generateInitialData(2400, 400),
      trend: 5.1,
      improving: true,
    },
    {
      label: 'Reasoning Accuracy',
      value: '94.2',
      numericValue: 94.2,
      unit: '%',
      data: generateInitialData(94, 3),
      trend: 0.8,
      improving: true,
    },
    {
      label: 'Tool Call Latency',
      value: '312',
      numericValue: 312,
      unit: 'ms',
      data: generateInitialData(312, 80),
      trend: -1.5,
      improving: true,
    },
  ]);

  const updateCountRef = useRef(0);

  const updateMetrics = useCallback(() => {
    updateCountRef.current += 1;
    setMetrics((prev) =>
      prev.map((m) => {
        let newValue: number;
        const variance = m.label === 'Reasoning Accuracy' ? 1.5 : m.label === 'Token Throughput' ? 150 : 40;
        newValue = Math.round(m.numericValue + (Math.random() - 0.5) * variance);
        if (m.label === 'Reasoning Accuracy') newValue = Math.min(99.9, Math.max(85, newValue));
        if (m.label === 'Token Throughput') newValue = Math.max(1500, newValue);
        if (m.label === 'Avg Response Time') newValue = Math.max(400, newValue);
        if (m.label === 'Tool Call Latency') newValue = Math.max(100, newValue);

        const newData = [...m.data.slice(1), newValue];
        const prevAvg = m.data.reduce((a, b) => a + b, 0) / m.data.length;
        const trend = ((newValue - prevAvg) / prevAvg) * 100;

        const isLowerBetter = m.label === 'Avg Response Time' || m.label === 'Tool Call Latency';
        const improving = isLowerBetter ? trend < 0 : trend > 0;

        let displayValue: string;
        if (m.label === 'Token Throughput') {
          displayValue = newValue >= 1000 ? `${(newValue / 1000).toFixed(1)}K` : `${newValue}`;
        } else {
          displayValue = `${newValue}`;
        }

        return {
          ...m,
          value: displayValue,
          numericValue: newValue,
          data: newData,
          trend: Math.abs(trend),
          improving,
        };
      })
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, [updateMetrics]);

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {metrics.map((metric, i) => (
        <motion.div
          key={metric.label}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ amount: 0.2 }}
          transition={{ duration: 0.3, delay: i * 0.06 }}
          className="rounded-lg border border-border-subtle bg-bg-deep p-4"
        >
          {/* Label */}
          <p className="mb-2 text-xs text-text-muted">{metric.label}</p>

          {/* Value */}
          <div className="mb-2 flex items-baseline gap-1">
            <span className="font-display text-2xl font-bold text-text-primary lg:text-[32px]">
              {metric.value}
            </span>
            <span className="text-xs text-text-muted">{metric.unit}</span>
          </div>

          {/* Sparkline */}
          <svg width={60} height={20} viewBox="0 0 60 20" className="mb-2">
            <defs>
              <linearGradient id={`spark-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d={sparklineAreaPath(metric.data, 60, 20)}
              fill={`url(#spark-grad-${i})`}
            />
            <path
              d={sparklinePath(metric.data, 60, 20)}
              fill="none"
              stroke="#8B5CF6"
              strokeWidth={1.5}
            />
          </svg>

          {/* Trend */}
          <div className="flex items-center gap-1">
            {metric.improving ? (
              <TrendingUp size={12} className="text-accent-emerald" />
            ) : (
              <TrendingDown size={12} className="text-accent-rose" />
            )}
            <span
              className="text-xs"
              style={{ color: metric.improving ? '#10B981' : '#F43F5E' }}
            >
              {metric.trend.toFixed(1)}%
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
});

export default LatencyMonitor;
