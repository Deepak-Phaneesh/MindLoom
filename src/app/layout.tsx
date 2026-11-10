import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MindLoom | Real-Time Collaborative Knowledge Graph & Canvas',
  description: 'A collaborative workspace with real-time multiplayer networking, dynamic knowledge graphs, and AI entity-relation extraction.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-[#090d16] text-slate-100 select-none">
        {children}
      </body>
    </html>
  );
}
