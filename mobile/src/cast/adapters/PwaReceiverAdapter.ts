import { CastAdapter, CastDevice, MediaItem, PlaybackCommand } from '../types';

const STORAGE_KEY = 'fredcast_session_v3';
const HEARTBEAT_MS = 10000;
const RECONNECT_MS = 2500;

type StoredSession = { code: string; deviceId: string; savedAt: number };

export class PwaReceiverAdapter implements CastAdapter {
  readonly protocol = 'pwa-receiver' as const;

  private relayUrl: string;
  private onChange: ((devices: CastDevice[]) => void) | null = null;
  private devices = new Map<string, CastDevice>();
  private sockets = new Map<string, WebSocket>();
  private messageListeners = new Map<string, Set<(msg: Record<string, unknown>) => void>>();
  private heartbeats = new Map<string, ReturnType<typeof setInterval>>();
  private reconnectTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private intentionalClose = new Set<string>();
  private codes = new Map<string, string>();

  constructor(relayUrl: string) {
    this.relayUrl = relayUrl;
  }

  startDiscovery(onChange: (devices: CastDevice[]) => void): () => void {
    this.onChange = onChange;
    onChange(Array.from(this.devices.values()));
    setTimeout(() => this.restoreSession(), 0);
    return () => {
      this.onChange = null;
    };
  }

  private storageGet(): StoredSession | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw) as StoredSession;
      if (!s?.code || Date.now() - s.savedAt > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      return s;
    } catch {
      return null;
    }
  }

  private storageSet(code: string, deviceId: string) {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, deviceId, savedAt: Date.now() }));
    } catch {
      /* ignore */
    }
  }

  private storageClear() {
    try {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  private restoreSession() {
    const s = this.storageGet();
    if (!s) return;
    this.pairWithCode(s.code).catch(() => undefined);
  }

  pairWithCode(code: string): Promise<CastDevice> {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) return Promise.reject(new Error('Koden måste vara 6 siffror.'));
    const deviceId = `pwa-${digits}`;
    this.intentionalClose.delete(deviceId);
    this.clearReconnect(deviceId);
    this.clearHeartbeat(deviceId);
    const existing = this.sockets.get(deviceId);
    if (existing) {
      this.intentionalClose.add(deviceId);
      try { existing.close(); } catch { /* ignore */ }
      this.sockets.delete(deviceId);
      this.intentionalClose.delete(deviceId);
    }
    this.codes.set(deviceId, digits);
    return this.openPairSocket(digits, deviceId, 0);
  }

  private openPairSocket(digits: string, deviceId: string, attempt: number): Promise<CastDevice> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.relayUrl);
      let settled = false;
      const timeoutMs = attempt === 0 ? 45000 : 25000;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          try { socket.close(); } catch { /* ignore */ }
          if (attempt === 0) {
            this.openPairSocket(digits, deviceId, 1).then(resolve, reject);
            return;
          }
          reject(new Error('Kunde inte nå FredCast-relayn (den kan ha sovit). Vänta 10 sek och försök igen med samma kod.'));
        }
      }, timeoutMs);

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'join', code: digits, role: 'sender' }));
      };

      socket.onmessage = (event) => {
        let msg: Record<string, unknown>;
        try { msg = JSON.parse(String(event.data)); } catch { return; }

        if (msg.type === 'joined' && !settled) {
          settled = true;
          clearTimeout(timeout);
          this.sockets.set(deviceId, socket);
          this.storageSet(digits, deviceId);
          this.startHeartbeat(deviceId);
          const device: CastDevice = {
            id: deviceId,
            name: `Skärm (kod ${digits.slice(0, 3)} ${digits.slice(3)})`,
            room: 'Ansluten via kod',
            type: 'tv',
            status: 'connecting',
            protocol: 'pwa-receiver',
            isFavorite: false,
          };
          this.devices.set(deviceId, device);
          this.emit();
          resolve(device);
        }

        if (msg.type === 'peer-status') {
          const device = this.devices.get(deviceId);
          if (device) {
            this.devices.set(deviceId, { ...device, status: msg.connected ? 'ready' : 'connecting' });
            this.emit();
          }
        }

        this.messageListeners.get(deviceId)?.forEach((listener) => listener(msg));
      };

      socket.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          if (attempt === 0) {
            this.openPairSocket(digits, deviceId, 1).then(resolve, reject);
            return;
          }
          reject(new Error('Kunde inte ansluta till relayn.'));
        }
      };

      socket.onclose = () => {
        this.clearHeartbeat(deviceId);
        this.sockets.delete(deviceId);
        if (!settled) return;
        const device = this.devices.get(deviceId);
        if (device) {
          this.devices.set(deviceId, { ...device, status: 'connecting' });
          this.emit();
        }
        if (!this.intentionalClose.has(deviceId)) this.scheduleReconnect(deviceId, digits);
      };
    });
  }

  private startHeartbeat(deviceId: string) {
    this.clearHeartbeat(deviceId);
    const id = setInterval(() => {
      try {
        const s = this.sockets.get(deviceId);
        if (s && s.readyState === s.OPEN) s.send(JSON.stringify({ type: 'ping' }));
      } catch { /* ignore */ }
    }, HEARTBEAT_MS);
    this.heartbeats.set(deviceId, id);
  }

  private clearHeartbeat(deviceId: string) {
    const id = this.heartbeats.get(deviceId);
    if (id) clearInterval(id);
    this.heartbeats.delete(deviceId);
  }

  private scheduleReconnect(deviceId: string, digits: string) {
    this.clearReconnect(deviceId);
    const t = setTimeout(() => {
      this.reconnectTimers.delete(deviceId);
      this.openPairSocket(digits, deviceId, 0).catch(() => this.scheduleReconnect(deviceId, digits));
    }, RECONNECT_MS);
    this.reconnectTimers.set(deviceId, t);
  }

  private clearReconnect(deviceId: string) {
    const t = this.reconnectTimers.get(deviceId);
    if (t) clearTimeout(t);
    this.reconnectTimers.delete(deviceId);
  }

  private emit() {
    this.onChange?.(Array.from(this.devices.values()));
  }

  private socketFor(deviceId: string): WebSocket {
    const socket = this.sockets.get(deviceId);
    if (!socket || socket.readyState !== socket.OPEN) {
      throw new Error('Anslutningen till skärmen är inte klar — återansluter…');
    }
    return socket;
  }

  private async ensureSocket(deviceId: string): Promise<WebSocket> {
    const existing = this.sockets.get(deviceId);
    if (existing && existing.readyState === existing.OPEN) return existing;
    const code = this.codes.get(deviceId) || deviceId.replace(/^pwa-/, '');
    if (code.length === 6) await this.openPairSocket(code, deviceId, 0);
    return this.socketFor(deviceId);
  }

  async connect(_deviceId: string): Promise<void> {}

  async sendMedia(deviceId: string, item: MediaItem): Promise<void> {
    const socket = await this.ensureSocket(deviceId);
    if (item.uri?.startsWith('data:') && item.uri.length > 6_000_000) {
      throw new Error('Filen är för stor att casta via relay (max ~4 MB). Välj en mindre fil.');
    }
    socket.send(JSON.stringify({ type: 'media', item }));
  }

  async control(deviceId: string, command: PlaybackCommand, value?: number): Promise<void> {
    const socket = await this.ensureSocket(deviceId);
    socket.send(JSON.stringify({ type: 'control', command, value }));
  }

  async disconnect(deviceId: string): Promise<void> {
    this.intentionalClose.add(deviceId);
    this.clearReconnect(deviceId);
    this.clearHeartbeat(deviceId);
    this.storageClear();
    try { this.sockets.get(deviceId)?.close(); } catch { /* ignore */ }
    this.sockets.delete(deviceId);
    this.devices.delete(deviceId);
    this.messageListeners.delete(deviceId);
    this.codes.delete(deviceId);
    this.emit();
  }

  /** Fire-and-forget signalling (WebRTC). Auto-reconnects if socket dropped mid-heartbeat. */
  sendRaw(deviceId: string, msg: Record<string, unknown>): void {
    const trySend = (socket: WebSocket) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(msg));
        return true;
      }
      return false;
    };
    const existing = this.sockets.get(deviceId);
    if (existing && trySend(existing)) return;
    void this.ensureSocket(deviceId)
      .then((s) => { trySend(s); })
      .catch(() => { /* live surfaces timeout if offer never lands */ });
  }

  onMessage(deviceId: string, listener: (msg: Record<string, unknown>) => void): () => void {
    const set = this.messageListeners.get(deviceId) ?? new Set();
    set.add(listener);
    this.messageListeners.set(deviceId, set);
    return () => set.delete(listener);
  }
}
