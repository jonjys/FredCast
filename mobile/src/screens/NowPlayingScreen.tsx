import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { Icon } from '../icons/Icon';

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/** Fullskärms uppspelningskontroller — samma vy oavsett protokoll bakom kulisserna (§6). */
export function NowPlayingScreen({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const { playback, controlPlayback } = useCast();

  if (!playback) return null;
  const progress = playback.durationMs > 0 ? playback.positionMs / playback.durationMs : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: t.colors.bg }]}>
        <Pressable onPress={onClose} style={styles.closeRow} hitSlop={12}>
          <Icon name="back" size={18} color={t.colors.text} />
        </Pressable>

        <Text style={[styles.label, { color: t.colors.textFaint }]}>Nu visas</Text>

        <LinearGradient colors={['#3a4f8c', '#0e1220']} style={styles.art} />

        <Text style={[t.type.title, { color: t.colors.text, marginBottom: 2 }]} numberOfLines={1}>
          {playback.item.name}
        </Text>
        <Text style={{ color: t.colors.textDim, fontSize: 13, marginBottom: 20 }}>
          {playback.device.room} · {playback.device.name}
        </Text>

        <View style={[styles.scrub, { backgroundColor: t.colors.surface2 }]}>
          <View style={[styles.scrubFill, { backgroundColor: t.colors.accent, width: `${progress * 100}%` }]} />
        </View>
        <View style={styles.timeRow}>
          <Text style={[styles.time, { color: t.colors.textFaint }]}>{formatTime(playback.positionMs)}</Text>
          <Text style={[styles.time, { color: t.colors.textFaint }]}>{formatTime(playback.durationMs)}</Text>
        </View>

        <View style={styles.controls}>
          <Pressable onPress={() => controlPlayback('previous')} hitSlop={12}>
            <Icon name="prev" size={22} color={t.colors.text} />
          </Pressable>
          <Pressable
            onPress={() => controlPlayback(playback.isPlaying ? 'pause' : 'play')}
            style={[styles.playBtn, { backgroundColor: t.colors.text }]}
          >
            <Icon name={playback.isPlaying ? 'pause' : 'play'} size={20} color={t.colors.bg} />
          </Pressable>
          <Pressable onPress={() => controlPlayback('next')} hitSlop={12}>
            <Icon name="next" size={22} color={t.colors.text} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 60 },
  closeRow: { marginBottom: 18 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
  art: { width: '100%', aspectRatio: 1, borderRadius: 18, marginBottom: 22 },
  scrub: { height: 3, borderRadius: 2, marginBottom: 6, overflow: 'hidden' },
  scrubFill: { height: '100%', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  time: { fontSize: 11, fontFamily: 'monospace' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28 },
  playBtn: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
});
