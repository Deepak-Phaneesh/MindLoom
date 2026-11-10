'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { CanvasNodeData, NodeType } from '@/lib/graph/types';
import { 
  Cpu, 
  HardDrive, 
  Boxes, 
  Terminal, 
  FileCode2, 
  Fingerprint, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

const typeTheme: Record<NodeType, {
  label: string;
  icon: React.ReactNode;
  accent: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}> = {
  service: {
    label: 'SVC',
    icon: <Cpu className="w-3 h-3 text-vermilion" />,
    accent: '#e65440',
    dotColor: 'bg-vermilion',
    badgeBg: 'bg-vermilion/10',
    badgeText: 'text-vermilion-light',
    badgeBorder: 'border-vermilion/30',
  },
  database: {
    label: 'DATA',
    icon: <HardDrive className="w-3 h-3 text-azure" />,
    accent: '#3e829a',
    dotColor: 'bg-azure',
    badgeBg: 'bg-azure/10',
    badgeText: 'text-azure-light',
    badgeBorder: 'border-azure/30',
  },
  concept: {
    label: 'CORE',
    icon: <Boxes className="w-3 h-3 text-champagne" />,
    accent: '#e8c88c',
    dotColor: 'bg-champagne',
    badgeBg: 'bg-champagne/10',
    badgeText: 'text-champagne',
    badgeBorder: 'border-champagne/30',
  },
  api: {
    label: 'API',
    icon: <Terminal className="w-3 h-3 text-copper" />,
    accent: '#c67d5a',
    dotColor: 'bg-copper',
    badgeBg: 'bg-copper/10',
    badgeText: 'text-copper-light',
    badgeBorder: 'border-copper/30',
  },
  note: {
    label: 'NOTE',
    icon: <FileCode2 className="w-3 h-3 text-sage" />,
    accent: '#529471',
    dotColor: 'bg-sage',
    badgeBg: 'bg-sage/10',
    badgeText: 'text-sage-light',
    badgeBorder: 'border-sage/30',
  },
  person: {
    label: 'AUTH',
    icon: <Fingerprint className="w-3 h-3 text-champagne-300" />,
    accent: '#edd19c',
    dotColor: 'bg-champagne-300',
    badgeBg: 'bg-champagne/10',
    badgeText: 'text-champagne-200',
    badgeBorder: 'border-champagne/30',
  },
};

function KnowledgeNodeComponent({ data, selected }: NodeProps<Node<CanvasNodeData>>) {
  const isHighlighted = data.highlighted;
  const nodeType = data.nodeType || 'concept';
  const theme = typeTheme[nodeType] || typeTheme.concept;

  return (
    <div
      className={`group relative min-w-[270px] max-w-[320px] rounded-lg transition-all duration-200 cursor-pointer select-none ${
        isHighlighted
          ? 'bg-obsidian-850 ring-2 ring-champagne shadow-[0_0_30px_rgba(232,200,140,0.35)] scale-[1.03]'
          : selected
          ? 'bg-obsidian-850 ring-1.5 ring-champagne/80 shadow-[0_8px_24px_rgba(0,0,0,0.8)]'
          : 'bg-obsidian-900/95 hover:bg-obsidian-850 shadow-[0_6px_20px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.7)]'
      }`}
      style={{
        border: isHighlighted
          ? '1px solid rgba(232, 200, 140, 0.8)'
          : selected
          ? '1px solid rgba(232, 200, 140, 0.5)'
          : '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Top Hairline Accent Strip */}
      <div
        className="h-[2px] w-full rounded-t-lg transition-opacity"
        style={{
          background: isHighlighted
            ? 'linear-gradient(90deg, #e8c88c, #f6e6c4, #e8c88c)'
            : `linear-gradient(90deg, ${theme.accent}66, ${theme.accent}22)`,
        }}
      />

      {/* Connection Handles (Tactile Square Micro-Sockets) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-obsidian-900 !border !border-champagne hover:!scale-150 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-obsidian-900 !border !border-champagne hover:!scale-150 transition-transform"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !bg-obsidian-900 !border !border-champagne hover:!scale-150 transition-transform"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !bg-obsidian-900 !border !border-champagne hover:!scale-150 transition-transform"
      />

      <div className="p-3.5">
        {/* Module Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor} ${isHighlighted ? 'animate-ping' : ''}`} />
            <span
              className={`font-mono text-[9px] font-semibold tracking-[0.14em] uppercase px-1.5 py-0.5 rounded border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
            >
              {theme.label} // {nodeType}
            </span>
          </div>

          <div className="flex items-center text-obsidian-500 group-hover:text-champagne transition-colors">
            <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-semibold text-[#f1ede6] leading-snug tracking-tight mb-1.5 group-hover:text-champagne transition-colors">
          {data.title || 'Untitled Node'}
        </h3>

        {/* Content Snippet */}
        {data.content && (
          <p className="text-[11px] text-[#9b958c] line-clamp-2 leading-relaxed font-sans mb-3">
            {data.content}
          </p>
        )}

        {/* Extracted Entities Tag Matrix */}
        {data.entities && data.entities.length > 0 && (
          <div className="mt-2 pt-2 border-t border-white/[0.06] flex flex-wrap gap-1 items-center">
            <span className="font-mono text-[9px] tracking-wider text-champagne/80 font-medium flex items-center gap-1 mr-0.5">
              <Sparkles className="w-2.5 h-2.5 text-champagne" />
              ENTITIES:
            </span>
            {data.entities.slice(0, 3).map((entity, i) => (
              <span
                key={i}
                className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-obsidian-800 text-[#d8d2c6] border border-white/[0.08]"
              >
                {entity.name}
              </span>
            ))}
            {data.entities.length > 3 && (
              <span className="font-mono text-[9px] text-[#7a746a]">+{data.entities.length - 3}</span>
            )}
          </div>
        )}

        {/* Tags Micro-Rack */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2.5">
            {data.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-obsidian-800/80 text-[#8c867a] border border-white/[0.04]"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Technical Status Bar */}
      <div className="px-3.5 py-1.5 bg-obsidian-950/60 rounded-b-lg border-t border-white/[0.04] flex items-center justify-between text-[9px] font-mono text-[#6c675e]">
        <span>STATUS // LIVE</span>
        <span className="tracking-wider">{isHighlighted ? 'HOPS // ACTIVE' : 'SYNCED'}</span>
      </div>
    </div>
  );
}

export const KnowledgeNode = memo(KnowledgeNodeComponent);
