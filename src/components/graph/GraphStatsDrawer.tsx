'use client';

import React from 'react';
import { Node, Edge } from '@xyflow/react';
import { CanvasNodeData, CanvasEdgeData } from '@/lib/graph/types';
import { GraphTraversalEngine } from '@/lib/graph/traversal';
import { 
  BarChart3, 
  X, 
  Activity, 
  Share2, 
  Zap, 
  Layers 
} from 'lucide-react';

interface GraphStatsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node<CanvasNodeData>[];
  edges: Edge<CanvasEdgeData>[];
}

export function GraphStatsDrawer({ isOpen, onClose, nodes, edges }: GraphStatsDrawerProps) {
  if (!isOpen) return null;

  const engine = new GraphTraversalEngine(nodes, edges);
  const metrics = engine.computeMetrics();

  // Count node types
  const typeCounts: Record<string, number> = {};
  nodes.forEach((n) => {
    const t = n.data?.nodeType || 'concept';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  // Count edge relations
  const relationCounts: Record<string, number> = {};
  edges.forEach((e) => {
    const r = e.data?.relation || 'relates_to';
    relationCounts[r] = (relationCounts[r] || 0) + 1;
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-obsidian-900 border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.9)] p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-champagne" />
            <h2 className="font-mono text-xs font-bold tracking-[0.14em] uppercase text-[#f1ede6]">
              Graph Telemetry
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[#8c867a] hover:text-white hover:bg-obsidian-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Core Metrics Cards */}
        <div className="grid grid-cols-2 gap-2.5 mt-5">
          <div className="p-3 rounded-lg bg-obsidian-950 border border-white/[0.05]">
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#8c867a] mb-1">
              <Layers className="w-3 h-3 text-vermilion" /> Total Nodes
            </div>
            <div className="text-xl font-mono font-bold text-[#f1ede6]">{metrics.totalNodes}</div>
          </div>

          <div className="p-3 rounded-lg bg-obsidian-950 border border-white/[0.05]">
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#8c867a] mb-1">
              <Share2 className="w-3 h-3 text-azure-light" /> Total Edges
            </div>
            <div className="text-xl font-mono font-bold text-[#f1ede6]">{metrics.totalEdges}</div>
          </div>

          <div className="p-3 rounded-lg bg-obsidian-950 border border-white/[0.05]">
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#8c867a] mb-1">
              <Activity className="w-3 h-3 text-sage" /> Graph Density
            </div>
            <div className="text-xl font-mono font-bold text-[#f1ede6]">{metrics.density}</div>
          </div>

          <div className="p-3 rounded-lg bg-obsidian-950 border border-white/[0.05]">
            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#8c867a] mb-1">
              <Zap className="w-3 h-3 text-champagne" /> Key Hub
            </div>
            <div className="text-xs font-mono font-bold text-champagne truncate" title={metrics.mostConnectedNode?.title}>
              {metrics.mostConnectedNode?.title || 'None'}
            </div>
            <span className="font-mono text-[9px] text-[#7a746a]">
              {metrics.mostConnectedNode ? `${metrics.mostConnectedNode.connections} links` : ''}
            </span>
          </div>
        </div>

        {/* Node Taxonomy Distribution */}
        <div className="mt-6">
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8c867a] mb-2.5">
            Node Classification
          </h3>
          <div className="space-y-1.5">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center justify-between p-2 rounded-lg bg-obsidian-950/70 border border-white/[0.04] text-xs font-mono text-[#d8d2c6]"
              >
                <span className="capitalize">{type}</span>
                <span className="font-mono text-[10px] font-bold text-champagne px-1.5 py-0.2 rounded bg-obsidian-800">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship Breakdown */}
        <div className="mt-6">
          <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#8c867a] mb-2.5">
            Edge Topology
          </h3>
          <div className="space-y-1.5">
            {Object.entries(relationCounts).map(([rel, count]) => (
              <div
                key={rel}
                className="flex items-center justify-between p-2 rounded-lg bg-obsidian-950/70 border border-white/[0.04] text-xs font-mono text-[#d8d2c6]"
              >
                <span className="text-[#a6a094]">{rel}</span>
                <span className="font-mono text-[10px] font-bold text-champagne px-1.5 py-0.2 rounded bg-obsidian-800">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/[0.06] text-center">
        <p className="font-mono text-[9px] uppercase tracking-wider text-[#5f5a52]">
          SYNAPSE TOPOLOGY MONITOR // V1.0
        </p>
      </div>
    </div>
  );
}
