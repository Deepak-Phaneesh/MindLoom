import { NextResponse } from 'next/server';
import { Node, Edge } from '@xyflow/react';
import { CanvasNodeData, CanvasEdgeData } from '@/lib/graph/types';

export async function GET() {
  const initialNodes: Node<CanvasNodeData>[] = [
    {
      id: 'node-web',
      type: 'knowledgeNode',
      position: { x: 100, y: 150 },
      data: {
        title: 'Next.js Frontend Client',
        content: 'Provides the collaborative infinite canvas powered by React Flow and rich-text note blocks. Renders at 60 FPS.',
        nodeType: 'service',
        tags: ['Frontend', 'App Router', 'TypeScript'],
        color: '#e65440',
        entities: [
          { id: 'e-1', name: 'React Flow', type: 'service', description: 'Canvas rendering engine' },
          { id: 'e-2', name: 'Yjs Client', type: 'concept', description: 'CRDT local doc store' },
        ],
        updatedAt: Date.now(),
      },
    },
    {
      id: 'node-reactflow',
      type: 'knowledgeNode',
      position: { x: 460, y: 80 },
      data: {
        title: 'React Flow Canvas Engine',
        content: 'Handles smooth zoom, pan, node dragging, custom handles, and interactive edge routing.',
        nodeType: 'concept',
        tags: ['Canvas', 'Interactive', 'UI'],
        color: '#e8c88c',
        updatedAt: Date.now(),
      },
    },
    {
      id: 'node-sync',
      type: 'knowledgeNode',
      position: { x: 500, y: 320 },
      data: {
        title: 'Real-time WebSocket Sync Server',
        content: 'Maintains room state, syncs Yjs CRDT document binary streams, and broadcasts live cursor awareness vectors.',
        nodeType: 'service',
        tags: ['WebSocket', 'Networking', 'Real-time'],
        color: '#e65440',
        entities: [
          { id: 'e-3', name: 'Awareness Protocol', type: 'concept', description: 'Multiplayer ephemeral cursor broadcast' },
        ],
        updatedAt: Date.now(),
      },
    },
    {
      id: 'node-yjs',
      type: 'knowledgeNode',
      position: { x: 150, y: 460 },
      data: {
        title: 'Yjs CRDT Engine',
        content: 'Ensures eventual consistency without merge conflicts. Handles concurrent note editing and canvas coordinates.',
        nodeType: 'concept',
        tags: ['CRDT', 'State Sync', 'Conflict-Free'],
        color: '#e8c88c',
        updatedAt: Date.now(),
      },
    },
    {
      id: 'node-queue',
      type: 'knowledgeNode',
      position: { x: 880, y: 220 },
      data: {
        title: 'Redis BullMQ Job Queue',
        content: 'Buffers note change events and dispatches asynchronous background extraction jobs without blocking user interactions.',
        nodeType: 'database',
        tags: ['Redis', 'Queue', 'Async Workers'],
        color: '#3e829a',
        updatedAt: Date.now(),
      },
    },
    {
      id: 'node-ai',
      type: 'knowledgeNode',
      position: { x: 1220, y: 220 },
      data: {
        title: 'LLM Extraction Pipeline',
        content: 'Parses raw note content with structured JSON schemas (Zod). Extracts named entities and typed semantic relationships.',
        nodeType: 'service',
        tags: ['AI', 'LLM', 'Knowledge Graph'],
        color: '#e65440',
        entities: [
          { id: 'e-4', name: 'Zod Validator', type: 'concept', description: 'Schema enforcer' },
        ],
        updatedAt: Date.now(),
      },
    },
    {
      id: 'node-postgres',
      type: 'knowledgeNode',
      position: { x: 950, y: 480 },
      data: {
        title: 'PostgreSQL & pgvector',
        content: 'Stores persistent notes, document revisions, and vector embeddings for semantic similarity search.',
        nodeType: 'database',
        tags: ['PostgreSQL', 'SQL', 'Embeddings'],
        color: '#3e829a',
        updatedAt: Date.now(),
      },
    },
    {
      id: 'node-graphdb',
      type: 'knowledgeNode',
      position: { x: 1300, y: 480 },
      data: {
        title: 'Apache AGE / Graph DB',
        content: 'High-performance property graph database allowing recursive multi-hop relationship queries.',
        nodeType: 'database',
        tags: ['Graph Database', 'Cypher', 'Multi-hop'],
        color: '#3e829a',
        updatedAt: Date.now(),
      },
    },
  ];

  const initialEdges: Edge<CanvasEdgeData>[] = [
    {
      id: 'edge-web-reactflow',
      source: 'node-web',
      target: 'node-reactflow',
      type: 'relationEdge',
      data: {
        relation: 'implements',
        label: 'implements',
        explanation: 'Frontend uses React Flow for canvas rendering and spatial manipulation.',
      },
    },
    {
      id: 'edge-web-yjs',
      source: 'node-web',
      target: 'node-yjs',
      type: 'relationEdge',
      data: {
        relation: 'depends_on',
        label: 'depends on',
        explanation: 'Client manages local state mutations through Yjs shared types.',
      },
    },
    {
      id: 'edge-yjs-sync',
      source: 'node-yjs',
      target: 'node-sync',
      type: 'relationEdge',
      data: {
        relation: 'communicates_with',
        label: 'syncs with',
        explanation: 'Yjs exchanges binary update diffs over WebSocket connection.',
      },
    },
    {
      id: 'edge-web-sync',
      source: 'node-web',
      target: 'node-sync',
      type: 'relationEdge',
      data: {
        relation: 'communicates_with',
        label: 'subscribes to',
        explanation: 'Web client listens for live cursor awareness and peer events.',
      },
    },
    {
      id: 'edge-sync-queue',
      source: 'node-sync',
      target: 'node-queue',
      type: 'relationEdge',
      data: {
        relation: 'communicates_with',
        label: 'dispatches to',
        explanation: 'Dispatches note save events to background job queue.',
      },
    },
    {
      id: 'edge-queue-ai',
      source: 'node-queue',
      target: 'node-ai',
      type: 'relationEdge',
      data: {
        relation: 'depends_on',
        label: 'consumed by',
        explanation: 'Background worker consumes extraction jobs and calls LLM.',
      },
    },
    {
      id: 'edge-ai-graphdb',
      source: 'node-ai',
      target: 'node-graphdb',
      type: 'relationEdge',
      data: {
        relation: 'stores_in',
        label: 'populates',
        explanation: 'Extracted semantic relationships are saved into the property graph store.',
      },
    },
    {
      id: 'edge-ai-postgres',
      source: 'node-ai',
      target: 'node-postgres',
      type: 'relationEdge',
      data: {
        relation: 'stores_in',
        label: 'stores in',
        explanation: 'Entities and vector embeddings are stored for hybrid search.',
      },
    },
    {
      id: 'edge-postgres-graphdb',
      source: 'node-postgres',
      target: 'node-graphdb',
      type: 'relationEdge',
      data: {
        relation: 'relates_to',
        label: 'co-exists with',
        explanation: 'Apache AGE operates as an integrated extension within PostgreSQL.',
      },
    },
  ];

  return NextResponse.json({ nodes: initialNodes, edges: initialEdges });
}
