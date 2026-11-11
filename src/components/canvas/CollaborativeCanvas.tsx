'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import mqtt, { MqttClient } from 'mqtt';
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

// Bespoke Studio Color Palette for Collaborators
const STUDIO_COLORS = ['#e8c88c', '#529471', '#c67d5a', '#3e829a', '#e65440', '#edd19c'];

export function CollaborativeCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<CanvasNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<CanvasEdgeData>>([]);

  // Use refs to prevent stale closure issues in real-time callbacks
  const nodesRef = useRef<Node<CanvasNodeData>[]>([]);
  const edgesRef = useRef<Edge<CanvasEdgeData>[]>([]);
  nodesRef.current = nodes;
  edgesRef.current = edges;

  const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node<CanvasNodeData>, Edge<CanvasEdgeData>> | null>(null);
  const [viewMode, setViewMode] = useState<'canvas' | 'force'>('canvas');
  const [isAutoLayoutRunning, setIsAutoLayoutRunning] = useState(false);

  // Multiplayer presence state
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId] = useState(() => `user-${Math.random().toString(36).substring(2, 7)}`);
  const [userName] = useState(() => `ARCHITECT_${Math.floor(Math.random() * 900 + 100)}`);
  const [userColor] = useState(() => STUDIO_COLORS[Math.floor(Math.random() * STUDIO_COLORS.length)]);

  // Modals state
  const [isPathFinderOpen, setIsPathFinderOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node<CanvasNodeData> | null>(null);

  const socketRef = useRef<any>(null);
  const roomName = 'core-architecture';
  const topic = `mindloom/rooms/${roomName}`;
  const STORAGE_KEY = `mindloom_graph_${roomName}`;

  // 1. Load initial graph (Prioritize LocalStorage, fallback to seed)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.nodes && parsed.nodes.length > 0) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges || []);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }

    async function loadSeedData() {
      try {
        const res = await fetch('/api/graph/seed');
        if (res.ok) {
          const data = await res.json();
          setNodes(data.nodes || []);
          setEdges(data.edges || []);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
          } catch {}
        }
      } catch (err) {
        console.error('Failed to load seed graph:', err);
      }
    }
    loadSeedData();
  }, [setNodes, setEdges, STORAGE_KEY]);

  // Broadcast graph changes to peers and persist locally
  const broadcastGraphSync = useCallback(
    (newNodes: Node<CanvasNodeData>[], newEdges: Edge<CanvasEdgeData>[]) => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ nodes: newNodes, edges: newEdges })
        );
      } catch (e) {
        console.warn('Failed to save to localStorage', e);
      }

      const client = socketRef.current;
      if (client && client.connected) {
        client.publish(
          topic,
          JSON.stringify({
            type: 'graph:update',
            originId: currentUserId,
            payload: { nodes: newNodes, edges: newEdges },
          })
        );
      }
    },
    [STORAGE_KEY, topic, currentUserId]
  );

  // Broadcast single node drag movement (throttled)
  const lastDragSendRef = useRef<number>(0);
  const broadcastNodeDrag = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      const now = Date.now();
      if (now - lastDragSendRef.current < 40) return;
      lastDragSendRef.current = now;

      const client = socketRef.current;
      if (client && client.connected) {
        client.publish(
          topic,
          JSON.stringify({
            type: 'node:move',
            originId: currentUserId,
            nodeId,
            position,
          })
        );
      }
    },
    [topic, currentUserId]
  );

  // 2. Connect to Real-time Cloud PubSub Broker (Supports cross-browser live sync)
  useEffect(() => {
    let client: MqttClient;

    try {
      client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', {
        keepalive: 30,
        clientId: `mindloom_${currentUserId}_${Math.random().toString(16).substring(2, 8)}`,
        clean: true,
        reconnectPeriod: 2000,
      });

      socketRef.current = client;

      client.on('connect', () => {
        setIsConnected(true);
        client.subscribe(topic, { qos: 0 });

        // Broadcast presence announcement
        client.publish(
          topic,
          JSON.stringify({
            type: 'presence:join',
            userId: currentUserId,
            user: {
              id: currentUserId,
              name: userName,
              color: userColor,
              lastActive: Date.now(),
            },
          })
        );

        // Ask existing peers in the room for their current live graph state
        client.publish(
          topic,
          JSON.stringify({
            type: 'graph:request_sync',
            requesterId: currentUserId,
          })
        );
      });

      client.on('message', (_t, payload) => {
        try {
          const msg = JSON.parse(payload.toString());

          // Ignore own outgoing messages
          if (msg.userId === currentUserId || msg.originId === currentUserId) return;

          switch (msg.type) {
            case 'graph:request_sync': {
              // A new peer joined the room! Send them our current live canvas
              if (nodesRef.current.length > 0 && client.connected) {
                client.publish(
                  topic,
                  JSON.stringify({
                    type: 'graph:update',
                    originId: currentUserId,
                    payload: { nodes: nodesRef.current, edges: edgesRef.current },
                  })
                );
              }
              break;
            }

            case 'presence:join':
            case 'presence:heartbeat': {
              if (msg.user) {
                setPresences((prev) => {
                  const filtered = prev.filter((p) => p.id !== msg.user.id);
                  return [...filtered, { ...msg.user, lastActive: Date.now() }];
                });

                // If someone just joined, reply with our presence so both see each other
                if (msg.type === 'presence:join' && client.connected) {
                  client.publish(
                    topic,
                    JSON.stringify({
                      type: 'presence:heartbeat',
                      userId: currentUserId,
                      user: {
                        id: currentUserId,
                        name: userName,
                        color: userColor,
                        lastActive: Date.now(),
                      },
                    })
                  );
                }
              }
              break;
            }

            case 'presence:leave': {
              setPresences((prev) => prev.filter((p) => p.id !== msg.userId));
              break;
            }

            case 'cursor:update': {
              setPresences((prev) =>
                prev.map((p) =>
                  p.id === msg.userId ? { ...p, cursor: msg.cursor, lastActive: Date.now() } : p
                )
              );
              break;
            }

            case 'node:move': {
              // Remote peer dragged a node
              if (msg.nodeId && msg.position) {
                setNodes((prev) =>
                  prev.map((n) => (n.id === msg.nodeId ? { ...n, position: msg.position } : n))
                );
              }
              break;
            }

            case 'graph:update': {
              if (msg.payload?.nodes) {
                setNodes(msg.payload.nodes);
                nodesRef.current = msg.payload.nodes;
                try {
                  localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ nodes: msg.payload.nodes, edges: msg.payload.edges || [] })
                  );
                } catch {}
              }
              if (msg.payload?.edges) {
                setEdges(msg.payload.edges);
                edgesRef.current = msg.payload.edges;
              }
              break;
            }

            default:
              break;
          }
        } catch {}
      });

      client.on('close', () => setIsConnected(false));
      client.on('error', () => setIsConnected(false));
      client.on('offline', () => setIsConnected(false));
    } catch {
      setIsConnected(false);
    }

    // Periodic heartbeat & stale peer cleanup
    const timer = setInterval(() => {
      if (client && client.connected) {
        client.publish(
          topic,
          JSON.stringify({
            type: 'presence:heartbeat',
            userId: currentUserId,
            user: {
              id: currentUserId,
              name: userName,
              color: userColor,
              lastActive: Date.now(),
            },
          })
        );
      }

      // Cleanup peers silent for > 15 seconds
      const now = Date.now();
      setPresences((prev) => prev.filter((p) => now - (p.lastActive || now) < 15000));
    }, 4000);

    return () => {
      clearInterval(timer);
      if (client) {
        if (client.connected) {
          client.publish(
            topic,
            JSON.stringify({
              type: 'presence:leave',
              userId: currentUserId,
            })
          );
        }
        client.end(true);
      }
    };
  }, [currentUserId, userName, userColor, setNodes, setEdges, topic, STORAGE_KEY]);

  // Broadcast cursor movement (throttled to 35ms)
  const lastCursorSendRef = useRef<number>(0);
  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      const now = Date.now();
      if (now - lastCursorSendRef.current < 35) return;
      lastCursorSendRef.current = now;

      const client = socketRef.current;
      if (!client || !client.connected) return;

      const x = event.clientX;
      const y = event.clientY;

      client.publish(
        topic,
        JSON.stringify({
          type: 'cursor:update',
          userId: currentUserId,
          cursor: { x, y },
        })
      );
    },
    [topic, currentUserId]
  );

  // Dragging event handlers
  const onNodeDrag = useCallback(
    (_: MouseEvent | TouchEvent, node: Node) => {
      broadcastNodeDrag(node.id, node.position);
    },
    [broadcastNodeDrag]
  );

  const onNodeDragStop = useCallback(() => {
    // Final position settled -> broadcast full update to ensure state alignment
    broadcastGraphSync(nodesRef.current, edgesRef.current);
  }, [broadcastGraphSync]);

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
          explanation: 'Connected by collaborator',
        },
      } as Edge<CanvasEdgeData>;

      const nextEdges = addEdge(newEdge, edgesRef.current);
      setEdges(nextEdges);
      broadcastGraphSync(nodesRef.current, nextEdges);
    },
    [setEdges, broadcastGraphSync]
  );

  // Deletion handlers
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const deletedIds = new Set(deleted.map((n) => n.id));
      const remainingNodes = nodesRef.current.filter((n) => !deletedIds.has(n.id));
      const remainingEdges = edgesRef.current.filter(
        (e) => !deletedIds.has(e.source) && !deletedIds.has(e.target)
      );
      setNodes(remainingNodes);
      setEdges(remainingEdges);
      broadcastGraphSync(remainingNodes, remainingEdges);
    },
    [setNodes, setEdges, broadcastGraphSync]
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      const deletedIds = new Set(deleted.map((e) => e.id));
      const remainingEdges = edgesRef.current.filter((e) => !deletedIds.has(e.id));
      setEdges(remainingEdges);
      broadcastGraphSync(nodesRef.current, remainingEdges);
    },
    [setEdges, broadcastGraphSync]
  );

  // Node Click: open inspector/editor
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<CanvasNodeData>) => {
      setSelectedNode(node);
      setIsEditorOpen(true);
    },
    []
  );

  // Save Node from Editor
  const handleSaveNode = useCallback(
    (
      updatedNode: Node<CanvasNodeData>,
      newNodesToAdd: Node<CanvasNodeData>[] = [],
      newEdgesToAdd: Edge<CanvasEdgeData>[] = []
    ) => {
      const currentNodes = nodesRef.current;
      const currentEdges = edgesRef.current;

      const exists = currentNodes.some((n) => n.id === updatedNode.id);
      const updated = exists
        ? currentNodes.map((n) => (n.id === updatedNode.id ? updatedNode : n))
        : [...currentNodes, updatedNode];

      const combinedNodes = [...updated, ...newNodesToAdd];
      const combinedEdges = [...currentEdges, ...newEdgesToAdd];

      setNodes(combinedNodes);
      setEdges(combinedEdges);
      broadcastGraphSync(combinedNodes, combinedEdges);
    },
    [setNodes, setEdges, broadcastGraphSync]
  );

  // Auto-Layout Trigger (d3-force physics)
  const handleAutoLayout = useCallback(() => {
    setIsAutoLayoutRunning(true);
    setTimeout(() => {
      const arranged = calculateForceLayout(nodesRef.current, edgesRef.current);
      setNodes(arranged);
      broadcastGraphSync(arranged, edgesRef.current);
      setIsAutoLayoutRunning(false);
      if (rfInstance) {
        rfInstance.fitView({ duration: 600 });
      }
    }, 40);
  }, [setNodes, broadcastGraphSync, rfInstance]);

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
      className="relative w-screen h-screen canvas-backdrop overflow-hidden select-none"
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
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onInit={setRfInstance}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        defaultEdgeOptions={{ type: 'relationEdge' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={28}
          size={1.5}
          color="#222b3d"
        />
        <Controls
          className="!glass-panel !rounded-lg !p-1 overflow-hidden [&>button]:!bg-transparent [&>button]:!border-none [&>button]:!text-[#a6a094] hover:[&>button]:!bg-obsidian-800"
          showInteractive={false}
        />
        <MiniMap
          nodeColor={(node: any) => {
            const type = node.data?.nodeType;
            if (type === 'service') return '#e65440';
            if (type === 'database') return '#3e829a';
            if (type === 'concept') return '#e8c88c';
            if (type === 'api') return '#c67d5a';
            return '#529471';
          }}
          maskColor="rgba(7, 8, 10, 0.85)"
          className="!glass-panel !rounded-lg overflow-hidden !border-white/[0.06]"
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
