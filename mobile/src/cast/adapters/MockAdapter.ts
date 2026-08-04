import { CastAdapter, CastDevice, MediaItem, PlaybackCommand } from '../types';

/**
 * Simulates mDNS/SSDP discovery arriving over a couple of seconds, staggered,
 * so the UI (radar animation, staggered card entrance) can be built and
 * tested without physical Chromecast/DLNA hardware. Swap for
 * GoogleCastAdapter/DlnaAdapter (see sibling files) once native modules are
 * wired in — CastEngine composes adapters, so no UI change is required.
 */
export class MockAdapter implements CastAdapter {
  readonly protocol = 'mock' as const;

  private readonly seedDevices: CastDevice[] = [
    { id: 'sony-bravia', name: 'Sony BRAVIA', room: 'Vardagsrum', type: 'tv', status: 'ready', protocol: 'mock', isFavorite: true },
    { id: 'sonos-arc', name: 'Sonos Arc', room: 'Vardagsrum', type: 'speaker', status: 'ready', protocol: 'mock', isFavorite: false },
    { id: 'chromecast-gtv', name: 'Chromecast med Google TV', room: 'Sovrum', type: 'tv', status: 'ready', protocol: 'mock', isFavorite: false },
    { id: 'fredriks-macbook', name: 'Fredriks MacBook', room: 'Andra skärmar', type: 'laptop', status: 'connecting', protocol: 'mock', isFavorite: false },
  ];

  startDiscovery(onChange: (devices: CastDevice[]) => void): () => void {
    const found: CastDevice[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];

    onChange([]);

    this.seedDevices.forEach((device, i) => {
      const timer = setTimeout(() => {
        found.push(device);
        onChange([...found]);

        if (device.status === 'connecting') {
          const settleTimer = setTimeout(() => {
            const idx = found.findIndex((d) => d.id === device.id);
            if (idx >= 0) {
              found[idx] = { ...found[idx], status: 'ready' };
              onChange([...found]);
            }
          }, 1800);
          timers.push(settleTimer);
        }
      }, 350 + i * 260);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }

  async connect(_deviceId: string): Promise<void> {
    await delay(900);
  }

  async sendMedia(_deviceId: string, item: MediaItem): Promise<void> {
    await delay(item.kind === 'video' ? 1400 : 700);
  }

  async control(_deviceId: string, _command: PlaybackCommand, _value?: number): Promise<void> {
    await delay(120);
  }

  async disconnect(_deviceId: string): Promise<void> {
    await delay(150);
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
