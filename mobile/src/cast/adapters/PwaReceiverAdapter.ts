import { CastAdapter, CastDevice, MediaItem, PlaybackCommand } from '../types';

/**
 * The universal fallback adapter (PRODUCT_PLAN.md §8-9, MVP_BACKLOG.md Epic
 * 1 P1 & Epic 7) — pairs with a FredCast Receiver page (any browser: Smart
 * TV, Fire TV Silk, a laptop) via a short code, then sends media/control
 * commands over a plain WebSocket relay. Unlike Cast/DLNA discovery, this
 * adapter never finds devices passively — the user reads a code off the
 * screen and types it in, so devices only appear after `pairWithCode`
 * succeeds. That's why `startDiscovery` just registers the change listener
 * and emits whatever's already paired, rather than scanning anything.
 *
 * No native module dependency (plain WebSocket, available in RN and the
 * browser alike) — this is why it's the first adapter implemented for real
 * rather than left as a stub like GoogleCastAdapter/DlnaAdapter.
 */
export class PwaReceiverAdapter implements CastAdapter {
  readonly protocol = 'pwa-receiver' as const;

  private relayUrl: string;
  private onChange: ((devices: CastDevice[]) => void) | null = null;
  private devices = new Map<string, CastDevice>();
  private sockets = new Map<string, WebSocket>();

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
   * Pair with a receiver by the 6-digit code shown on its screen. Resolves
   * once the relay confirms our side has joined the room (not once the TV
   * has actually opened it — that arrives later as a peer-status message
   * and flips the device from "connecting" to "ready").
   */
  pairWithCode(code: string): Promise<CastDevice> {
    return new Promise((resolve, reject) => {
      const deviceId = `pwa-${code}`;
      const socket = new WebSocket(this.relayUrl);
      let settled = false;

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          socket.close();
          reject(new Error('Kunde inte nå FredCast-relayn. Kontrollera koden och din anslutning.'));
        }
      }, 8000);

      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'join', code, role: 'sender' }));
      };

      socket.onmessage = (event) => {
        const msg = JSON.parse(String(event.data));

        if (msg.type === 'joined' && !settled) {
          settled = true;
          clearTimeout(timeout);
          this.sockets.set(deviceId, socket);
          const device: CastDevice = {
            id: deviceId,
            name: `Skärm (kod ${code.slice(0, 3)} ${code.slice(3)})`,
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
      };

      socket.onerror = () => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          reject(new Error('Kunde inte ansluta till relayn.'));
        }
      };

      socket.onclose = () => {
        const device = this.devices.get(deviceId);
        if (device) {
          this.devices.set(deviceId, { ...device, status: 'unavailable' });
          this.emit();
        }
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
    // Pairing already establishes the connection in pairWithCode(); nothing
    // further to do once the device exists in our map.
  }

  async sendMedia(deviceId: string, item: MediaItem): Promise<void> {
    this.socketFor(deviceId).send(JSON.stringify({ type: 'media', item }));
  }

  async control(deviceId: string, command: PlaybackCommand, value?: number): Promise<void> {
    this.socketFor(deviceId).send(JSON.stringify({ type: 'control', command, value }));
  }

  async disconnect(deviceId: string): Promise<void> {
    const socket = this.sockets.get(deviceId);
    socket?.close();
    this.sockets.delete(deviceId);
    this.devices.delete(deviceId);
    this.emit();
  }
}
