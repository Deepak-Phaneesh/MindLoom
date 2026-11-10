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

const relationColors: Record<RelationType, { stroke: string; bg: string; text: string }> = {
  depends_on: { stroke: '#ef4444', bg: 'bg-red-950/80', text: 'text-red-300' },
  communicates_with: { stroke: '#8b5cf6', bg: 'bg-purple-950/80', text: 'text-purple-300' },
  implements: { stroke: '#3b82f6', bg: 'bg-blue-950/80', text: 'text-blue-300' },
  subconcept_of: { stroke: '#ec4899', bg: 'bg-pink-950/80', text: 'text-pink-300' },
  stores_in: { stroke: '#06b6d4', bg: 'bg-cyan-950/80', text: 'text-cyan-300' },
  relates_to: { stroke: '#64748b', bg: 'bg-slate-800/80', text: 'text-slate-300' },
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
  const colorConfig = relationColors[relation] || relationColors.relates_to;
  const label = data?.label || relation.replace('_', ' ');

  const edgeStyle = {
    ...style,
    stroke: isHighlighted ? '#f59e0b' : colorConfig.stroke,
    strokeWidth: isHighlighted ? 3.5 : 2,
    opacity: isHighlighted ? 1 : 0.75,
    strokeDasharray: relation === 'communicates_with' ? '5,5' : undefined,
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
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide border shadow-md transition-all cursor-pointer select-none backdrop-blur-md ${
            isHighlighted
              ? 'bg-amber-500 text-slate-950 border-amber-300 scale-110 font-bold ring-2 ring-amber-400/50'
              : `${colorConfig.bg} ${colorConfig.text} border-slate-700/60 hover:scale-105`
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
