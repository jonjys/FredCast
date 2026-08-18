import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CastEngine } from './CastEngine';
import { MockAdapter } from './adapters/MockAdapter';
import { PwaReceiverAdapter } from './adapters/PwaReceiverAdapter';
import { RELAY_WS_URL } from './config';
import { applyDeviceAlias, loadAliases, saveAlias, AliasMap } from './deviceAlias';
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

export interface QueueEntry {
  id: string;
  item: MediaItem;
  addedAt: number;
}

export type CastOptions = { force?: boolean };

interface CastContextValue {
  devices: CastDevice[];
  groupedDevices: DeviceGroup[];
  connectedDevice: CastDevice | null;
  connecting: boolean;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  toggleFavorite: (deviceId: string) => void;
  renameDevice: (deviceId: string, alias: { name?: string; room?: string }) => void;
  cast: (item: MediaItem, deviceId?: string, opts?: CastOptions) => Promise<void>;
  pairWithCode: (code: string) => Promise<void>;
  pairing: boolean;
  sending: boolean;
  playback: PlaybackState | null;
  controlPlayback: (command: 'play' | 'pause' | 'next' | 'previous') => void;
  history: HistoryEntry[];
  lastError: string | null;
  queue: QueueEntry[];
  enqueue: (item: MediaItem) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: () => void;
  playNextFromQueue: () => Promise<void>;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
}

const CastContext = createContext<CastContextValue | null>(null);

export const pwaReceiverAdapter = new PwaReceiverAdapter(RELAY_WS_URL);
const engine = new CastEngine([new MockAdapter(), pwaReceiverAdapter]);

export function CastProvider({ children }: { children: React.ReactNode }) {
  const [devices, setDevices] = useState<CastDevice[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [aliases, setAliases] = useState<AliasMap>(() => loadAliases());
  const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [pairing, setPairing] = useState(false);
  const [sending, setSending] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastError, setLastError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const defaultsAppliedTo = useRef<Set<string>>(new Set());
  const queueRef = useRef<QueueEntry[]>([]);
  const connectedRef = useRef<string | null>(null);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    connectedRef.current = connectedDeviceId;
  }, [connectedDeviceId]);

  const syncQueueToReceiver = useCallback((entries: QueueEntry[]) => {
    const id = connectedRef.current;
    if (!id) return;
    try {
      pwaReceiverAdapter.sendRaw(id, {
        type: 'queue',
        length: entries.length,
        next: entries[0]
          ? { name: entries[0].item.name, kind: entries[0].item.kind }
          : null,
      });
    } catch {
      /* socket may be reconnecting */
    }
  }, []);

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
    () =>
      devices.map((d) =>
        applyDeviceAlias({ ...d, isFavorite: favoriteIds.has(d.id) }, aliases),
      ),
    [devices, favoriteIds, aliases],
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

  const renameDevice = useCallback((deviceId: string, alias: { name?: string; room?: string }) => {
    setAliases(saveAlias(deviceId, alias));
  }, []);

  const enqueue = useCallback(
    (item: MediaItem) => {
      setQueue((prev) => {
        const next = [
          ...prev,
          { id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, item, addedAt: Date.now() },
        ];
        setTimeout(() => syncQueueToReceiver(next), 0);
        return next;
      });
    },
    [syncQueueToReceiver],
  );

  const cast = useCallback(
    async (item: MediaItem, deviceId?: string, opts?: CastOptions) => {
      const targetId = deviceId ?? connectedDeviceId;
      if (!targetId) {
        setLastError('Ingen skärm vald.');
        return;
      }

      // Auto-enqueue when something is already playing (unless force)
      if (!opts?.force && playback) {
        enqueue(item);
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

        syncQueueToReceiver(queueRef.current);
      } catch (e) {
        setLastError(e instanceof Error ? e.message : 'Kunde inte nå skärmen just nu.');
      } finally {
        setSending(false);
      }
    },
    [connectedDeviceId, decoratedDevices, playback, enqueue, syncQueueToReceiver],
  );

  const removeFromQueue = useCallback(
    (id: string) => {
      setQueue((prev) => {
        const next = prev.filter((q) => q.id !== id);
        setTimeout(() => syncQueueToReceiver(next), 0);
        return next;
      });
    },
    [syncQueueToReceiver],
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
    syncQueueToReceiver([]);
  }, [syncQueueToReceiver]);

  const reorderQueue = useCallback(
    (fromIndex: number, toIndex: number) => {
      setQueue((prev) => {
        if (fromIndex < 0 || fromIndex >= prev.length || toIndex < 0 || toIndex >= prev.length) return prev;
        const next = [...prev];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        setTimeout(() => syncQueueToReceiver(next), 0);
        return next;
      });
    },
    [syncQueueToReceiver],
  );

  const playNextFromQueue = useCallback(async () => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      const [first, ...rest] = prev;
      setTimeout(() => {
        void cast(first.item, undefined, { force: true });
        syncQueueToReceiver(rest);
      }, 0);
      return rest;
    });
  }, [cast, syncQueueToReceiver]);

  const controlPlayback = useCallback(
    (command: 'play' | 'pause' | 'next' | 'previous') => {
      if (!connectedDeviceId) return;
      if (command === 'next') {
        void playNextFromQueue();
        return;
      }
      engine.control(connectedDeviceId, command).catch(() => undefined);
      if (command === 'play' || command === 'pause') {
        setPlayback((p) => (p ? { ...p, isPlaying: command === 'play' } : p));
      }
    },
    [connectedDeviceId, playNextFromQueue],
  );

  const value: CastContextValue = {
    devices: decoratedDevices,
    groupedDevices,
    connectedDevice,
    connecting,
    connect,
    disconnect,
    toggleFavorite,
    renameDevice,
    cast,
    pairWithCode,
    pairing,
    sending,
    playback,
    controlPlayback,
    history,
    lastError,
    queue,
    enqueue,
    removeFromQueue,
    clearQueue,
    playNextFromQueue,
    reorderQueue,
  };

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}

export function useCast(): CastContextValue {
  const ctx = useContext(CastContext);
  if (!ctx) throw new Error('useCast must be used within a CastProvider');
  return ctx;
}
