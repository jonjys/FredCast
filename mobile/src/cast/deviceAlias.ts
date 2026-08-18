import { CastDevice } from './types';

export const ALIAS_STORAGE_KEY = 'fredcast_device_alias_v3';

export type DeviceAlias = {
  name?: string;
  room?: string;
};

export type AliasMap = Record<string, DeviceAlias>;

export function loadAliases(): AliasMap {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(ALIAS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as AliasMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAlias(deviceId: string, alias: DeviceAlias): AliasMap {
  const next = { ...loadAliases(), [deviceId]: { ...loadAliases()[deviceId], ...alias } };
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(ALIAS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function applyDeviceAlias(device: CastDevice, aliases: AliasMap): CastDevice {
  const alias = aliases[device.id];
  if (!alias) return device;
  return {
    ...device,
    name: alias.name?.trim() || device.name,
    room: alias.room?.trim() || device.room,
  };
}
