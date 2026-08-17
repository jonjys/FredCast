/**
 * FredCast Relay v3 — pairing + signalling + heartbeat + multi-peer rooms.
 * Room TTL 24h so a TV can stay paired all day.
 */
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8787;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

/** @type {Map<string, { senders: Set<import('ws')>, receivers: Set<import('ws')>, createdAt: number, lastActive: number }>} */
const rooms = new Map();

function makeCode() {
  let code;
  do {
    code = String(Math.floor(100000 + Math.random() * 900000));
  } while (rooms.has(code));
  return code;
}

function getOrCreateRoom(code) {
  let room = rooms.get(code);
  if (!room) {
    room = { senders: new Set(), receivers: new Set(), createdAt: Date.now(), lastActive: Date.now() };
    rooms.set(code, room);
  }
  return room;
}

function send(ws, msg) {
  if (ws && ws.readyState === 1) {
    try { ws.send(JSON.stringify(msg)); } catch { /* ignore */ }
  }
}

function broadcast(peers, msg, except) {
  for (const ws of peers) {
    if (ws !== except) send(ws, msg);
  }
}

function peerStatus(room) {
  return {
    senders: room.senders.size,
    receivers: room.receivers.size,
    connected: room.senders.size > 0 && room.receivers.size > 0,
  };
}

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
};

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    res.end();
    return;
  }
  if (req.url === '/health') {
    res.writeHead(200, { ...CORS_HEADERS, 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, version: 3 }));
    return;
  }
  if (req.url === '/new-code') {
    const code = makeCode();
    getOrCreateRoom(code);
    res.writeHead(200, { ...CORS_HEADERS, 'content-type': 'application/json' });
    res.end(JSON.stringify({ code }));
    return;
  }
  res.writeHead(404, CORS_HEADERS);
  res.end('not found');
});

const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws) => {
  let joinedCode = null;
  let joinedRole = null;

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === 'ping') {
      send(ws, { type: 'pong', t: Date.now() });
      if (joinedCode) {
        const room = rooms.get(joinedCode);
        if (room) room.lastActive = Date.now();
      }
      return;
    }

    if (msg.type === 'join') {
      const { code, role } = msg;
      if (!code || (role !== 'sender' && role !== 'receiver')) return;

      if (joinedCode && joinedRole) {
        const prev = rooms.get(joinedCode);
        if (prev) {
          if (joinedRole === 'sender') prev.senders.delete(ws);
          else prev.receivers.delete(ws);
        }
      }

      const room = getOrCreateRoom(String(code));
      room.lastActive = Date.now();
      if (role === 'sender') room.senders.add(ws);
      else room.receivers.add(ws);
      joinedCode = String(code);
      joinedRole = role;

      send(ws, { type: 'joined', role, code: joinedCode, ...peerStatus(room) });
      const status = { type: 'peer-status', connected: peerStatus(room).connected, ...peerStatus(room) };
      broadcast(room.senders, status);
      broadcast(room.receivers, status);
      return;
    }

    if (!joinedCode || !joinedRole) return;
    const room = rooms.get(joinedCode);
    if (!room) return;
    room.lastActive = Date.now();

    const targets = joinedRole === 'sender' ? room.receivers : room.senders;
    if (['media', 'control', 'status', 'webrtc-offer', 'webrtc-answer', 'webrtc-ice', 'queue-update', 'group-event', 'pointer', 'draw'].includes(msg.type)) {
      broadcast(targets, msg);
    }
  });

  ws.on('close', () => {
    if (!joinedCode || !joinedRole) return;
    const room = rooms.get(joinedCode);
    if (!room) return;
    if (joinedRole === 'sender') room.senders.delete(ws);
    else room.receivers.delete(ws);
    const status = { type: 'peer-status', connected: peerStatus(room).connected, ...peerStatus(room) };
    broadcast(room.senders, status);
    broadcast(room.receivers, status);
    if (room.senders.size === 0 && room.receivers.size === 0) {
      room.lastActive = Date.now();
    }
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.lastActive > ROOM_TTL_MS) rooms.delete(code);
  }
}, 60 * 1000).unref();

server.listen(PORT, () => {
  console.log(`FredCast relay v3 listening on :${PORT}`);
});
