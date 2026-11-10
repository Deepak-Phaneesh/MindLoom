'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { CanvasNodeData, NodeType } from '@/lib/graph/types';
import { 
  Server, 
  Database, 
  BrainCircuit, 
  Webhook, 
  FileText, 
  User, 
  Sparkles,
  ExternalLink
} from 'lucide-react';

const typeIcons: Record<NodeType, React.ReactNode> = {
  service: <Server className="w-3.5 h-3.5 text-indigo-400" />,
  database: <Database className="w-3.5 h-3.5 text-cyan-400" />,
  concept: <BrainCircuit className="w-3.5 h-3.5 text-pink-400" />,
  api: <Webhook className="w-3.5 h-3.5 text-amber-400" />,
  note: <FileText className="w-3.5 h-3.5 text-emerald-400" />,
  person: <User className="w-3.5 h-3.5 text-purple-400" />,
};

const typeBadges: Record<NodeType, { bg: string; text: string; border: string }> = {
  service: { bg: 'bg-indigo-950/70', text: 'text-indigo-300', border: 'border-indigo-700/50' },
  database: { bg: 'bg-cyan-950/70', text: 'text-cyan-300', border: 'border-cyan-700/50' },
  concept: { bg: 'bg-pink-950/70', text: 'text-pink-300', border: 'border-pink-700/50' },
  api: { bg: 'bg-amber-950/70', text: 'text-amber-300', border: 'border-amber-700/50' },
  note: { bg: 'bg-emerald-950/70', text: 'text-emerald-300', border: 'border-emerald-700/50' },
  person: { bg: 'bg-purple-950/70', text: 'text-purple-300', border: 'border-purple-700/50' },
};

function KnowledgeNodeComponent({ data, selected }: NodeProps<Node<CanvasNodeData>>) {
  const isHighlighted = data.highlighted;
  const nodeType = data.nodeType || 'concept';
  const badge = typeBadges[nodeType] || typeBadges.concept;

  return (
    <div
      className={`relative min-w-[260px] max-w-[320px] rounded-xl backdrop-blur-md p-4 transition-all duration-200 shadow-xl ${
        isHighlighted
          ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-105 border-amber-400 bg-slate-900/95'
          : selected
          ? 'ring-2 ring-indigo-500 border-indigo-400/80 bg-slate-900/90'
          : 'border border-slate-700/60 bg-slate-900/85 hover:border-slate-500/80'
      }`}
    >
      {/* React Flow Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-2.5 h-2.5 !bg-indigo-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2.5 h-2.5 !bg-indigo-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="w-2.5 h-2.5 !bg-indigo-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="w-2.5 h-2.5 !bg-indigo-400 !border-2 !border-slate-900 transition-transform hover:scale-125"
      />

      {/* Header with Type Badge and Icons */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border uppercase tracking-wider ${badge.bg} ${badge.text} ${badge.border}`}
        >
          {typeIcons[nodeType]}
          {nodeType}
        </span>
        <div className="flex items-center gap-1 text-slate-400 hover:text-slate-200">
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </div>
      </div>

      {/* Node Title */}
      <h3 className="text-sm font-semibold text-slate-100 leading-snug tracking-tight mb-1.5">
        {data.title || 'Untitled Node'}
      </h3>

      {/* Content Preview */}
      {data.content && (
        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-3">
          {data.content}
        </p>
      )}

      {/* Extracted Entity Tags */}
      {data.entities && data.entities.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
          <div className="flex items-center gap-1 text-[10px] text-amber-300 font-medium mr-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" /> AI:
          </div>
          {data.entities.slice(0, 3).map((entity, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
            >
              {entity.name}
            </span>
          ))}
          {data.entities.length > 3 && (
            <span className="text-[10px] px-1 text-slate-400">+{data.entities.length - 3}</span>
          )}
        </div>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {data.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/40 text-indigo-300/90 border border-indigo-900/40"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export const KnowledgeNode = memo(KnowledgeNodeComponent);
