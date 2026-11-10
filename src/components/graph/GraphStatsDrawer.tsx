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
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">Graph Analytics</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Core Metrics Cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> Total Nodes
            </div>
            <div className="text-2xl font-black text-white">{metrics.totalNodes}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Share2 className="w-3.5 h-3.5 text-purple-400" /> Total Edges
            </div>
            <div className="text-2xl font-black text-white">{metrics.totalEdges}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Density
            </div>
            <div className="text-2xl font-black text-white">{metrics.density}</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> Top Hub
            </div>
            <div className="text-xs font-bold text-amber-300 truncate" title={metrics.mostConnectedNode?.title}>
              {metrics.mostConnectedNode?.title || 'None'}
            </div>
            <span className="text-[10px] text-slate-400">
              {metrics.mostConnectedNode ? `${metrics.mostConnectedNode.connections} links` : ''}
            </span>
          </div>
        </div>

        {/* Node Taxonomy Distribution */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Node Taxonomy
          </h3>
          <div className="space-y-2">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300"
              >
                <span className="capitalize">{type}</span>
                <span className="font-bold text-slate-100 px-2 py-0.5 rounded-md bg-slate-800 text-[11px]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship Breakdown */}
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Relationship Types
          </h3>
          <div className="space-y-2">
            {Object.entries(relationCounts).map(([rel, count]) => (
              <div
                key={rel}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-300"
              >
                <span className="font-mono text-[11px] text-indigo-300">{rel}</span>
                <span className="font-bold text-slate-100 px-2 py-0.5 rounded-md bg-slate-800 text-[11px]">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-slate-800 text-center">
        <p className="text-[11px] text-slate-500">
          Synapse Real-time Graph Analytics Engine
        </p>
      </div>
    </div>
  );
}
