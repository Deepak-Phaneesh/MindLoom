'use client';

import React from 'react';
import { UserPresence } from '@/lib/graph/types';
import { MousePointer2 } from 'lucide-react';

interface RemoteCursorsProps {
  presences: UserPresence[];
  currentUserId: string;
}

export function RemoteCursors({ presences, currentUserId }: RemoteCursorsProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {presences
        .filter((p) => p.id !== currentUserId && p.cursor)
        .map((peer) => {
          const { x, y } = peer.cursor!;
          return (
            <div
              key={peer.id}
              className="absolute transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <MousePointer2
                className="w-4 h-4"
                style={{
                  color: peer.color || '#6366f1',
                  fill: peer.color || '#6366f1',
                }}
              />
              <span
                className="absolute left-3 top-2 px-1.5 py-0.5 rounded text-[11px] font-medium text-white shadow-md whitespace-nowrap"
                style={{ backgroundColor: peer.color || '#6366f1' }}
              >
                {peer.name}
              </span>
            </div>
          );
        })}
    </div>
  );
}
