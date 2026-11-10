'use client';

import React from 'react';
import { UserPresence } from '@/lib/graph/types';
import { 
  Network, 
  GitFork, 
  BarChart3, 
  Plus, 
  Sparkles, 
  Wifi, 
  WifiOff, 
  Layers, 
  RefreshCw 
} from 'lucide-react';

interface CanvasHeaderProps {
  roomName: string;
  presences: UserPresence[];
  isConnected: boolean;
  viewMode: 'canvas' | 'force';
  onToggleViewMode: () => void;
  onOpenPathFinder: () => void;
  onOpenStats: () => void;
  onAddNode: () => void;
  onAutoLayout: () => void;
  isAutoLayoutRunning?: boolean;
}

export function CanvasHeader({
  roomName,
  presences,
  isConnected,
  viewMode,
  onToggleViewMode,
  onOpenPathFinder,
  onOpenStats,
  onAddNode,
  onAutoLayout,
  isAutoLayoutRunning,
}: CanvasHeaderProps) {
  return (
    <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between gap-4 pointer-events-none">
      {/* Brand & Room Info */}
      <div className="pointer-events-auto flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-md shadow-indigo-500/20">
          <Network className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-white tracking-tight">Synapse Graph</h1>
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-400 border border-indigo-800">
              {roomName}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            {isConnected ? (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Wifi className="w-3 h-3 animate-pulse" /> Live Multiplayer
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <WifiOff className="w-3 h-3" /> Standalone Mode
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Center Actions: View Mode Switch & Multi-hop Traversal */}
      <div className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-800 shadow-2xl">
        <button
          onClick={onToggleViewMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            viewMode === 'canvas'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Freeform 2D Canvas space"
        >
          <Layers className="w-3.5 h-3.5" />
          Canvas Mode
        </button>

        <button
          onClick={onToggleViewMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            viewMode === 'force'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
          title="Physics-based Force Directed Graph layout"
        >
          <Network className="w-3.5 h-3.5" />
          Force Graph
        </button>

        <div className="w-[1px] h-5 bg-slate-800 mx-1" />

        <button
          onClick={onAutoLayout}
          disabled={isAutoLayoutRunning}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
          title="Arrange nodes using d3-force simulation"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAutoLayoutRunning ? 'animate-spin text-indigo-400' : ''}`} />
          Auto Layout
        </button>

        <button
          onClick={onOpenPathFinder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-all shadow-sm"
        >
          <GitFork className="w-3.5 h-3.5 text-amber-400" />
          Multi-Hop Query
        </button>

        <button
          onClick={onOpenStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
        >
          <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
          Graph Analytics
        </button>
      </div>

      {/* Right Actions: Avatars & Add Node */}
      <div className="pointer-events-auto flex items-center gap-3">
        {/* Presence Avatars */}
        {presences.length > 0 && (
          <div className="flex items-center -space-x-2 bg-slate-900/90 backdrop-blur-md px-2.5 py-1.5 rounded-2xl border border-slate-800 shadow-xl">
            {presences.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900 shadow-sm"
                style={{ backgroundColor: p.color || '#6366f1' }}
                title={`${p.name} (Online)`}
              >
                {p.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {presences.length > 4 && (
              <div className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-300">
                +{presences.length - 4}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onAddNode}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </button>
      </div>
    </header>
  );
}
