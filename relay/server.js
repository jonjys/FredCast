/**
 * FredCast Relay v3 — pairing + signalling + heartbeat + multi-peer rooms.
 * Holds no media; only routes JSON messages between sender(s) and receiver(s) in a room.
 * Deployed on Render free tier (cold start ~30s first connect).
 */
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const PING_INTERVAL = 15000;

/** @type {Map<string, { senders: Set, receivers: Set, createdAt: number, lastActive: number }>} */
const rooms = new Map();

function getRoom(code) {
  let r = rooms.get(code);
  if (!r) {
    r = { senders: new Set(), receivers: new Set(), createdAt: Date.now(), lastActive: Date.now() };
    rooms.set(code, r);
  }
  r.lastActive = Date.now();
  return r;
}

function broadcast(room, msg, except) {
  const data = typeof msg === 'string' ? msg : JSON.stringify(msg);
  for (const ws of [...room.senders, ...room.receivers]) {
    if (ws !== except && ws.readyState === 1) {
      try { ws.send(data); } catch { /* ignore */ }
    }
  }
}

function peerStatus(room) {
  const connected = room.senders.size > 0 && room.receivers.size > 0;
  broadcast(room, { type: 'peer-status', connected, senders: room.senders.size, receivers: room.receivers.size });
}

function cleanupRooms() {
  const now = Date.now();
  for (const [code, r] of rooms) {
    if (now - r.lastActive > ROOM_TTL_MS) {
      for (const ws of [...r.senders, ...r.receivers]) {
        try { ws.close(); } catch { /* ignore */ }
      }
      rooms.delete(code);
    }
  }
}
setInterval(cleanupRooms, 60 * 60 * 1000);

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('FredCast Relay v3');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let code = null;
  let role = null;

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(String(raw)); } catch { return; }

    if (msg.type === 'join' && msg.code && msg.role) {
      code = String(msg.code).replace(/\D/g, '').slice(0, 6);
      role = msg.role === 'receiver' ? 'receiver' : 'sender';
      if (code.length !== 6) {
        ws.send(JSON.stringify({ type: 'error', message: 'invalid code' }));
        return;
      }
      const room = getRoom(code);
      if (role === 'sender') room.senders.add(ws);
      else room.receivers.add(ws);
      ws.send(JSON.stringify({ type: 'joined', code, role }));
      peerStatus(room);
      return;
    }

    if (msg.type === 'ping') {
      ws.send(JSON.stringify({ type: 'pong' }));
      if (code) {
        const room = rooms.get(code);
        if (room) room.lastActive = Date.now();
      }
      return;
    }

    // Forward everything else to peers in the same room
    if (code) {
      const room = rooms.get(code);
      if (room) {
        room.lastActive = Date.now();
        broadcast(room, msg, ws);
      }
    }
  });

  ws.on('close', () => {
    if (!code) return;
    const room = rooms.get(code);
    if (!room) return;
    room.senders.delete(ws);
    room.receivers.delete(ws);
    peerStatus(room);
    if (room.senders.size === 0 && room.receivers.size === 0) {
      // keep room for TTL so reconnect can reuse
    }
  });
});

// Keep-alive for Render free tier
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    try { ws.ping(); } catch { /* ignore */ }
  });
}, PING_INTERVAL);

wss.on('close', () => clearInterval(interval));

server.listen(PORT, () => {
  console.log(`FredCast Relay v3 on :${PORT}`);
});
