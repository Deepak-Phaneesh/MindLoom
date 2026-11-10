'use client';

import dynamic from 'next/dynamic';

const CollaborativeCanvas = dynamic(
  () => import('@/components/canvas/CollaborativeCanvas').then((mod) => mod.CollaborativeCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-[#07080a] text-[#f1ede6]">
        <div className="relative w-8 h-8 mb-4">
          <div className="absolute inset-0 rounded-sm border border-champagne/40 animate-ping" />
          <div className="w-8 h-8 rounded-sm bg-obsidian-900 border border-champagne flex items-center justify-center font-mono text-[10px] text-champagne font-bold">
            S
          </div>
        </div>
        <p className="font-mono text-xs tracking-[0.16em] uppercase text-[#8c867a]">
          SYNAPSE // INITIALIZING GRAPH CORE...
        </p>
      </div>
    ),
  }
);

export default function Home() {
  return (
    <main className="w-screen h-screen overflow-hidden">
      <CollaborativeCanvas />
    </main>
  );
}
