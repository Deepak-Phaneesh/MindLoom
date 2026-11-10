'use client';

import React, { useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { CanvasNodeData, CanvasEdgeData, TraversalResult } from '@/lib/graph/types';
import { GraphTraversalEngine } from '@/lib/graph/traversal';
import { 
  GitFork, 
  X, 
  ArrowRight, 
  Sparkles, 
  Compass, 
  CheckCircle2, 
  AlertCircle 
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
      
      // Collect intermediate edge IDs
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Multi-Hop Path Finder
              </h2>
              <p className="text-xs text-slate-400">
                Traverse complex relationships between any two knowledge nodes
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Node Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Starting Node (Source)
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.title} ({node.data.nodeType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Destination Node (Target)
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
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
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowUndirected}
                onChange={(e) => setAllowUndirected(e.target.checked)}
                className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500/50"
              />
              Allow bidirectional / undirected path exploration
            </label>

            <button
              onClick={handleSearch}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
            >
              <GitFork className="w-3.5 h-3.5" />
              Discover Path
            </button>
          </div>

          {/* Result Section */}
          {result && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              {result.found ? (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      Discovered shortest path with <strong>{result.totalHops} hop{result.totalHops === 1 ? '' : 's'}</strong>! Highlights are active on your canvas.
                    </span>
                  </div>

                  {/* Hop by Hop Journey */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Step-by-Step Relationship Chain
                    </h4>
                    <div className="space-y-2">
                      {result.path.map((hop, index) => (
                        <div
                          key={hop.nodeId}
                          className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs text-slate-200"
                        >
                          <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-100 truncate">
                                {hop.nodeTitle}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 uppercase">
                                {hop.nodeType}
                              </span>
                            </div>
                            {hop.edgeLabel && (
                              <p className="text-[11px] text-amber-400/90 mt-0.5 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3 inline" />
                                {hop.edgeLabel}
                                {hop.explanation ? ` — ${hop.explanation}` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary / Narrative */}
                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Semantic Narrative
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono">
                      {result.summary}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
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
