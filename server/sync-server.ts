import { WebSocketServer, WebSocket } from 'ws';
import * as http from 'http';

interface RoomClient {
  ws: WebSocket;
  userId: string;
  userName: string;
  userColor: string;
}

interface Room {
  clients: Set<RoomClient>;
  documentState: string | null; // Base64 or serialized snapshot
}

const PORT = process.env.SYNC_PORT ? parseInt(process.env.SYNC_PORT, 10) : 1234;
const rooms = new Map<string, Room>();

const server = http.createServer((req, res) => {
  // Simple health check and metrics endpoint
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  if (req.url === '/health' || req.url === '/status') {
    const totalClients = Array.from(rooms.values()).reduce((acc, r) => acc + r.clients.size, 0);
    res.writeHead(200);
    res.end(
      JSON.stringify({
        status: 'online',
        uptime: process.uptime(),
        activeRooms: rooms.size,
        totalConnectedClients: totalClients,
      })
    );
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

const wss = new WebSocketServer({ server });

function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = { clients: new Set(), documentState: null };
    rooms.set(roomId, room);
  }
  return room;
}

wss.on('connection', (ws: WebSocket, req) => {
  // Parse room from URL: e.g. ws://localhost:1234/room-name
  const urlParts = (req.url || '/default-room').split('?')[0].split('/');
  const roomId = urlParts[1] || 'default-room';

  const room = getOrCreateRoom(roomId);
  let currentClient: RoomClient | null = null;

  console.log(`[WebSocket] New client connected to room: ${roomId}`);

  ws.on('message', (message: Buffer | string) => {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'join': {
          currentClient = {
            ws,
            userId: data.userId || `user-${Math.random().toString(36).substring(2, 7)}`,
            userName: data.userName || 'Anonymous Collaborator',
            userColor: data.userColor || '#6366f1',
          };
          room.clients.add(currentClient);

          // Broadcast user joined to room
          broadcastToRoom(roomId, ws, {
            type: 'presence:join',
            user: {
              id: currentClient.userId,
              name: currentClient.userName,
              color: currentClient.userColor,
            },
          });

          // Send current presence roster to the joining client
          const presenceList = Array.from(room.clients).map((c) => ({
            id: c.userId,
            name: c.userName,
            color: c.userColor,
          }));

          ws.send(
            JSON.stringify({
              type: 'sync:init',
              presence: presenceList,
            })
          );
          break;
        }

        case 'cursor:move': {
          if (currentClient) {
            broadcastToRoom(roomId, ws, {
              type: 'cursor:update',
              userId: currentClient.userId,
              cursor: data.cursor,
            });
          }
          break;
        }

        case 'node:select': {
          if (currentClient) {
            broadcastToRoom(roomId, ws, {
              type: 'node:selected',
              userId: currentClient.userId,
              nodeId: data.nodeId,
            });
          }
          break;
        }

        case 'graph:sync': {
          // Synchronize node/edge updates across all active clients
          broadcastToRoom(roomId, ws, {
            type: 'graph:update',
            payload: data.payload,
            originUser: currentClient?.userName || 'Collaborator',
          });
          break;
        }

        default:
          break;
      }
    } catch {
      // In case of raw binary messages (e.g. Yjs protocol), forward directly to peers
      for (const client of room.clients) {
        if (client.ws !== ws && client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(message);
        }
      }
    }
  });

  ws.on('close', () => {
    if (currentClient) {
      room.clients.delete(currentClient);
      console.log(`[WebSocket] Client ${currentClient.userName} disconnected from ${roomId}`);

      broadcastToRoom(roomId, ws, {
        type: 'presence:leave',
        userId: currentClient.userId,
      });

      if (room.clients.size === 0) {
        rooms.delete(roomId);
      }
    }
  });

  ws.on('error', (err) => {
    console.error(`[WebSocket Error] Room ${roomId}:`, err);
  });
});

function broadcastToRoom(roomId: string, senderWs: WebSocket, payload: any) {
  const room = rooms.get(roomId);
  if (!room) return;

  const dataStr = JSON.stringify(payload);
  for (const client of room.clients) {
    if (client.ws !== senderWs && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(dataStr);
    }
  }
}

server.listen(PORT, () => {
  console.log(`🚀 [SyncServer] Real-time CRDT & WebSocket server running on http://localhost:${PORT} (ws://localhost:${PORT})`);
});
