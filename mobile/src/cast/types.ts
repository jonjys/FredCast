/**
 * Cast-motor — the unified internal interface described in PRODUCT_PLAN.md §8
 * and MVP_BACKLOG.md Epic 1. UI code talks only to `CastEngine`; it never
 * knows which protocol (Cast/DLNA/AirPlay/PWA receiver) is actually in use.
 */

export type DeviceType = 'tv' | 'speaker' | 'laptop';

export type DeviceStatus = 'ready' | 'connecting' | 'busy' | 'unavailable';

/** Which underlying adapter surfaced this device. Never shown in primary UI (§5). */
export type Protocol = 'cast' | 'dlna' | 'pwa-receiver' | 'mock';

export interface CastDevice {
  id: string;
  name: string;
  /** Room grouping — manual name > device friendly-name > "Andra skärmar". */
  room: string;
  type: DeviceType;
  status: DeviceStatus;
  protocol: Protocol;
  isFavorite: boolean;
}

export type MediaKind = 'image' | 'video' | 'file' | 'link';

export interface MediaItem {
  id: string;
  kind: MediaKind;
  name: string;
  uri: string;
  sizeLabel?: string;
  durationMs?: number;
}

export type PlaybackCommand = 'play' | 'pause' | 'next' | 'previous' | 'seek';

export interface PlaybackState {
  device: CastDevice;
  item: MediaItem;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
}

/** One protocol implementation. Adapters are combined by CastEngine (composite). */
export interface CastAdapter {
  readonly protocol: Protocol;
  /** Start scanning; call onChange whenever the discovered device set changes. */
  startDiscovery(onChange: (devices: CastDevice[]) => void): () => void;
  connect(deviceId: string): Promise<void>;
  sendMedia(deviceId: string, item: MediaItem): Promise<void>;
  control(deviceId: string, command: PlaybackCommand, value?: number): Promise<void>;
  disconnect(deviceId: string): Promise<void>;
}
