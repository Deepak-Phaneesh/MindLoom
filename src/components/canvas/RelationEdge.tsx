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
    stroke: '#f43f5e',
    badgeBg: 'bg-rose-950',
    badgeText: 'text-rose-200',
    badgeBorder: 'border-rose-500',
  },
  communicates_with: {
    stroke: '#f59e0b',
    badgeBg: 'bg-amber-950',
    badgeText: 'text-amber-200',
    badgeBorder: 'border-amber-500',
  },
  implements: {
    stroke: '#f97316',
    badgeBg: 'bg-orange-950',
    badgeText: 'text-orange-200',
    badgeBorder: 'border-orange-500',
  },
  subconcept_of: {
    stroke: '#10b981',
    badgeBg: 'bg-emerald-950',
    badgeText: 'text-emerald-200',
    badgeBorder: 'border-emerald-500',
  },
  stores_in: {
    stroke: '#0ea5e9',
    badgeBg: 'bg-sky-950',
    badgeText: 'text-sky-200',
    badgeBorder: 'border-sky-500',
  },
  relates_to: {
    stroke: '#94a3b8',
    badgeBg: 'bg-slate-900',
    badgeText: 'text-slate-200',
    badgeBorder: 'border-slate-600',
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
    stroke: isHighlighted ? '#f59e0b' : theme.stroke,
    strokeWidth: isHighlighted ? 3.5 : 2,
    opacity: isHighlighted ? 1 : 0.8,
    strokeDasharray: relation === 'communicates_with' ? '5,5' : undefined,
    filter: isHighlighted ? 'drop-shadow(0 0 8px rgba(245,158,11,0.8))' : undefined,
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
          className={`text-xs uppercase tracking-wider font-bold px-3 py-1 rounded-lg transition-all cursor-pointer select-none shadow-xl border ${
            isHighlighted
              ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.7)] scale-110'
              : `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} hover:scale-105`
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
