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

  const typeCounts: Record<string, number> = {};
  nodes.forEach((n) => {
    const t = n.data?.nodeType || 'concept';
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });

  const relationCounts: Record<string, number> = {};
  edges.forEach((e) => {
    const r = e.data?.relation || 'relates_to';
    relationCounts[r] = (relationCounts[r] || 0) + 1;
  });

  return (
    <div 
      className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l-2 border-slate-700 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
      style={{ backgroundColor: '#0f131a' }}
    >
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Graph Analytics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Metrics Cards */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-700">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              <Layers className="w-4 h-4 text-rose-400" /> Total Nodes
            </div>
            <div className="text-2xl font-black text-white">{metrics.totalNodes}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-700">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              <Share2 className="w-4 h-4 text-sky-400" /> Total Edges
            </div>
            <div className="text-2xl font-black text-white">{metrics.totalEdges}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-700">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              <Activity className="w-4 h-4 text-emerald-400" /> Density
            </div>
            <div className="text-2xl font-black text-white">{metrics.density}</div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#141822] border border-slate-700">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              <Zap className="w-4 h-4 text-amber-400" /> Top Hub
            </div>
            <div className="text-xs font-bold text-amber-300 truncate" title={metrics.mostConnectedNode?.title}>
              {metrics.mostConnectedNode?.title || 'None'}
            </div>
            <span className="text-[11px] text-slate-400 font-semibold">
              {metrics.mostConnectedNode ? `${metrics.mostConnectedNode.connections} links` : ''}
            </span>
          </div>
        </div>

        {/* Node Taxonomy Distribution */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Node Taxonomy Breakdown
          </h3>
          <div className="space-y-2">
            {Object.entries(typeCounts).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#141822] border border-slate-800 text-xs font-semibold text-slate-200"
              >
                <span className="capitalize">{type}</span>
                <span className="text-xs font-bold text-amber-300 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Relationship Breakdown */}
        <div className="mt-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Relationship Types
          </h3>
          <div className="space-y-2">
            {Object.entries(relationCounts).map(([rel, count]) => (
              <div
                key={rel}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#141822] border border-slate-800 text-xs font-semibold text-slate-200"
              >
                <span className="font-mono text-amber-200/90">{rel}</span>
                <span className="text-xs font-bold text-amber-300 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-800 text-center">
        <p className="text-xs text-slate-500 font-medium">
          MindLoom Real-Time Graph Engine
        </p>
      </div>
    </div>
  );
}
