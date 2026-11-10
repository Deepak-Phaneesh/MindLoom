'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  ReactFlowInstance,
  NodeTypes,
  EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { KnowledgeNode } from './KnowledgeNode';
import { RelationEdge } from './RelationEdge';
import { CanvasHeader } from './CanvasHeader';
import { RemoteCursors } from './RemoteCursors';
import { PathFinderModal } from '../graph/PathFinderModal';
import { GraphStatsDrawer } from '../graph/GraphStatsDrawer';
import { NoteEditorModal } from '../editor/NoteEditorModal';
import { CanvasNodeData, CanvasEdgeData, UserPresence } from '@/lib/graph/types';
import { calculateForceLayout } from '@/lib/graph/layout';

const nodeTypes: NodeTypes = { knowledgeNode: KnowledgeNode as any };
const edgeTypes: EdgeTypes = { relationEdge: RelationEdge as any };

const RANDOM_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];

export function CollaborativeCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CanvasNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<CanvasEdgeData>>([]);

  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node<CanvasNodeData>, Edge<CanvasEdgeData>> | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'force'>('canvas');
  const [isAutoLayoutRunning, setIsAutoLayoutRunning] = useState(false);

  // Multiplayer presence state
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId] = useState(() => `user-${Math.random().toString(36).substring(2, 7)}`);
  const [userName] = useState(() => `User ${Math.floor(Math.random() * 900 + 100)}`);
  const [userColor] = useState(() => RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)]);

  // Modals state
  const [isPathFinderOpen, setIsPathFinderOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node<CanvasNodeData> | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const roomName = 'arch-knowledge-room';

  // 1. Load initial seed graph
  useEffect(() => {
    async function loadSeedData() {
      try {
        const res = await fetch('/api/graph/seed');
        if (res.ok) {
          const data = await res.json();
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
        }
      } catch (err) {
        console.error('Failed to load seed graph:', err);
      }
    }
    loadSeedData();
  }, [setNodes, setEdges]);

  // 2. Connect to Real-time WebSocket CRDT Server
  useEffect(() => {
    const wsUrl = `ws://localhost:1234/${roomName}`;
    let ws: WebSocket;

    try {
      ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        ws.send(
          JSON.stringify({
            type: 'join',
            userId: currentUserId,
            userName,
            userColor,
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          switch (msg.type) {
            case 'sync:init': {
              if (Array.isArray(msg.presence)) {
                setPresences(msg.presence);
              }
              break;
            }
            case 'presence:join': {
              setPresences((prev) => [...prev.filter((p) => p.id !== msg.user.id), msg.user]);
              break;
            }
            case 'presence:leave': {
              setPresences((prev) => prev.filter((p) => p.id !== msg.userId));
              break;
            }
            case 'cursor:update': {
              setPresences((prev) =>
                prev.map((p) => (p.id === msg.userId ? { ...p, cursor: msg.cursor } : p))
              );
              break;
            }
            case 'graph:update': {
              if (msg.payload?.nodes) setNodes(msg.payload.nodes);
              if (msg.payload?.edges) setEdges(msg.payload.edges);
              break;
            }
            default:
              break;
          }
        } catch {
          // Binary or non-json message
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch {
      setIsConnected(false);
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [currentUserId, userName, userColor, setNodes, setEdges]);

  // Broadcast graph changes to peers
  const broadcastGraphSync = useCallback(
    (newNodes: Node<CanvasNodeData>[], newEdges: Edge<CanvasEdgeData>[]) => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send(
          JSON.stringify({
            type: 'graph:sync',
            payload: { nodes: newNodes, edges: newEdges },
          })
        );
      }
    },
    []
  );

  // Broadcast cursor movement (canvas coordinates)
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
      const x = event.clientX;
      const y = event.clientY;

      socketRef.current.send(
        JSON.stringify({
          type: 'cursor:move',
          cursor: { x, y },
        })
      );
    },
    []
  );

  // Connection handler for manual edge creation between nodes
  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge<CanvasEdgeData> = {
        ...params,
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        type: 'relationEdge',
        data: {
          relation: 'relates_to',
          label: 'relates to',
          explanation: 'User established relationship',
        },
      } as Edge<CanvasEdgeData>;

      setEdges((eds) => {
        const next = addEdge(newEdge, eds);
        broadcastGraphSync(nodes, next);
        return next;
      });
    },
    [setEdges, broadcastGraphSync, nodes]
  );

  // Node Click: open inspector/editor
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<CanvasNodeData>) => {
      setSelectedNode(node);
      setIsEditorOpen(true);
    },
    []
  );

  // Save Node from Editor (with dynamically spawned entities & edges)
  const handleSaveNode = useCallback(
    (
      updatedNode: Node<CanvasNodeData>,
      newNodesToAdd: Node<CanvasNodeData>[] = [],
      newEdgesToAdd: Edge<CanvasEdgeData>[] = []
    ) => {
      setNodes((currentNodes) => {
        const exists = currentNodes.some((n) => n.id === updatedNode.id);
        const updated = exists
          ? currentNodes.map((n) => (n.id === updatedNode.id ? updatedNode : n))
          : [...currentNodes, updatedNode];

        const combinedNodes = [...updated, ...newNodesToAdd];

        setEdges((currentEdges) => {
          const combinedEdges = [...currentEdges, ...newEdgesToAdd];
          broadcastGraphSync(combinedNodes, combinedEdges);
          return combinedEdges;
        });

        return combinedNodes;
      });
    },
    [setNodes, setEdges, broadcastGraphSync]
  );

  // Auto-Layout Trigger (d3-force physics)
  const handleAutoLayout = useCallback(() => {
    setIsAutoLayoutRunning(true);
    setTimeout(() => {
      const arranged = calculateForceLayout(nodes, edges);
      setNodes(arranged);
      broadcastGraphSync(arranged, edges);
      setIsAutoLayoutRunning(false);
      if (rfInstance) {
        rfInstance.fitView({ duration: 800 });
      }
    }, 50);
  }, [nodes, edges, setNodes, broadcastGraphSync, rfInstance]);

  // Toggle View Mode
  const handleToggleViewMode = useCallback(() => {
    if (viewMode === 'canvas') {
      setViewMode('force');
      handleAutoLayout();
    } else {
      setViewMode('canvas');
    }
  }, [viewMode, handleAutoLayout]);

  // Highlight multi-hop path on canvas
  const handleHighlightPath = useCallback(
    (pathNodeIds: string[], pathEdgeIds: string[]) => {
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          data: {
            ...n.data,
            highlighted: pathNodeIds.includes(n.id),
          },
        }))
      );

      setEdges((prev) =>
        prev.map((e) => ({
          ...e,
          data: {
            ...e.data!,
            highlighted: pathEdgeIds.includes(e.id),
          },
        }))
      );
    },
    [setNodes, setEdges]
  );

  const handleClearHighlight = useCallback(() => {
    setNodes((prev) =>
      prev.map((n) => ({
        ...n,
        data: { ...n.data, highlighted: false },
      }))
    );
    setEdges((prev) =>
      prev.map((e) => ({
        ...e,
        data: { ...e.data!, highlighted: false },
      }))
    );
  }, [setNodes, setEdges]);

  return (
    <div
      className="relative w-screen h-screen bg-[#090d16] overflow-hidden select-none"
      onMouseMove={handleMouseMove}
    >
      {/* Top Header & Navigation */}
      <CanvasHeader
        roomName={roomName}
        presences={presences}
        isConnected={isConnected}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        onOpenPathFinder={() => setIsPathFinderOpen(true)}
        onOpenStats={() => setIsStatsOpen(true)}
        onAddNode={() => {
          setSelectedNode(null);
          setIsEditorOpen(true);
        }}
        onAutoLayout={handleAutoLayout}
        isAutoLayoutRunning={isAutoLayoutRunning}
      />

      {/* Multiplayer Remote Cursors Overlay */}
      <RemoteCursors presences={presences} currentUserId={currentUserId} />

      {/* Main React Flow Canvas */}
      <ReactFlow<Node<CanvasNodeData>, Edge<CanvasEdgeData>>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onInit={setRfInstance}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        defaultEdgeOptions={{ type: 'relationEdge' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1.2} color="#1e293b" />
        <Controls
          className="!bg-slate-900/90 !border !border-slate-800 !rounded-2xl !p-1 !shadow-2xl overflow-hidden [&>button]:!bg-transparent [&>button]:!border-none [&>button]:!text-slate-300 hover:[&>button]:!bg-slate-800"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node: any) => node.data?.color || '#6366f1'}
          maskColor="rgba(9, 13, 22, 0.75)"
          className="!bg-slate-900/80 !border !border-slate-800 !rounded-2xl !shadow-2xl overflow-hidden"
          zoomable
          pannable
        />
      </ReactFlow>

      {/* Modals & Drawers */}
      <PathFinderModal
        isOpen={isPathFinderOpen}
        onClose={() => setIsPathFinderOpen(false)}
        nodes={nodes}
        edges={edges}
        onHighlightPath={handleHighlightPath}
        onClearHighlight={handleClearHighlight}
      />

      <GraphStatsDrawer
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        nodes={nodes}
        edges={edges}
      />

      <NoteEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        node={selectedNode}
        allNodes={nodes}
        onSaveNode={handleSaveNode}
      />
    </div>
  );
}
