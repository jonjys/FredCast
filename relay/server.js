/**
 * FredCast Relay v3.1 — pairing + signalling + groups (room codes, no auth).
 * Holds no media blobs; routes JSON between peers. Groups are in-memory (30d TTL).
 */
const http = require('http');
const { WebSocketServer } = require('ws');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;
const GROUP_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const PING_INTERVAL = 15000;

/** @type {Map<string, { senders: Set, receivers: Set, createdAt: number, lastActive: number }>} */
const rooms = new Map();

/** @type {Map<string, { name: string, members: Array, files: Array, createdAt: number, adminToken: string }>} */
const groups = new Map();

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1e6) {
        reject(new Error('body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function token() {
  return crypto.randomBytes(16).toString('hex');
}

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
      try {
        ws.send(data);
      } catch {
        /* ignore */
      }
    }
  }
}

function peerStatus(room) {
  const connected = room.senders.size > 0 && room.receivers.size > 0;
  broadcast(room, {
    type: 'peer-status',
    connected,
    senders: room.senders.size,
    receivers: room.receivers.size,
  });
}

function cleanup() {
  const now = Date.now();
  for (const [code, r] of rooms) {
    if (now - r.lastActive > ROOM_TTL_MS) {
      for (const ws of [...r.senders, ...r.receivers]) {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      }
      rooms.delete(code);
    }
  }
  for (const [code, g] of groups) {
    if (now - g.createdAt > GROUP_TTL_MS) groups.delete(code);
  }
}
setInterval(cleanup, 60 * 60 * 1000);

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = req.url || '/';

  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, rooms: rooms.size, groups: groups.size }));
    return;
  }

  if (url === '/new-code') {
    let code = randomCode();
    while (rooms.has(code) || groups.has(code)) code = randomCode();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code }));
    return;
  }

  if (url === '/api/groups/create' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const name = String(body.name || '').trim().slice(0, 80);
      const nickname = String(body.nickname || 'Admin').trim().slice(0, 40) || 'Admin';
      if (!name) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'name required' }));
        return;
      }
      let code = randomCode();
      while (groups.has(code) || rooms.has(code)) code = randomCode();
      const adminToken = token();
      groups.set(code, {
        name,
        members: [{ nickname, role: 'admin', token: adminToken }],
        files: [],
        createdAt: Date.now(),
        adminToken,
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          code,
          name,
          group_id: code,
          admin_token: adminToken,
          expires_at: Date.now() + GROUP_TTL_MS,
        }),
      );
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  if (url === '/api/groups/join' && req.method === 'POST') {
    try {
      const body = await readBody(req);
      const code = String(body.code || '').replace(/\D/g, '').slice(0, 6);
      const nickname = String(body.nickname || 'Gäst').trim().slice(0, 40) || 'Gäst';
      const g = groups.get(code);
      if (!g || code.length !== 6) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Gruppen finns inte (eller har gått ut)' }));
        return;
      }
      const memberToken = token();
      g.members.push({ nickname, role: 'member', token: memberToken });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          code,
          name: g.name,
          group_id: code,
          member_token: memberToken,
          members: g.members.map((m) => ({ nickname: m.nickname, role: m.role })),
          files: g.files.slice(-50),
        }),
      );
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: String(e.message || e) }));
    }
    return;
  }

  if (url.startsWith('/api/groups/') && req.method === 'GET') {
    const code = url.split('/').pop().replace(/\D/g, '').slice(0, 6);
    const g = groups.get(code);
    if (!g) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
      return;
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        code,
        name: g.name,
        members: g.members.map((m) => ({ nickname: m.nickname, role: m.role })),
        files: g.files.slice(-50),
      }),
    );
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('FredCast Relay v3.1');
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  let code = null;
  let role = null;

  ws.isAlive = true;
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }

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
      const g = groups.get(code);
      ws.send(
        JSON.stringify({
          type: 'joined',
          code,
          role,
          group: g ? { name: g.name, members: g.members.length } : null,
        }),
      );
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

    // Optional: track group file uploads metadata
    if (msg.type === 'media' && code && groups.has(code) && msg.item) {
      const g = groups.get(code);
      g.files.push({
        name: msg.item.name,
        kind: msg.item.kind,
        at: Date.now(),
        by: msg.nickname || null,
      });
      if (g.files.length > 200) g.files = g.files.slice(-100);
    }

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
  });
});

const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    try {
      ws.ping();
    } catch {
      /* ignore */
    }
  });
}, PING_INTERVAL);

wss.on('close', () => clearInterval(interval));

server.listen(PORT, () => {
  console.log(`FredCast Relay v3.1 on :${PORT}`);
});
