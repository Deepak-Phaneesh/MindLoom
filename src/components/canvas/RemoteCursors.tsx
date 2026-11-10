'use client';

import React from 'react';
import { UserPresence } from '@/lib/graph/types';
import { Navigation } from 'lucide-react';

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
          const accentColor = peer.color || '#e8c88c';

          return (
            <div
              key={peer.id}
              className="absolute transition-transform duration-75 ease-out select-none"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              <Navigation
                className="w-3.5 h-3.5 -rotate-45"
                style={{
                  color: accentColor,
                  fill: accentColor,
                  filter: `drop-shadow(0 0 6px ${accentColor}88)`,
                }}
              />
              <div
                className="absolute left-3.5 top-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold text-obsidian-950 uppercase tracking-wider shadow-lg flex items-center gap-1 border border-white/20 whitespace-nowrap"
                style={{ backgroundColor: accentColor }}
              >
                <span className="w-1 h-1 rounded-full bg-obsidian-950" />
                {peer.name}
              </div>
            </div>
          );
        })}
    </div>
  );
}
