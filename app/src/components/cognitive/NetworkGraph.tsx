import { useRef, useEffect, useCallback, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ZoomIn, ZoomOut, Target, Pause, Play } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  type: 'concept' | 'tool' | 'llm';
  layer?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  description: string;
  alpha: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

const LAYER_COLORS = ['#F43F5E', '#F59E0B', '#8B5CF6', '#10B981'];

const TOOL_NAMES: string[][] = [
  ['LAMMPS', 'QE', 'OpenFOAM', 'GADGET'],
  ['Bioconductor', 'NEURON', 'NetLogo', 'Stan'],
  ['QuantEcon', 'zTree', 'MALLET', 'VDem'],
  ['WRF', 'ROMS', 'FESOM', 'MGGG'],
];

const CONCEPT_NAMES = [
  'Molecular Dynamics', 'Buffer Overflow', 'Packet Flow', 'Force Field',
  'Quantum State', 'Tunneling', 'Superposition', 'Entanglement',
  'Fluid Sim', 'Vortex', 'Reynolds', 'Navier-Stokes',
  'N-body', 'Gravity', 'Dark Matter', 'Cosmology',
  'Genome', 'Mutation', 'Phylogeny', 'Sequence',
  'Neuron', 'Synapse', 'Action Potential', 'Cortex',
  'Agent Model', 'Emergence', 'Swarm', 'Autonomy',
  'Bayesian', 'MCMC', 'Posterior', 'Prior',
  'Game Theory', 'Nash', 'Auction', 'Equilibrium',
  'Experiment', 'Incentive', 'Risk Aversion', 'Utility',
  'NLP', 'Tokenization', 'Embedding', 'Topic Model',
  'Democracy', 'Polarization', 'Regime', 'Civil Society',
  'Gerrymandering', 'Voronoi', 'Compactness', 'Redistrict',
  'Weather', 'Climate', 'Ocean Current', 'Temperature',
  'Mesh', 'Simulation', 'Forecast', 'Predictive',
  'Security', 'Exploit', 'Payload', 'Shellcode',
  'DDoS', 'Botnet', 'C2 Server', 'Lateral Movement',
  'Phishing', 'Social Eng', 'Spear Phish', 'Credential',
  'APT', 'Persistence', 'Exfiltration', 'Reconnaissance',
];

function generateNodes(w: number, h: number): GraphNode[] {
  const nodes: GraphNode[] = [];

  // LLM hub node at center
  nodes.push({
    id: 'llm-hub',
    label: 'LLM Hub',
    type: 'llm',
    x: w / 2,
    y: h / 2,
    vx: 0,
    vy: 0,
    radius: 16,
    color: '#8B5CF6',
    description: 'Central LLM executive orchestrating all security layers and tool activations.',
    alpha: 0,
  });

  // Tool nodes (16 total, 4 per layer)
  for (let layer = 0; layer < 4; layer++) {
    for (let i = 0; i < 4; i++) {
      const angle = (layer * Math.PI) / 2 + (i - 1.5) * 0.3;
      const dist = 120 + Math.random() * 40;
      nodes.push({
        id: `tool-${layer}-${i}`,
        label: TOOL_NAMES[layer][i],
        type: 'tool',
        layer,
        x: w / 2 + Math.cos(angle) * dist,
        y: h / 2 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 10,
        color: LAYER_COLORS[layer],
        description: `${TOOL_NAMES[layer][i]} — ${['Physical & Molecular', 'Genomics & Neuroscience', 'Political Science & Economics', 'Meteorology & Oceanography'][layer]} layer tool.`,
        alpha: 0,
      });
    }
  }

  // Concept nodes (remaining to reach ~80)
  for (let i = 0; i < CONCEPT_NAMES.length; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 160 + Math.random() * 120;
    const layer = Math.floor(Math.random() * 4);
    nodes.push({
      id: `concept-${i}`,
      label: CONCEPT_NAMES[i],
      type: 'concept',
      layer,
      x: w / 2 + Math.cos(angle) * dist,
      y: h / 2 + Math.sin(angle) * dist,
      vx: 0,
      vy: 0,
      radius: 7,
      color: '#94A3B8',
      description: `Security concept related to ${CONCEPT_NAMES[i].toLowerCase()} analysis and detection.`,
      alpha: 0,
    });
  }

  return nodes;
}

function generateEdges(nodes: GraphNode[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const added = new Set<string>();

  // Connect LLM hub to all tool nodes
  for (const node of nodes) {
    if (node.type === 'tool') {
      edges.push({ source: 'llm-hub', target: node.id });
      added.add(`llm-hub-${node.id}`);
    }
  }

  // Connect each tool to nearby concepts
  for (const tool of nodes) {
    if (tool.type !== 'tool') continue;
    const nearby = nodes
      .filter((n) => n.type === 'concept')
      .map((n) => ({
        node: n,
        dist: Math.hypot(n.x - tool.x, n.y - tool.y),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 4);
    for (const { node: concept } of nearby) {
      const key = `${tool.id}-${concept.id}`;
      if (!added.has(key)) {
        edges.push({ source: tool.id, target: concept.id });
        added.add(key);
      }
    }
  }

  // Connect some concepts to each other
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type !== 'concept') continue;
    for (let j = i + 1; j < nodes.length; j++) {
      if (nodes[j].type !== 'concept') continue;
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100 && Math.random() < 0.15) {
        const key = `${nodes[i].id}-${nodes[j].id}`;
        if (!added.has(key)) {
          edges.push({ source: nodes[i].id, target: nodes[j].id });
          added.add(key);
        }
      }
    }
  }

  return edges;
}

const NetworkGraph = memo(function NetworkGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const draggingRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const hoveredRef = useRef<string | null>(null);
  const rafRef = useRef<number>(0);
  const physicsActiveRef = useRef(true);
  const timeRef = useRef(0);
  const staggerTimeRef = useRef(0);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [physicsActive, setPhysicsActive] = useState(true);

  const initGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;
    nodesRef.current = generateNodes(w, h);
    edgesRef.current = generateEdges(nodesRef.current);
    staggerTimeRef.current = 0;
    timeRef.current = 0;
  }, []);

  const updatePhysics = useCallback(() => {
    if (!physicsActiveRef.current) return;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const centerX = (canvasRef.current?.width ?? 800) / 2;
    const centerY = (canvasRef.current?.height ?? 600) / 2;

    // Coulomb repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 2000 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        if (nodes[i].id !== draggingRef.current) {
          nodes[i].vx -= fx;
          nodes[i].vy -= fy;
        }
        if (nodes[j].id !== draggingRef.current) {
          nodes[j].vx += fx;
          nodes[j].vy += fy;
        }
      }
    }

    // Hooke attraction along edges
    for (const edge of edges) {
      const src = nodes.find((n) => n.id === edge.source);
      const tgt = nodes.find((n) => n.id === edge.target);
      if (!src || !tgt) continue;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = dist * 0.0003;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      if (src.id !== draggingRef.current) {
        src.vx += fx;
        src.vy += fy;
      }
      if (tgt.id !== draggingRef.current) {
        tgt.vx -= fx;
        tgt.vy -= fy;
      }
    }

    // Center gravity
    for (const node of nodes) {
      if (node.id === draggingRef.current) continue;
      node.vx += (centerX - node.x) * 0.00005;
      node.vy += (centerY - node.y) * 0.00005;
    }

    // Friction + integration
    for (const node of nodes) {
      if (node.id === draggingRef.current) continue;
      node.vx *= 0.92;
      node.vy *= 0.92;
      node.x += node.vx;
      node.y += node.vy;
    }
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cam = cameraRef.current;
    const nodes = nodesRef.current;
    const edges = edgesRef.current;
    const hovered = hoveredRef.current;
    const time = timeRef.current;

    // Stagger fade-in
    staggerTimeRef.current += 0.016;
    const allStaggered = staggerTimeRef.current > 0.8;
    if (!allStaggered) {
      for (let i = 0; i < nodes.length; i++) {
        const targetAlpha = Math.min(1, Math.max(0, (staggerTimeRef.current - i * 0.01) / 0.3));
        nodes[i].alpha = targetAlpha;
      }
    } else {
      for (const node of nodes) node.alpha = 1;
    }

    // Find hovered node
    const hoveredNode = nodes.find((n) => n.id === hovered);
    const connectedIds = new Set<string>();
    if (hoveredNode) {
      for (const e of edges) {
        if (e.source === hovered) connectedIds.add(e.target);
        if (e.target === hovered) connectedIds.add(e.source);
      }
    }

    ctx.save();
    ctx.translate(cam.x, cam.y);
    ctx.scale(cam.zoom, cam.zoom);

    // Draw edges
    for (const edge of edges) {
      const src = nodes.find((n) => n.id === edge.source);
      const tgt = nodes.find((n) => n.id === edge.target);
      if (!src || !tgt) continue;
      const isHighlighted =
        hovered && (edge.source === hovered || edge.target === hovered);

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = isHighlighted ? '#06B6D4' : 'rgba(30, 41, 59, 0.8)';
      ctx.lineWidth = isHighlighted ? 2 : 1;
      ctx.globalAlpha = src.alpha * tgt.alpha * (isHighlighted ? 1 : 0.5);
      ctx.stroke();

      // Flow particles on highlighted edges
      if (isHighlighted) {
        const progress = (time * 0.5) % 1;
        const px = src.x + (tgt.x - src.x) * progress;
        const py = src.y + (tgt.y - src.y) * progress;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#8B5CF6';
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Draw nodes
    for (const node of nodes) {
      if (node.alpha <= 0) continue;
      const isHovered = node.id === hovered;
      const isConnected = connectedIds.has(node.id);
      const scale = isHovered ? 1.5 : isConnected ? 1.2 : 1;
      const r = node.radius * scale;

      // Glow for hovered
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.globalAlpha = node.alpha;
      ctx.fillStyle = node.color;
      ctx.fill();

      // Border for tool and llm nodes
      if (node.type !== 'concept') {
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = node.alpha * 0.5;
        ctx.stroke();
      }

      // Label
      ctx.globalAlpha = node.alpha * (isHovered || isConnected ? 1 : 0.6);
      ctx.fillStyle = isHovered ? '#F1F5F9' : '#64748B';
      ctx.font = `400 ${isHovered ? 11 : 9}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.label, node.x, node.y + r + 6);
      ctx.globalAlpha = 1;
    }

    // LLM hub glow (pulsing)
    const llmNode = nodes.find((n) => n.id === 'llm-hub');
    if (llmNode) {
      const pulse = Math.sin(time * 2) * 0.1 + 0.2;
      ctx.beginPath();
      ctx.arc(llmNode.x, llmNode.y, llmNode.radius + 12, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139, 92, 246, ${pulse})`;
      ctx.fill();
    }

    ctx.restore();

    timeRef.current += 0.016;
    updatePhysics();
    rafRef.current = requestAnimationFrame(draw);
  }, [updatePhysics]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;
      initGraph();
    };

    resize();
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [initGraph, draw]);

  // Mouse handlers
  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const cam = cameraRef.current;
      return {
        x: (e.clientX - rect.left - cam.x) / cam.zoom,
        y: (e.clientY - rect.top - cam.y) / cam.zoom,
      };
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e);
      const nodes = nodesRef.current;
      for (const node of nodes) {
        const dx = pos.x - node.x;
        const dy = pos.y - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < node.radius + 4) {
          draggingRef.current = node.id;
          dragOffsetRef.current = { x: dx, y: dy };
          setSelectedNode(node);
          return;
        }
      }
      setSelectedNode(null);
    },
    [getCanvasPos]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getCanvasPos(e);
      if (draggingRef.current) {
        const node = nodesRef.current.find((n) => n.id === draggingRef.current);
        if (node) {
          node.x = pos.x - dragOffsetRef.current.x;
          node.y = pos.y - dragOffsetRef.current.y;
          node.vx = 0;
          node.vy = 0;
        }
        return;
      }
      // Hover detection
      const nodes = nodesRef.current;
      let found: string | null = null;
      for (const node of nodes) {
        const dx = pos.x - node.x;
        const dy = pos.y - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < node.radius + 4) {
          found = node.id;
          break;
        }
      }
      hoveredRef.current = found;
    },
    [getCanvasPos]
  );

  const handleMouseUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  const handleZoomIn = useCallback(() => {
    cameraRef.current.zoom = Math.min(cameraRef.current.zoom * 1.2, 3);
  }, []);

  const handleZoomOut = useCallback(() => {
    cameraRef.current.zoom = Math.max(cameraRef.current.zoom / 1.2, 0.3);
  }, []);

  const handleReset = useCallback(() => {
    cameraRef.current = { x: 0, y: 0, zoom: 1 };
    initGraph();
  }, [initGraph]);

  const togglePhysics = useCallback(() => {
    setPhysicsActive((prev) => {
      physicsActiveRef.current = !prev;
      return !prev;
    });
  }, []);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-lg border border-border-subtle bg-bg-void" style={{ height: 600 }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          cursor: draggingRef.current ? 'grabbing' : 'crosshair',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      {/* Controls */}
      <div className="absolute right-4 top-4 flex flex-col gap-2">
        {[
          { icon: ZoomIn, action: handleZoomIn, label: 'Zoom in' },
          { icon: ZoomOut, action: handleZoomOut, label: 'Zoom out' },
          { icon: Target, action: handleReset, label: 'Reset view' },
          { icon: physicsActive ? Pause : Play, action: togglePhysics, label: 'Toggle physics' },
        ].map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="flex h-7 w-7 items-center justify-center rounded-md bg-bg-surface text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            title={btn.label}
          >
            <btn.icon size={14} />
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 rounded-md bg-bg-surface/80 px-3 py-2 backdrop-blur-sm">
        {[
          { color: '#F43F5E', label: 'Layer 1' },
          { color: '#F59E0B', label: 'Layer 2' },
          { color: '#8B5CF6', label: 'Layer 3' },
          { color: '#10B981', label: 'Layer 4' },
          { color: '#94A3B8', label: 'Concept' },
          { color: '#8B5CF6', size: 10, label: 'LLM Hub' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span
              className="inline-block rounded-full"
              style={{
                backgroundColor: item.color,
                width: item.size ?? 8,
                height: item.size ?? 8,
              }}
            />
            <span className="font-mono text-[10px] text-text-muted">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Node Info Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: 240, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 240, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 right-0 top-0 z-10 w-60 border-l border-border-subtle bg-bg-surface p-4"
          >
            <button
              onClick={() => setSelectedNode(null)}
              className="mb-3 text-[10px] text-text-muted hover:text-text-primary"
            >
              Close
            </button>
            <h4 className="font-mono text-sm font-semibold text-text-primary">
              {selectedNode.label}
            </h4>
            <p
              className="mt-1 font-mono text-[10px] uppercase tracking-wider"
              style={{
                color:
                  selectedNode.layer !== undefined
                    ? LAYER_COLORS[selectedNode.layer]
                    : selectedNode.type === 'llm'
                      ? '#8B5CF6'
                      : '#94A3B8',
              }}
            >
              {selectedNode.type === 'llm'
                ? 'LLM Hub'
                : selectedNode.type === 'tool'
                  ? `Layer ${(selectedNode.layer ?? 0) + 1} Tool`
                  : 'Concept'}
            </p>
            <p className="mt-3 text-xs leading-relaxed text-text-secondary">
              {selectedNode.description}
            </p>
            {/* Connected nodes */}
            <div className="mt-4">
              <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-text-muted">
                Connected
              </p>
              <div className="flex flex-wrap gap-1">
                {edgesRef.current
                  .filter(
                    (e) =>
                      e.source === selectedNode.id || e.target === selectedNode.id
                  )
                  .map((e) => {
                    const connectedId =
                      e.source === selectedNode.id ? e.target : e.source;
                    const connectedNode = nodesRef.current.find(
                      (n) => n.id === connectedId
                    );
                    if (!connectedNode) return null;
                    return (
                      <span
                        key={connectedId}
                        className="rounded px-1.5 py-0.5 font-mono text-[9px] text-text-secondary"
                        style={{
                          backgroundColor:
                            connectedNode.layer !== undefined
                              ? `${LAYER_COLORS[connectedNode.layer]}22`
                              : connectedNode.type === 'llm'
                                ? 'rgba(139,92,246,0.13)'
                                : 'rgba(148,163,184,0.13)',
                          color:
                            connectedNode.layer !== undefined
                              ? LAYER_COLORS[connectedNode.layer]
                              : connectedNode.type === 'llm'
                                ? '#8B5CF6'
                                : '#94A3B8',
                        }}
                      >
                        {connectedNode.label}
                      </span>
                    );
                  })}
              </div>
            </div>
            {selectedNode.type === 'tool' && (
              <button className="mt-4 w-full rounded-md bg-accent-violet-dim py-2 font-mono text-xs text-accent-violet transition-colors hover:bg-accent-violet hover:text-white">
                Run Simulation
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default NetworkGraph;
