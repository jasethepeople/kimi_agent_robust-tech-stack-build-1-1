import { useRef, useEffect, memo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

const LAYERS = [
  {
    label: 'Layer 1',
    sublabel: 'Physical & Molecular',
    color: '#F43F5E',
    x: 0.5,
    y: 0.18,
    tools: ['LAMMPS', 'Quantum ESPRESSO', 'OpenFOAM', 'GADGET-4'],
  },
  {
    label: 'Layer 2',
    sublabel: 'Genomics & Neuroscience',
    color: '#F59E0B',
    x: 0.82,
    y: 0.5,
    tools: ['Bioconductor', 'NEURON', 'NetLogo', 'Stan'],
  },
  {
    label: 'Layer 3',
    sublabel: 'Political Science & Economics',
    color: '#8B5CF6',
    x: 0.5,
    y: 0.82,
    tools: ['QuantEcon', 'z-Tree', 'MALLET', 'VDem'],
  },
  {
    label: 'Layer 4',
    sublabel: 'Meteorology & Oceanography',
    color: '#10B981',
    x: 0.18,
    y: 0.5,
    tools: ['WRF-ARW', 'ROMS', 'FESOM', 'MGGG'],
  },
];

const SATELLITE_COUNT = 4;
const ORBIT_RADIUS = 28;

const ArchitectureCanvas = memo(function ArchitectureCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; layer: typeof LAYERS[0] } | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animTimeRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    animTimeRef.current += 0.016;
    const t = animTimeRef.current;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.5;

    // Draw connection lines
    for (let i = 0; i < LAYERS.length; i++) {
      const layer = LAYERS[i];
      const lx = layer.x * w;
      const ly = layer.y * h;
      const isHovered = hoveredLayer === i;

      // Gradient flowing line
      const grad = ctx.createLinearGradient(cx, cy, lx, ly);
      grad.addColorStop(0, '#8B5CF6');
      grad.addColorStop(1, layer.color);

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(lx, ly);
      ctx.strokeStyle = grad;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.stroke();

      // Animated pulse along line
      const pulsePos = (t * 0.67) % 1;
      const pulseX = cx + (lx - cx) * pulsePos;
      const pulseY = cy + (ly - cy) * pulsePos;
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, isHovered ? 5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = layer.color;
      ctx.globalAlpha = 0.6;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw satellite dots orbiting each layer node
    for (let i = 0; i < LAYERS.length; i++) {
      const layer = LAYERS[i];
      const lx = layer.x * w;
      const ly = layer.y * h;

      for (let s = 0; s < SATELLITE_COUNT; s++) {
        const angle = (t * Math.PI * 2) / 20 + (s * Math.PI * 2) / SATELLITE_COUNT;
        const sx = lx + Math.cos(angle) * ORBIT_RADIUS;
        const sy = ly + Math.sin(angle) * ORBIT_RADIUS;
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fillStyle = layer.color;
        ctx.globalAlpha = 0.5;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    // Draw center node (LLM Executive)
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = '#8B5CF6';
    ctx.fill();
    ctx.shadowColor = 'rgba(6, 182, 212, 0.3)';
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center glow
    ctx.beginPath();
    ctx.arc(cx, cy, 36, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(139, 92, 246, 0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#F1F5F9';
    ctx.font = '500 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LLM', cx, cy - 6);
    ctx.font = '400 9px "JetBrains Mono", monospace';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Executive', cx, cy + 6);

    // Draw layer nodes
    for (let i = 0; i < LAYERS.length; i++) {
      const layer = LAYERS[i];
      const lx = layer.x * w;
      const ly = layer.y * h;
      const isHovered = hoveredLayer === i;
      const r = isHovered ? 28 : 24;

      ctx.beginPath();
      ctx.arc(lx, ly, r, 0, Math.PI * 2);
      ctx.fillStyle = layer.color;
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.arc(lx, ly, r - 4, 0, Math.PI * 2);
      ctx.fillStyle = layer.color;
      ctx.globalAlpha = 0.8;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Label below node
      ctx.fillStyle = '#94A3B8';
      ctx.font = '400 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(layer.sublabel, lx, ly + r + 18);
    }

    rafRef.current = requestAnimationFrame(draw);
  }, [hoveredLayer]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [draw]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseRef.current = { x, y };

      const w = canvas.width;
      const h = canvas.height;

      let found: number | null = null;
      let tooltipData: typeof tooltip = null;

      for (let i = 0; i < LAYERS.length; i++) {
        const layer = LAYERS[i];
        const lx = layer.x * w;
        const ly = layer.y * h;
        const dx = x - lx;
        const dy = y - ly;
        if (Math.sqrt(dx * dx + dy * dy) < 36) {
          found = i;
          tooltipData = { x: e.clientX - rect.left, y: e.clientY - rect.top, layer };
          break;
        }
      }

      setHoveredLayer(found);
      setTooltip(tooltipData);
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredLayer(null);
    setTooltip(null);
  }, []);

  return (
    <div className="relative w-full" style={{ height: 340 }}>
      <motion.canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Tooltip */}
      {tooltip && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-none absolute z-20 rounded-md border border-border-subtle bg-bg-surface px-3 py-2 shadow-elevated"
          style={{
            left: tooltip.x + 20,
            top: tooltip.y - 10,
          }}
        >
          <p className="font-mono text-xs font-medium" style={{ color: tooltip.layer.color }}>
            {tooltip.layer.label} — {tooltip.layer.sublabel}
          </p>
          <p className="mt-1 font-mono text-[10px] text-text-muted">
            Tools: {tooltip.layer.tools.join(', ')}
          </p>
        </motion.div>
      )}
    </div>
  );
});

export default ArchitectureCanvas;
