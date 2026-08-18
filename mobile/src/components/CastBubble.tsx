import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { Icon } from '../icons/Icon';

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function kindLabel(kind: string, queueLen: number): string {
  if (kind === 'image' && queueLen > 0) return 'Bildspel';
  if (kind === 'image') return 'Bild';
  if (kind === 'video') return 'Video';
  if (kind === 'file') return 'Fil';
  if (kind === 'link') return 'Länk';
  return 'Cast';
}

/**
 * Persistent mini-controller on every tab (PRODUCT_PLAN.md §3).
 * Surface #17161D · ready #35D28A · 8pt-grid · soft radius.
 */
export function CastBubble({ onPress, tabBarHeight = 56 }: { onPress: () => void; tabBarHeight?: number }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { playback, connectedDevice, controlPlayback, queue } = useCast();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  if (!connectedDevice && !playback) return null;

  const room = playback?.device.room || connectedDevice?.room || 'Skärm';
  const title = playback?.item.name || 'Redo';
  const kind = playback ? kindLabel(playback.item.kind, queue.length) : 'Ansluten';
  const clock =
    playback && playback.durationMs > 0
      ? `${formatTime(playback.positionMs)} / ${formatTime(playback.durationMs)}`
      : null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: tabBarHeight + Math.max(insets.bottom, 0) }]}
    >
      <View style={[styles.bubble, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
        <Pressable onPress={onPress} style={styles.main} accessibilityRole="button">
          <Animated.View style={[styles.dot, { backgroundColor: t.colors.ready, opacity: pulse }]} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.eyebrow, { color: t.colors.textFaint }]} numberOfLines={1}>
              Nu castas
            </Text>
            <Text style={[styles.line, { color: t.colors.text }]} numberOfLines={1}>
              {title}
              {' — '}
              {kind}
              {' · '}
              {room}
              {clock ? ` · ${clock}` : ''}
            </Text>
          </View>
        </Pressable>
        {playback ? (
          <View style={styles.actions}>
            <Pressable
              onPress={() => controlPlayback(playback.isPlaying ? 'pause' : 'play')}
              hitSlop={10}
              style={[styles.iconBtn, { backgroundColor: t.colors.surface2 }]}
            >
              <Icon name={playback.isPlaying ? 'pause' : 'play'} size={14} color={t.colors.text} />
            </Pressable>
            <Pressable
              onPress={() => controlPlayback('next')}
              hitSlop={10}
              style={[styles.iconBtn, { backgroundColor: t.colors.surface2 }]}
            >
              <Icon name="next" size={14} color={t.colors.text} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export const CAST_BUBBLE_RESERVE = 64;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 8,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  line: { fontSize: 12, fontWeight: '600' },
  dot: { width: 8, height: 8, borderRadius: 4 },
  actions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
