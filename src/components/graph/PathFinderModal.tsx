'use client';

import React, { useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { CanvasNodeData, CanvasEdgeData, TraversalResult } from '@/lib/graph/types';
import { GraphTraversalEngine } from '@/lib/graph/traversal';
import { 
  GitFork, 
  X, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  CornerDownRight
} from 'lucide-react';

interface PathFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: Node<CanvasNodeData>[];
  edges: Edge<CanvasEdgeData>[];
  onHighlightPath: (nodeIds: string[], edgeIds: string[]) => void;
  onClearHighlight: () => void;
}

export function PathFinderModal({
  isOpen,
  onClose,
  nodes,
  edges,
  onHighlightPath,
  onClearHighlight,
}: PathFinderModalProps) {
  const [sourceId, setSourceId] = useState<string>(nodes[0]?.id || '');
  const [targetId, setTargetId] = useState<string>(nodes[nodes.length - 1]?.id || '');
  const [allowUndirected, setAllowUndirected] = useState(true);
  const [result, setResult] = useState<TraversalResult | null>(null);

  if (!isOpen) return null;

  const handleSearch = () => {
    if (!sourceId || !targetId) return;

    const engine = new GraphTraversalEngine(nodes, edges);
    const traversal = engine.findShortestPath(sourceId, targetId, allowUndirected);
    setResult(traversal);

    if (traversal.found && traversal.path.length > 0) {
      const pathNodeIds = traversal.path.map((p) => p.nodeId);
      
      const pathEdgeIds: string[] = [];
      for (let i = 0; i < pathNodeIds.length - 1; i++) {
        const u = pathNodeIds[i];
        const v = pathNodeIds[i + 1];
        const matchingEdge = edges.find(
          (e) => (e.source === u && e.target === v) || (allowUndirected && e.source === v && e.target === u)
        );
        if (matchingEdge) {
          pathEdgeIds.push(matchingEdge.id);
        }
      }

      onHighlightPath(pathNodeIds, pathEdgeIds);
    } else {
      onClearHighlight();
    }
  };

  const handleReset = () => {
    setResult(null);
    onClearHighlight();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-xl rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        style={{ backgroundColor: '#0f131a' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0a0d13]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <GitFork className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Multi-Hop Path Explorer
              </h2>
              <p className="text-xs text-slate-400">
                Discover relationship paths and intermediate bridging nodes
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Node Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Starting Node (Origin)
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                style={{ backgroundColor: '#141822', color: '#ffffff' }}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 text-sm font-semibold text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              >
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.title} ({node.data.nodeType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Target Node (Destination)
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                style={{ backgroundColor: '#141822', color: '#ffffff' }}
                className="w-full px-4 py-3 rounded-xl border border-slate-700 text-sm font-semibold text-white focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              >
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.title} ({node.data.nodeType})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Options & Action */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowUndirected}
                onChange={(e) => setAllowUndirected(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-400"
              />
              Allow bidirectional / undirected path exploration
            </label>

            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider shadow-md transition-all hover:scale-105 active:scale-95"
            >
              Discover Path
            </button>
          </div>

          {/* Result Section */}
          {result && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
              {result.found ? (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      PATH DISCOVERED: <strong>{result.totalHops} HOP{result.totalHops === 1 ? '' : 'S'}</strong>! Visual highlights active on canvas.
                    </span>
                  </div>

                  {/* Step by Step Journey */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Traversal Chain
                    </h4>
                    <div className="space-y-2">
                      {result.path.map((hop, index) => (
                        <div
                          key={hop.nodeId}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[#141822] border border-slate-800 text-xs"
                        >
                          <span className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-bold text-amber-300 shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white truncate text-sm">
                                {hop.nodeTitle}
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase font-semibold">
                                {hop.nodeType}
                              </span>
                            </div>
                            {hop.edgeLabel && (
                              <p className="text-xs text-amber-400 font-mono mt-1 flex items-center gap-1.5 font-medium">
                                <CornerDownRight className="w-3.5 h-3.5 inline text-amber-400" />
                                {hop.edgeLabel}
                                {hop.explanation ? ` — ${hop.explanation}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Semantic Narrative */}
                  <div className="p-4 rounded-xl bg-[#141822] border border-slate-800">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1.5 uppercase tracking-wider">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Semantic Link Narrative
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-mono">
                      {result.summary}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{result.summary}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
