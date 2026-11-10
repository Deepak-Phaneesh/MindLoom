'use client';

import dynamic from 'next/dynamic';

const CollaborativeCanvas = dynamic(
  () => import('@/components/canvas/CollaborativeCanvas').then((mod) => mod.CollaborativeCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-[#090d16] text-slate-300">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium tracking-wide text-slate-400">
          Initializing Synapse Collaborative Graph Canvas...
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
