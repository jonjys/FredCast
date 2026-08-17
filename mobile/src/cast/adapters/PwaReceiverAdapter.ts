import { CastAdapter, CastDevice, MediaItem, PlaybackCommand } from '../types';

/**
 * The universal fallback adapter (PRODUCT_PLAN.md §8-9, MVP_BACKLOG.md Epic
 * 1 P1 & Epic 7) — pairs with a FredCast Receiver page (any browser: Smart
 * TV, Fire TV Silk, a laptop) via a short code, then sends media/control
 * commands over a plain WebSocket relay.
 *
 * Render free-tier relay can take 30–50s to wake after idle — pair timeout
 * is intentionally long and surfaces that in the error message.
 */
export class PwaReceiverAdapter implements CastAdapter {
  readonly protocol = 'pwa-receiver' as const;

  private relayUrl: string;
  private onChange: ((devices: CastDevice[]) => void) | null = null;
  private devices = new Map<string, CastDevice>();
  private sockets = new Map<string, WebSocket>();
  /** Raw socket message listeners, keyed by device — used for WebRTC signalling. */
  private messageListeners = new Map<string, Set<(msg: Record<string, unknown>) => void>>();

  constructor(relayUrl: string) {
    this.relayUrl = relayUrl;
  }

  startDiscovery(onChange: (devices: CastDevice[]) => void): () => void {
    this.onChange = onChange;
    onChange(Array.from(this.devices.values()));
    return () => {
      this.onChange = null;
    };
  }

  /**
   * Pair with a receiver by the 6-digit code shown on its screen.
   * Resolves once the relay confirms we joined the room. Peer readiness
   * arrives later as peer-status and flips status connecting → ready.
   */
  pairWithCode(code: string): Promise<CastDevice> {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) {
      return Promise.reject(new Error('Koden måste vara 6 siffror.'));
    }

    // Re-pairing the same code: drop the old socket first so we don't leak.
    const deviceId = `pwa-${digits}`;
    const existing = this.sockets.get(deviceId);
    if (existing) {
      try {
        existing.close();
      } catch {
        /* ignore */
      }
      this.sockets.delete(deviceId);
      this.messageListeners.delete(deviceId);
    }

    return this.openPairSocket(digits, deviceId, 0);
  }

  private openPairSocket(digits: string, deviceId: string, attempt: number): Promise<CastDevice> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(this.relayUrl);
      let settled = false;

      // Render free tier cold start ≈ 30–50s; give it room, then one retry.
      const timeoutMs = attempt === 0 ? 45000 : 25000;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          try {
            socket.close();
          } catch {
            /* ignore */
          }
          if (attempt === 0) {
            // One automatic retry — first attempt often just wakes the relay.
            this.openPairSocket(digits, deviceId, 1).then(resolve, reject);
            return;
          }
          reject(
            new Error(
              'Kunde inte nå FredCast-relayn (den kan ha sovit). Vänta 10 sek och försök igen med samma kod.',
            ),
          );
        }
      }, timeoutMs);

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'join', code: digits, role: 'sender' }));
      };

      socket.onmessage = (event) => {
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(String(event.data));
        } catch {
          return;
        }

        if (msg.type === 'joined' && !settled) {
          settled = true;
          clearTimeout(timeout);
          this.sockets.set(deviceId, socket);
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
            this.devices.set(deviceId, {
              ...device,
              status: msg.connected ? 'ready' : 'connecting',
            });
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
        if (!settled) {
          // Closed before join — treat as error path (timeout/retry handles it).
          return;
        }
        const device = this.devices.get(deviceId);
        if (device) {
          this.devices.set(deviceId, { ...device, status: 'unavailable' });
          this.emit();
        }
        this.sockets.delete(deviceId);
      };
    });
  }

  private emit() {
    this.onChange?.(Array.from(this.devices.values()));
  }

  private socketFor(deviceId: string): WebSocket {
    const socket = this.sockets.get(deviceId);
    if (!socket || socket.readyState !== socket.OPEN) {
      throw new Error('Anslutningen till skärmen är inte klar.');
    }
    return socket;
  }

  async connect(_deviceId: string): Promise<void> {
    // Pairing already establishes the connection in pairWithCode().
  }

  async sendMedia(deviceId: string, item: MediaItem): Promise<void> {
    this.socketFor(deviceId).send(JSON.stringify({ type: 'media', item }));
  }

  async control(deviceId: string, command: PlaybackCommand, value?: number): Promise<void> {
    this.socketFor(deviceId).send(JSON.stringify({ type: 'control', command, value }));
  }

  async disconnect(deviceId: string): Promise<void> {
    const socket = this.sockets.get(deviceId);
    try {
      socket?.close();
    } catch {
      /* ignore */
    }
    this.sockets.delete(deviceId);
    this.devices.delete(deviceId);
    this.messageListeners.delete(deviceId);
    this.emit();
  }

  sendRaw(deviceId: string, msg: Record<string, unknown>): void {
    this.socketFor(deviceId).send(JSON.stringify(msg));
  }

  onMessage(deviceId: string, listener: (msg: Record<string, unknown>) => void): () => void {
    const set = this.messageListeners.get(deviceId) ?? new Set();
    set.add(listener);
    this.messageListeners.set(deviceId, set);
    return () => set.delete(listener);
  }
}
