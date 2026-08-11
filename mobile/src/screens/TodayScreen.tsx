import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { PrimaryButton } from '../components/PrimaryButton';
import { PhotoGrid } from '../components/PhotoGrid';
import { Icon } from '../icons/Icon';
import { mockPhotos } from '../data/mockMedia';

/** Home screen — one primary shortcut, zero navigation for returning users (§1 Flöde C, §2). */
export function TodayScreen({ onOpenLibrary, onOpenLive }: { onOpenLibrary: () => void; onOpenLive: () => void }) {
  const t = useTheme();
  const { connectedDevice, history, connecting } = useCast();
  const recent = history.slice(0, 4).map((h) => mockPhotos.find((p) => p.id === h.item.id)).filter(Boolean) as typeof mockPhotos;

  return (
    <ScrollView style={{ backgroundColor: t.colors.bg }} contentContainerStyle={styles.body}>
      <Text style={[styles.greet, { color: t.colors.textDim }]}>God kväll</Text>
      <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 18 }]}>Idag</Text>

      <View style={[styles.card, { backgroundColor: t.colors.accent }]}>
        <Text style={styles.cardEyebrow}>{connectedDevice ? 'Ansluten skärm' : 'Ingen skärm ansluten än'}</Text>
        <Text style={styles.cardTitle}>
          {connectedDevice ? `Fortsätt till ${connectedDevice.name}` : 'Hitta en skärm att casta till'}
        </Text>
        <PrimaryButton
          label={connectedDevice ? 'Visa innehåll' : 'Hitta skärmar'}
          icon="tv"
          onPress={onOpenLibrary}
          loading={connecting}
          variant="onAccent"
        />
      </View>

      <Pressable onPress={onOpenLive} style={[styles.liveRow, { borderColor: t.colors.border, backgroundColor: t.colors.surface }]}>
        <View style={[styles.liveIconWrap, { backgroundColor: t.colors.surface2 }]}>
          <Icon name="cast" size={18} color={t.colors.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: t.colors.text, fontSize: 14, fontWeight: '700' }}>Filma live till TV:n</Text>
          <Text style={{ color: t.colors.textDim, fontSize: 12, marginTop: 1 }}>
            {connectedDevice ? `Sänds direkt till ${connectedDevice.name}` : 'Anslut en skärm för att sända'}
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
  body: { padding: 18, paddingTop: 8 },
  greet: { fontSize: 14, marginBottom: 2 },
  card: { borderRadius: 18, padding: 20, marginBottom: 22, gap: 4 },
  cardEyebrow: { color: 'rgba(255,255,255,0.8)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2 },
  cardTitle: { color: '#fff', fontSize: 19, fontWeight: '700', marginBottom: 14, marginTop: 2 },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 22,
  },
  liveIconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
});
