import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CastEngine } from './CastEngine';
import { MockAdapter } from './adapters/MockAdapter';
import { PwaReceiverAdapter } from './adapters/PwaReceiverAdapter';
import { RELAY_WS_URL } from './config';
import { CastDevice, MediaItem, PlaybackState } from './types';

export interface DeviceGroup {
  room: string;
  devices: CastDevice[];
}

export interface HistoryEntry {
  id: string;
  item: MediaItem;
  device: CastDevice;
  castAt: number;
}

interface CastContextValue {
  devices: CastDevice[];
  /** Favorites pinned as their own group, then the rest grouped by room (PRODUCT_PLAN.md §5). */
  groupedDevices: DeviceGroup[];
  connectedDevice: CastDevice | null;
  connecting: boolean;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  toggleFavorite: (deviceId: string) => void;
  cast: (item: MediaItem, deviceId?: string) => Promise<void>;
  pairWithCode: (code: string) => Promise<void>;
  pairing: boolean;
  sending: boolean;
  playback: PlaybackState | null;
  controlPlayback: (command: 'play' | 'pause' | 'next' | 'previous') => void;
  history: HistoryEntry[];
  lastError: string | null;
}

const CastContext = createContext<CastContextValue | null>(null);

// Single engine instance for the app's lifetime. Registering a real
// GoogleCastAdapter/DlnaAdapter later requires no changes below — see
// MVP_BACKLOG.md Epic 1.
const pwaReceiverAdapter = new PwaReceiverAdapter(RELAY_WS_URL);
const engine = new CastEngine([new MockAdapter(), pwaReceiverAdapter]);

export function CastProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<CastDevice[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [sending, setSending] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks which device ids have already had their adapter-reported
  // isFavorite applied as a default, so a later status-only update (e.g.
  // "connecting" -> "ready") never clobbers a favorite the user toggled off.
  const defaultsAppliedTo = useRef<Set<string>>(new Set());

  useEffect(() => {
    engine.start();
    const unsubscribe = engine.subscribe((next) => {
      setDevices(next);
      setFavoriteIds((prev) => {
        let changed = false;
        const merged = new Set(prev);
        next.forEach((d) => {
          if (!defaultsAppliedTo.current.has(d.id)) {
            defaultsAppliedTo.current.add(d.id);
            if (d.isFavorite) {
              merged.add(d.id);
              changed = true;
            }
          }
        });
        return changed ? merged : prev;
      });
    });
    return () => {
      unsubscribe();
      engine.stop();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const decoratedDevices = useMemo<CastDevice[]>(
    () => devices.map((d) => ({ ...d, isFavorite: favoriteIds.has(d.id) })),
    [devices, favoriteIds],
  );

  const groupedDevices = useMemo<DeviceGroup[]>(() => {
    const favorites = decoratedDevices.filter((d) => d.isFavorite);
    const rest = decoratedDevices.filter((d) => !d.isFavorite);

    const byRoom = new Map<string, CastDevice[]>();
    rest.forEach((d) => {
      const list = byRoom.get(d.room) ?? [];
      list.push(d);
      byRoom.set(d.room, list);
    });

    const groups: DeviceGroup[] = [];
    if (favorites.length) groups.push({ room: 'Favoriter', devices: favorites });
    byRoom.forEach((list, room) => groups.push({ room, devices: list }));
    return groups;
  }, [decoratedDevices]);

  const connectedDevice = useMemo(
    () => decoratedDevices.find((d) => d.id === connectedDeviceId) ?? null,
    [decoratedDevices, connectedDeviceId],
  );

  const connect = useCallback(async (deviceId: string) => {
    setLastError(null);
    setConnecting(true);
    try {
      await engine.connect(deviceId);
      setConnectedDeviceId(deviceId);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Kunde inte ansluta.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (!connectedDeviceId) return;
    await engine.disconnect(connectedDeviceId);
    setConnectedDeviceId(null);
    setPlayback(null);
    if (tickRef.current) clearInterval(tickRef.current);
  }, [connectedDeviceId]);

  const pairWithCode = useCallback(async (code: string) => {
    setLastError(null);
    setPairing(true);
    try {
      const device = await pwaReceiverAdapter.pairWithCode(code);
      setConnectedDeviceId(device.id);
    } catch (e) {
      setLastError(e instanceof Error ? e.message : 'Kunde inte ansluta med koden.');
      throw e;
    } finally {
      setPairing(false);
    }
  }, []);

  const toggleFavorite = useCallback((deviceId: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(deviceId)) next.delete(deviceId);
      else next.add(deviceId);
      return next;
    });
  }, []);

  const cast = useCallback(
    async (item: MediaItem, deviceId?: string) => {
      const targetId = deviceId ?? connectedDeviceId;
      if (!targetId) {
        setLastError('Ingen skärm vald.');
        return;
      }
      setLastError(null);
      setSending(true);
      try {
        if (targetId !== connectedDeviceId) {
          await engine.connect(targetId);
          setConnectedDeviceId(targetId);
        }
        await engine.sendMedia(targetId, item);

        const device = decoratedDevices.find((d) => d.id === targetId);
        if (!device) throw new Error('Skärmen försvann under sändning.');

        const durationMs = item.durationMs ?? (item.kind === 'video' ? 102000 : 0);
        setPlayback({ device, item, isPlaying: true, positionMs: 0, durationMs });
        setHistory((prev) => [{ id: `${Date.now()}`, item, device, castAt: Date.now() }, ...prev].slice(0, 20));

        if (tickRef.current) clearInterval(tickRef.current);
        if (durationMs > 0) {
          tickRef.current = setInterval(() => {
            setPlayback((p) => {
              if (!p || !p.isPlaying) return p;
              const positionMs = Math.min(p.positionMs + 1000, p.durationMs);
              return { ...p, positionMs };
            });
          }, 1000);
        }
      } catch (e) {
        setLastError(e instanceof Error ? e.message : 'Kunde inte nå skärmen just nu.');
      } finally {
        setSending(false);
      }
    },
    [connectedDeviceId, decoratedDevices],
  );

  const controlPlayback = useCallback(
    (command: 'play' | 'pause' | 'next' | 'previous') => {
      if (!connectedDeviceId) return;
      engine.control(connectedDeviceId, command).catch(() => undefined);
      if (command === 'play' || command === 'pause') {
        setPlayback((p) => (p ? { ...p, isPlaying: command === 'play' } : p));
      }
    },
    [connectedDeviceId],
  );

  const value: CastContextValue = {
    devices: decoratedDevices,
    groupedDevices,
    connectedDevice,
    connecting,
    connect,
    disconnect,
    toggleFavorite,
    cast,
    pairWithCode,
    pairing,
    sending,
    playback,
    controlPlayback,
    history,
    lastError,
  };

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}

export function useCast(): CastContextValue {
  const ctx = useContext(CastContext);
  if (!ctx) throw new Error('useCast must be used within a CastProvider');
  return ctx;
}
