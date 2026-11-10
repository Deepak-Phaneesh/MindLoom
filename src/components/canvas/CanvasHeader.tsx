'use client';

import React from 'react';
import { UserPresence } from '@/lib/graph/types';
import { 
  GitFork, 
  BarChart3, 
  Plus, 
  Layers, 
  RefreshCw,
  Boxes,
  CircleDot
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
      {/* Top Studio Telemetry Bar */}
      <header className="absolute top-4 left-5 right-5 z-40 flex items-center justify-between pointer-events-none">
        {/* Left: Studio Identity & Telemetry */}
        <div className="pointer-events-auto flex items-center gap-3 glass-panel px-3.5 py-2 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-sm bg-champagne shadow-[0_0_8px_#e8c88c]" />
            <span className="font-mono text-[11px] font-bold tracking-[0.16em] uppercase text-[#f1ede6]">
              SYNAPSE <span className="text-[#8c867a] font-normal">// GRAPH CORE</span>
            </span>
          </div>

          <div className="w-[1px] h-3.5 bg-white/[0.08]" />

          <div className="flex items-center gap-2 font-mono text-[10px] text-[#8c867a]">
            <span className="uppercase text-champagne/90 tracking-wider">
              {roomName}
            </span>
            <span className="text-white/[0.15]">/</span>
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? 'bg-sage animate-pulse' : 'bg-copper'
                }`}
              />
              <span className={isConnected ? 'text-sage-light' : 'text-copper-light'}>
                {isConnected ? 'LIVE PEERS' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Presence Roster & Quick Action */}
        <div className="pointer-events-auto flex items-center gap-2.5">
          {presences.length > 0 && (
            <div className="flex items-center -space-x-1.5 glass-panel px-2.5 py-1.5 rounded-lg">
              {presences.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="w-6 h-6 rounded-md flex items-center justify-center font-mono text-[10px] font-bold text-obsidian-950 border border-obsidian-900 shadow-sm"
                  style={{ backgroundColor: p.color || '#e8c88c' }}
                  title={`${p.name} (Active)`}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {presences.length > 5 && (
                <div className="w-6 h-6 rounded-md bg-obsidian-800 border border-obsidian-900 flex items-center justify-center font-mono text-[9px] font-bold text-[#d8d2c6]">
                  +{presences.length - 5}
                </div>
              )}
            </div>
          )}

          <button
            onClick={onAddNode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-champagne hover:bg-champagne-300 text-obsidian-950 font-mono text-[11px] font-bold tracking-wider uppercase shadow-[0_2px_12px_rgba(232,200,140,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            New Note
          </button>
        </div>
      </header>

      {/* Floating Center Bottom Studio Dock */}
      <nav className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto">
        <div className="glass-panel p-1.5 rounded-xl flex items-center gap-1 shadow-2xl">
          {/* Mode Switcher Group */}
          <div className="flex items-center bg-obsidian-950/70 p-0.5 rounded-lg border border-white/[0.04]">
            <button
              onClick={onToggleViewMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[10px] font-semibold tracking-wider uppercase transition-all ${
                viewMode === 'canvas'
                  ? 'bg-obsidian-800 text-champagne border border-white/[0.08] shadow-sm'
                  : 'text-[#8c867a] hover:text-[#d8d2c6]'
              }`}
              title="Freeform Spatial Workspace"
            >
              <Layers className="w-3 h-3" />
              Canvas
            </button>

            <button
              onClick={onToggleViewMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-mono text-[10px] font-semibold tracking-wider uppercase transition-all ${
                viewMode === 'force'
                  ? 'bg-obsidian-800 text-champagne border border-white/[0.08] shadow-sm'
                  : 'text-[#8c867a] hover:text-[#d8d2c6]'
              }`}
              title="Physics Force-Directed Layout"
            >
              <Boxes className="w-3 h-3" />
              Force Graph
            </button>
          </div>

          <div className="w-[1px] h-4 bg-white/[0.08] mx-1" />

          {/* Auto Layout Action */}
          <button
            onClick={onAutoLayout}
            disabled={isAutoLayoutRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase text-[#a6a094] hover:text-white hover:bg-obsidian-800/80 transition-colors"
            title="Settle graph using d3-force simulation"
          >
            <RefreshCw
              className={`w-3 h-3 ${isAutoLayoutRunning ? 'animate-spin text-champagne' : ''}`}
            />
            Auto Arrange
          </button>

          {/* Multi-Hop Path Finder Action */}
          <button
            onClick={onOpenPathFinder}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-champagne/10 hover:bg-champagne/20 text-champagne border border-champagne/25 font-mono text-[10px] font-semibold tracking-wider uppercase transition-all"
          >
            <GitFork className="w-3 h-3 text-champagne" />
            Path Explorer
          </button>

          {/* Graph Telemetry Drawer */}
          <button
            onClick={onOpenStats}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] font-semibold tracking-wider uppercase text-[#a6a094] hover:text-white hover:bg-obsidian-800/80 transition-colors"
          >
            <BarChart3 className="w-3 h-3 text-azure-light" />
            Metrics
          </button>
        </div>
      </nav>
    </>
  );
}
