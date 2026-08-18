import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { PrimaryButton } from '../components/PrimaryButton';
import { PhotoGrid } from '../components/PhotoGrid';
import { Icon } from '../icons/Icon';
import { mockPhotos } from '../data/mockMedia';
import { formatGroupCode, loadGroup, StoredGroup } from '../cast/groupStorage';

const statusWord: Record<string, string> = {
  ready: 'Redo',
  connecting: 'Ansluter',
  busy: 'Upptagen',
  unavailable: 'Otillgänglig',
};

/** Home — Flöde C: one tap "Fortsätt till [rum]", zero extra nav. */
export function TodayScreen({
  onOpenLibrary,
  onOpenLive,
  onOpenDevices,
  onOpenQr,
  onOpenGroups,
  onOpenNowPlaying,
  groupsTick,
}: {
  onOpenLibrary: () => void;
  onOpenLive: () => void;
  onOpenDevices: () => void;
  onOpenQr: () => void;
  onOpenGroups: () => void;
  onOpenNowPlaying: () => void;
  groupsTick?: number;
}) {
  const t = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 400;
  const { connectedDevice, history, connecting, queue, playback, connect, cast } = useCast();
  const recent = history.slice(0, 4).map((h) => mockPhotos.find((p) => p.id === h.item.id)).filter(Boolean) as typeof mockPhotos;
  const [group, setGroup] = useState<StoredGroup | null>(null);

  useEffect(() => {
    setGroup(loadGroup());
  }, [groupsTick]);

  const roomLabel = connectedDevice
    ? connectedDevice.room && connectedDevice.room !== 'Andra skärmar'
      ? connectedDevice.room
      : connectedDevice.name
    : null;

  const status = connectedDevice ? statusWord[connectedDevice.status] || 'Redo' : '';
  const queueBit = queue.length > 0 ? ` · ${queue.length} i kö` : '';
  const subtitle = connectedDevice
    ? `${connectedDevice.name} · ${status}${queueBit}`
    : 'Anslut med kod 482 019';

  const onHero = async () => {
    if (!connectedDevice) {
      onOpenDevices();
      return;
    }
    if (connectedDevice.status !== 'ready') {
      await connect(connectedDevice.id);
    }
    if (playback) {
      onOpenNowPlaying();
      return;
    }
    const last = history[0];
    if (last) {
      await cast(last.item, connectedDevice.id, { force: true });
      onOpenNowPlaying();
      return;
    }
    /* Already on the room — Flow C is done. Stay. */
  };

  return (
    <ScrollView
      style={{ backgroundColor: t.colors.bg, maxWidth: '100%' }}
      contentContainerStyle={[styles.body, compact && styles.bodyCompact]}
    >
      <Text style={[styles.greet, { color: t.colors.textDim }]}>God kväll</Text>
      <Text style={[t.type.h1, { color: t.colors.text, marginBottom: compact ? 12 : 18, fontSize: compact ? 26 : 30 }]}>
        Idag
      </Text>

      <View style={[styles.card, compact && styles.cardCompact, { backgroundColor: t.colors.accent }]}>
        <Text style={styles.cardEyebrow}>{connectedDevice ? 'Fortsätt' : 'Första gången'}</Text>
        <Text style={[styles.cardTitle, compact && styles.cardTitleCompact]} numberOfLines={2}>
          {connectedDevice && roomLabel ? `Fortsätt till ${roomLabel}` : 'Hitta skärmar'}
        </Text>
        <Text style={styles.cardSub} numberOfLines={2}>
          {subtitle}
        </Text>
        <PrimaryButton
          label={connectedDevice ? `Fortsätt till ${roomLabel}` : 'Hitta skärmar'}
          icon="tv"
          onPress={() => void onHero()}
          loading={connecting}
          variant="onAccent"
        />
        {!connectedDevice ? (
          <Pressable onPress={onOpenQr} style={styles.ghostOnAccent}>
            <Text style={styles.ghostOnAccentText}>Anslut med kod 482 019</Text>
          </Pressable>
        ) : null}
      </View>

      <Pressable onPress={onOpenGroups} style={[styles.groupCard, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
        <Text style={[styles.rowLabel, { color: t.colors.textFaint, marginBottom: 8 }]}>Dina grupper</Text>
        {group ? (
          <>
            <Text style={{ color: t.colors.text, fontSize: 16, fontWeight: '700' }}>{group.name}</Text>
            <Text style={{ color: t.colors.textDim, fontSize: 13, marginTop: 4 }}>
              Kod {formatGroupCode(group.code)}
              {group.nickname ? ` · ${group.nickname}` : ''}
            </Text>
          </>
        ) : (
          <Text style={{ color: t.colors.text, fontSize: 15, fontWeight: '600' }}>
            Skapa “Midsommar 2026” · kod + nickname
          </Text>
        )}
      </Pressable>

      <Pressable onPress={onOpenLive} style={[styles.liveRow, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
        <View style={[styles.liveIconWrap, { backgroundColor: t.colors.surface2 }]}>
          <Icon name="cast" size={18} color={t.colors.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.colors.text, fontSize: 14, fontWeight: '700' }}>Filma live till TV:n</Text>
          <Text style={{ color: t.colors.textDim, fontSize: 12, marginTop: 1 }}>
            {connectedDevice ? `Sänds direkt till ${roomLabel}` : 'Anslut en skärm för att sända'}
          </Text>
        </View>
        <Icon name="chevron" size={16} color={t.colors.textFaint} />
      </Pressable>

      {recent.length > 0 ? (
        <>
          <Text style={[styles.rowLabel, { color: t.colors.textFaint }]}>Senast castat</Text>
          <PhotoGrid photos={recent} onPress={() => onOpenLibrary()} />
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingTop: 8, paddingBottom: 96, maxWidth: '100%' },
  bodyCompact: { padding: 14, paddingTop: 6, paddingBottom: 88 },
  greet: { fontSize: 14, marginBottom: 2 },
  card: { borderRadius: 28, padding: 20, marginBottom: 16, gap: 4, maxWidth: '100%' },
  cardCompact: { borderRadius: 18, padding: 14, marginBottom: 12 },
  cardEyebrow: { color: 'rgba(255,255,255,0.8)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: '700', marginBottom: 4, marginTop: 4, letterSpacing: -0.3 },
  cardTitleCompact: { fontSize: 18 },
  cardSub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginBottom: 14 },
  ghostOnAccent: { alignItems: 'center', paddingTop: 10 },
  ghostOnAccentText: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  groupCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 22,
  },
  liveIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
});
