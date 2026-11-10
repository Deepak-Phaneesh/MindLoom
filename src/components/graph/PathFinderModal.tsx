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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-obsidian-900 border border-white/[0.08] rounded-xl shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] bg-obsidian-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-champagne/10 text-champagne border border-champagne/20">
              <GitFork className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold tracking-[0.14em] uppercase text-[#f1ede6]">
                Multi-Hop Path Explorer
              </h2>
              <p className="text-[11px] font-sans text-[#8c867a]">
                Query direct and intermediate connection chains across the graph
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1 rounded-md text-[#8c867a] hover:text-white hover:bg-obsidian-800 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Node Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8c867a] mb-1.5">
                Origin Node (A)
              </label>
              <select
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                className="w-full px-3 py-2 bg-obsidian-950 border border-white/[0.08] rounded-lg text-xs font-mono text-[#f1ede6] focus:outline-none focus:border-champagne/60"
              >
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.title} [{node.data.nodeType}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8c867a] mb-1.5">
                Target Node (B)
              </label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2 bg-obsidian-950 border border-white/[0.08] rounded-lg text-xs font-mono text-[#f1ede6] focus:outline-none focus:border-champagne/60"
              >
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data.title} [{node.data.nodeType}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Options & Action */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-[11px] font-sans text-[#a6a094] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowUndirected}
                onChange={(e) => setAllowUndirected(e.target.checked)}
                className="rounded border-white/10 bg-obsidian-950 text-champagne focus:ring-champagne/40"
              />
              Undirected / Bidirectional traversal
            </label>

            <button
              onClick={handleSearch}
              className="px-3.5 py-1.5 rounded-lg bg-champagne hover:bg-champagne-300 text-obsidian-950 font-mono text-[10px] font-bold tracking-wider uppercase transition-all shadow-[0_0_12px_rgba(232,200,140,0.2)]"
            >
              Discover Chain
            </button>
          </div>

          {/* Result Section */}
          {result && (
            <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
              {result.found ? (
                <>
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-sage/10 border border-sage/25 text-sage-light text-xs font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sage shrink-0" />
                    <span>
                      PATH DISCOVERED: <strong>{result.totalHops} HOP{result.totalHops === 1 ? '' : 'S'}</strong>. Visual highlights active on canvas.
                    </span>
                  </div>

                  {/* Step by Step Journey */}
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#8c867a]">
                      Traversal Sequence
                    </h4>
                    <div className="space-y-1.5">
                      {result.path.map((hop, index) => (
                        <div
                          key={hop.nodeId}
                          className="flex items-center gap-2.5 p-2 rounded-lg bg-obsidian-950 border border-white/[0.05] text-xs font-mono"
                        >
                          <span className="w-4 h-4 rounded bg-obsidian-800 flex items-center justify-center text-[9px] font-bold text-champagne shrink-0">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#f1ede6] truncate">
                                {hop.nodeTitle}
                              </span>
                              <span className="text-[9px] px-1 py-0.2 rounded bg-obsidian-800 text-[#8c867a] uppercase">
                                {hop.nodeType}
                              </span>
                            </div>
                            {hop.edgeLabel && (
                              <p className="text-[10px] text-champagne/90 mt-0.5 flex items-center gap-1 font-mono">
                                <CornerDownRight className="w-3 h-3 inline text-champagne" />
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
                  <div className="p-3 rounded-lg bg-obsidian-950 border border-white/[0.05]">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-champagne mb-1 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3 text-champagne" />
                      Semantic Link Narrative
                    </div>
                    <p className="text-xs text-[#d8d2c6] leading-relaxed font-mono">
                      {result.summary}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-copper/10 border border-copper/30 text-copper-light text-xs font-mono">
                  <AlertCircle className="w-3.5 h-3.5 text-copper shrink-0" />
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
