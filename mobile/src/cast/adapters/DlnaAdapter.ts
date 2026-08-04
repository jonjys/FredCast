import { CastAdapter, CastDevice, MediaItem, PlaybackCommand } from '../types';

/**
 * TODO(v1 real-device milestone): implement SSDP M-SEARCH discovery over UDP
 * multicast (239.255.255.250:1900) plus a DIDL-Lite/AVTransport control-point
 * client for DLNA media renderers (see PRODUCT_PLAN.md §8–9). UDP sockets
 * require a native module (e.g. react-native-udp) — not available in Expo Go.
 *
 * `sendMedia` also needs the embedded local HTTP server described in §8 so
 * the renderer can pull the file by URL — local files aren't otherwise
 * reachable by a DLNA device.
 */
export class DlnaAdapter implements CastAdapter {
  readonly protocol = 'dlna' as const;

  startDiscovery(_onChange: (devices: CastDevice[]) => void): () => void {
    throw new Error('DlnaAdapter requires native UDP sockets — not available in Expo Go.');
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
