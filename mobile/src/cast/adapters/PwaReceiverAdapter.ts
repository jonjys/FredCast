import { CastAdapter, CastDevice, MediaItem, PlaybackCommand } from '../types';

/**
 * TODO(v1 real-device milestone): the universal fallback adapter (§8–9,
 * MVP_BACKLOG.md Epic 1 P1 & Epic 7). Two ways in:
 *  1. The receiver PWA announces itself via mDNS while its tab is open
 *     (same discovery path as Cast/DLNA, different service name).
 *  2. QR/short-code pairing via a relay server (WebSocket/WebRTC signalling)
 *     for when sender and receiver aren't on the same subnet — the #1
 *     real-world casting failure mode (§9).
 *
 * Once paired, `sendMedia`/`control` go over a plain WebSocket to the
 * open receiver tab — this is the one adapter with no native SDK
 * dependency, so it's the first candidate to implement for real.
 */
export class PwaReceiverAdapter implements CastAdapter {
  readonly protocol = 'pwa-receiver' as const;

  startDiscovery(_onChange: (devices: CastDevice[]) => void): () => void {
    throw new Error('Not implemented yet — pair via QR/code flow, not passive discovery.');
  }

  async connect(_deviceId: string): Promise<void> {
    throw new Error('Not implemented — see TODO at top of file.');
  }

  async sendMedia(_deviceId: string, _item: MediaItem): Promise<void> {
    throw new Error('Not implemented — see TODO at top of file.');
  }

  async control(_deviceId: string, _command: PlaybackCommand, _value?: number): Promise<void> {
    throw new Error('Not implemented — see TODO at top of file.');
  }

  async disconnect(_deviceId: string): Promise<void> {
    throw new Error('Not implemented — see TODO at top of file.');
  }
}
