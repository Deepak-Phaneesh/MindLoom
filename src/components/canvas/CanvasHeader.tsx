'use client';

import React from 'react';
import { UserPresence } from '@/lib/graph/types';
import { 
  GitFork, 
  BarChart3, 
  Plus, 
  Layers, 
  RefreshCw,
  Boxes
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
    <>
      {/* Top Header */}
      <header className="absolute top-4 left-5 right-5 z-40 flex items-center justify-between pointer-events-none">
        {/* Left: Studio Identity */}
        <div 
          className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl"
          style={{ backgroundColor: '#10141d' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <span className="text-sm font-extrabold tracking-wider uppercase text-white">
              SYNAPSE <span className="text-slate-400 font-semibold">// GRAPH STUDIO</span>
            </span>
          </div>

          <div className="w-[1px] h-4 bg-slate-700" />

          <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
            <span className="uppercase text-amber-300 font-bold tracking-wider">
              {roomName}
            </span>
            <span className="text-slate-600">/</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
                {isConnected ? 'LIVE MULTIPLAYER' : 'STANDALONE'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Presence Roster & Add Note */}
        <div className="pointer-events-auto flex items-center gap-3">
          {presences.length > 0 && (
            <div 
              className="flex items-center -space-x-2 px-3 py-1.5 rounded-xl border border-slate-700 shadow-xl"
              style={{ backgroundColor: '#10141d' }}
            >
              {presences.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-slate-950 border-2 border-slate-900 shadow-sm"
                  style={{ backgroundColor: p.color || '#f59e0b' }}
                  title={`${p.name} (Online)`}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {presences.length > 5 && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-300">
                  +{presences.length - 5}
                </div>
              )}
            </div>
          )}

          <button
            onClick={onAddNode}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold tracking-wider uppercase shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            New Note
          </button>
        </div>
      </header>

      {/* Floating Bottom Navigation Dock */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <div 
          className="p-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-slate-700"
          style={{ backgroundColor: '#10141d' }}
        >
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800">
            <button
              onClick={onToggleViewMode}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'canvas'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Freeform 2D Canvas space"
            >
              <Layers className="w-3.5 h-3.5" />
              Canvas
            </button>

            <button
              onClick={onToggleViewMode}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                viewMode === 'force'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Physics Force-Directed Layout"
            >
              <Boxes className="w-3.5 h-3.5" />
              Force Graph
            </button>
          </div>

          <div className="w-[1px] h-6 bg-slate-800 mx-1" />

          {/* Auto Layout Action */}
          <button
            onClick={onAutoLayout}
            disabled={isAutoLayoutRunning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Auto-arrange nodes using physics simulation"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isAutoLayoutRunning ? 'animate-spin text-amber-400' : ''}`}
            />
            Auto Arrange
          </button>

          {/* Path Finder */}
          <button
            onClick={onOpenPathFinder}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold uppercase tracking-wider transition-all"
          >
            <GitFork className="w-4 h-4 text-amber-400" />
            Path Explorer
          </button>

          {/* Metrics Drawer */}
          <button
            onClick={onOpenStats}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-sky-400" />
            Metrics
          </button>
        </div>
      </nav>
    </>
  );
}
