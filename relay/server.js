/**
 * FredCast Relay — pairing + signalling server for the PWA Receiver fallback
 * (PRODUCT_PLAN.md §8-9, MVP_BACKLOG.md Epic 7). This is the universal
 * fallback: when mDNS/SSDP discovery finds nothing (guest Wi-Fi, VLAN
 * isolation, iOS Local Network permission denied) — or when the target
 * screen has no Cast/AirPlay/DLNA support at all — the user opens the
 * receiver page on the screen, gets a short code, and the phone "casts" by
 * sending JSON media/control messages through this relay.
 *
 * Deliberately dumb: this server holds no media, no accounts, no history —
 * only a short-lived room keyed by a 6-digit code, relaying JSON messages
 * between exactly one sender (phone) and one receiver (TV browser tab).
 * Metadata-only relay, as described in §9's integrity tradeoff — full media
 * bytes for local files still travel sender -> receiver directly once a
 * real device is involved; this relay only carries small JSON commands.
 */
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8787;
const ROOM_TTL_MS = 30 * 60 * 1000;

/** @type {Map<string, { sender: import('ws')|null, receiver: import('ws')|null, createdAt: number }>} */
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
    room = { sender: null, receiver: null, createdAt: Date.now() };
    rooms.set(code, room);
  }
  return room;
}

function send(ws, msg) {
  if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
}

function peerOf(room, role) {
  return role === 'sender' ? room.receiver : room.sender;
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
    res.end(JSON.stringify({ ok: true, rooms: rooms.size }));
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

    if (msg.type === 'join') {
      const { code, role } = msg;
      if (!code || (role !== 'sender' && role !== 'receiver')) return;
      const room = getOrCreateRoom(code);
      room[role] = ws;
      joinedCode = code;
      joinedRole = role;

      send(ws, { type: 'joined', role, code });
      const peer = peerOf(room, role);
      if (peer) {
        send(ws, { type: 'peer-status', connected: true });
        send(peer, { type: 'peer-status', connected: true });
      }
      return;
    }

    if (!joinedCode || !joinedRole) return;
    const room = rooms.get(joinedCode);
    if (!room) return;
    const peer = peerOf(room, joinedRole);

    // Everything else (media / control / status) is opaque relay traffic —
    // the server doesn't interpret it, just forwards to whichever peer is
    // in the room. Keeps the receiver and sender free to evolve their
    // message shapes independently of this server.
    if (['media', 'control', 'status'].includes(msg.type)) {
      send(peer, msg);
    }
  });

  ws.on('close', () => {
    if (!joinedCode || !joinedRole) return;
    const room = rooms.get(joinedCode);
    if (!room) return;
    room[joinedRole] = null;
    const peer = peerOf(room, joinedRole);
    send(peer, { type: 'peer-status', connected: false });
    if (!room.sender && !room.receiver) rooms.delete(joinedCode);
  });
});

setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > ROOM_TTL_MS && !room.sender && !room.receiver) {
      rooms.delete(code);
    }
  }
}, 60 * 1000).unref();

server.listen(PORT, () => {
  console.log(`FredCast relay listening on :${PORT}`);
});
