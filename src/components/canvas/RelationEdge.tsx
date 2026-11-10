'use client';

import React, { memo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  Edge,
} from '@xyflow/react';
import { CanvasEdgeData, RelationType } from '@/lib/graph/types';

const relationThemes: Record<RelationType, {
  stroke: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}> = {
  depends_on: {
    stroke: '#e65440',
    badgeBg: 'bg-[#1e1312]',
    badgeText: 'text-[#ff9282]',
    badgeBorder: 'border-[#e65440]/30',
  },
  communicates_with: {
    stroke: '#e8c88c',
    badgeBg: 'bg-[#1b1710]',
    badgeText: 'text-champagne',
    badgeBorder: 'border-champagne/30',
  },
  implements: {
    stroke: '#c67d5a',
    badgeBg: 'bg-[#1c1410]',
    badgeText: 'text-copper-light',
    badgeBorder: 'border-copper/30',
  },
  subconcept_of: {
    stroke: '#529471',
    badgeBg: 'bg-[#111914]',
    badgeText: 'text-sage-light',
    badgeBorder: 'border-sage/30',
  },
  stores_in: {
    stroke: '#3e829a',
    badgeBg: 'bg-[#0f191e]',
    badgeText: 'text-azure-light',
    badgeBorder: 'border-azure/30',
  },
  relates_to: {
    stroke: '#6a655d',
    badgeBg: 'bg-[#15161a]',
    badgeText: 'text-[#b0aaa0]',
    badgeBorder: 'border-white/[0.08]',
  },
};

function RelationEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<Edge<CanvasEdgeData>>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isHighlighted = data?.highlighted;
  const relation = data?.relation || 'relates_to';
  const theme = relationThemes[relation] || relationThemes.relates_to;
  const label = data?.label || relation.replace('_', ' ');

  const edgeStyle = {
    ...style,
    stroke: isHighlighted ? '#e8c88c' : theme.stroke,
    strokeWidth: isHighlighted ? 2.8 : 1.4,
    opacity: isHighlighted ? 1 : 0.65,
    strokeDasharray: relation === 'communicates_with' ? '4,4' : undefined,
    filter: isHighlighted ? 'drop-shadow(0 0 6px rgba(232,200,140,0.6))' : undefined,
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={edgeStyle} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className={`font-mono text-[9px] uppercase tracking-[0.14em] px-2 py-0.5 rounded transition-all cursor-pointer select-none backdrop-blur-md border ${
            isHighlighted
              ? 'bg-champagne text-obsidian-950 border-champagne font-bold shadow-[0_0_16px_rgba(232,200,140,0.6)] scale-110'
              : `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} hover:scale-105 hover:border-champagne/40`
          }`}
          title={data?.explanation || label}
        >
          {label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const RelationEdge = memo(RelationEdgeComponent);
