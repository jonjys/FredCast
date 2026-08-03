import { CastAdapter, CastDevice } from './types';

/**
 * Composite cast-motor (PRODUCT_PLAN.md §8, MVP_BACKLOG.md Epic 1). Merges
 * devices from every registered adapter into one deduplicated list and
 * routes connect/sendMedia/control/disconnect to whichever adapter actually
 * owns the device. UI never imports an adapter directly.
 */
export class CastEngine {
  private readonly adapters: Map<string, CastAdapter> = new Map();
  private readonly devicesByProtocol: Map<string, CastDevice[]> = new Map();
  private readonly listeners = new Set<(devices: CastDevice[]) => void>();
  private readonly stopFns: Array<() => void> = [];
  private started = false;

  constructor(adapters: CastAdapter[]) {
    adapters.forEach((a) => this.adapters.set(a.protocol, a));
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.adapters.forEach((adapter) => {
      const stop = adapter.startDiscovery((devices) => {
        this.devicesByProtocol.set(adapter.protocol, devices);
        this.emit();
      });
      this.stopFns.push(stop);
    });
  }

  stop(): void {
    this.stopFns.forEach((fn) => fn());
    this.stopFns.length = 0;
    this.started = false;
  }

  subscribe(listener: (devices: CastDevice[]) => void): () => void {
    this.listeners.add(listener);
    listener(this.getDevices());
    return () => this.listeners.delete(listener);
  }

  getDevices(): CastDevice[] {
    return dedupe(Array.from(this.devicesByProtocol.values()).flat());
  }

  private emit() {
    const merged = this.getDevices();
    this.listeners.forEach((l) => l(merged));
  }

  private adapterFor(device: CastDevice): CastAdapter {
    const adapter = this.adapters.get(device.protocol);
    if (!adapter) throw new Error(`No adapter registered for protocol "${device.protocol}"`);
    return adapter;
  }

  private findDevice(deviceId: string): CastDevice {
    const device = this.getDevices().find((d) => d.id === deviceId);
    if (!device) throw new Error(`Unknown device "${deviceId}"`);
    return device;
  }

  async connect(deviceId: string) {
    const device = this.findDevice(deviceId);
    await this.adapterFor(device).connect(deviceId);
  }

  async sendMedia(deviceId: string, item: Parameters<CastAdapter['sendMedia']>[1]) {
    const device = this.findDevice(deviceId);
    await this.adapterFor(device).sendMedia(deviceId, item);
  }

  async control(deviceId: string, command: Parameters<CastAdapter['control']>[1], value?: number) {
    const device = this.findDevice(deviceId);
    await this.adapterFor(device).control(deviceId, command, value);
  }

  async disconnect(deviceId: string) {
    const device = this.findDevice(deviceId);
    await this.adapterFor(device).disconnect(deviceId);
  }
}

/**
 * Same physical TV can be surfaced by more than one adapter (e.g. Cast +
 * DLNA). Collapse by name+room so it shows as one card (§5). Prefers the
 * device instance from whichever protocol was seen first — good enough
 * until real adapters expose stronger identifiers (MAC/UDN) to key on.
 */
function dedupe(devices: CastDevice[]): CastDevice[] {
  const seen = new Map<string, CastDevice>();
  for (const device of devices) {
    const key = `${device.room}::${device.name}`.toLowerCase();
    if (!seen.has(key)) seen.set(key, device);
  }
  return Array.from(seen.values());
}
