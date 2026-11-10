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
  ArrowUpRight
} from 'lucide-react';

const typeTheme: Record<NodeType, {
  label: string;
  icon: React.ReactNode;
  bg: string;
  text: string;
  border: string;
  accent: string;
}> = {
  service: {
    label: 'SERVICE',
    icon: <Server className="w-3.5 h-3.5" />,
    bg: 'bg-rose-950/80',
    text: 'text-rose-200',
    border: 'border-rose-500/50',
    accent: '#f43f5e',
  },
  database: {
    label: 'DATABASE',
    icon: <Database className="w-3.5 h-3.5" />,
    bg: 'bg-sky-950/80',
    text: 'text-sky-200',
    border: 'border-sky-500/50',
    accent: '#0ea5e9',
  },
  concept: {
    label: 'CONCEPT',
    icon: <BrainCircuit className="w-3.5 h-3.5" />,
    bg: 'bg-amber-950/80',
    text: 'text-amber-200',
    border: 'border-amber-500/50',
    accent: '#f59e0b',
  },
  api: {
    label: 'API GATEWAY',
    icon: <Webhook className="w-3.5 h-3.5" />,
    bg: 'bg-orange-950/80',
    text: 'text-orange-200',
    border: 'border-orange-500/50',
    accent: '#f97316',
  },
  note: {
    label: 'NOTE',
    icon: <FileText className="w-3.5 h-3.5" />,
    bg: 'bg-emerald-950/80',
    text: 'text-emerald-200',
    border: 'border-emerald-500/50',
    accent: '#10b981',
  },
  person: {
    label: 'TEAM / AUTH',
    icon: <User className="w-3.5 h-3.5" />,
    bg: 'bg-violet-950/80',
    text: 'text-violet-200',
    border: 'border-violet-500/50',
    accent: '#8b5cf6',
  },
};

function KnowledgeNodeComponent({ data, selected }: NodeProps<Node<CanvasNodeData>>) {
  const isHighlighted = data.highlighted;
  const nodeType = data.nodeType || 'concept';
  const theme = typeTheme[nodeType] || typeTheme.concept;

  return (
    <div
      className={`relative min-w-[320px] max-w-[380px] rounded-2xl p-5 transition-all duration-200 cursor-pointer shadow-2xl ${
        isHighlighted
          ? 'bg-[#181d28] ring-4 ring-amber-400 ring-offset-2 ring-offset-[#090b10] border-amber-400 scale-[1.04]'
          : selected
          ? 'bg-[#151a24] ring-2 ring-amber-400 border-amber-400/80'
          : 'bg-[#121622]/95 hover:bg-[#161b29] border border-slate-700/80 hover:border-slate-500'
      }`}
    >
      {/* Top Accent Indicator */}
      <div
        className="absolute top-0 left-5 right-5 h-[3px] rounded-b-md"
        style={{
          backgroundColor: isHighlighted ? '#f59e0b' : theme.accent,
          boxShadow: `0 0 10px ${isHighlighted ? '#f59e0b' : theme.accent}`,
        }}
      />

      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#090b10] hover:!scale-150 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#090b10] hover:!scale-150 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#090b10] hover:!scale-150 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-3 !h-3 !bg-amber-400 !border-2 !border-[#090b10] hover:!scale-150 transition-transform"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3 pt-1">
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border uppercase tracking-wider ${theme.bg} ${theme.text} ${theme.border}`}
        >
          {theme.icon}
          {theme.label}
        </span>

        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
          <ArrowUpRight className="w-4 h-4 text-slate-400" />
        </span>
      </div>

      {/* Node Title */}
      <h3 className="text-base font-bold text-white leading-snug tracking-tight mb-2">
        {data.title || 'Untitled Node'}
      </h3>

      {/* Content */}
      {data.content && (
        <p className="text-sm text-slate-300 leading-relaxed line-clamp-3 mb-3.5">
          {data.content}
        </p>
      )}

      {/* Extracted Entities */}
      {data.entities && data.entities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/60 flex flex-wrap gap-1.5 items-center">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 mr-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            AI:
          </span>
          {data.entities.slice(0, 3).map((entity, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-1 rounded-md bg-[#1d2433] text-slate-100 font-medium border border-slate-700"
            >
              {entity.name}
            </span>
          ))}
          {data.entities.length > 3 && (
            <span className="text-xs font-semibold text-slate-400">+{data.entities.length - 3}</span>
          )}
        </div>
      )}

      {/* Tags */}
      {data.tags && data.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {data.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium border border-slate-700/60"
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
