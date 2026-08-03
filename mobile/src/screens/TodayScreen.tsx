import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { PrimaryButton } from '../components/PrimaryButton';
import { PhotoGrid } from '../components/PhotoGrid';
import { mockPhotos } from '../data/mockMedia';

/** Home screen — one primary shortcut, zero navigation for returning users (§1 Flöde C, §2). */
export function TodayScreen({ onOpenLibrary }: { onOpenLibrary: () => void }) {
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
  rowLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 },
});
