import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';

const kindIcon: Record<string, string> = {
  image: '📷',
  video: '🎥',
  file: '📄',
  link: '🔗',
};

/**
 * Kö — allt du castar läggs här. Nästa / radera / rensa.
 * LIVE pausar kön (hanteras i LiveScreen separat).
 */
export function QueueScreen() {
  const t = useTheme();
  const {
    queue,
    removeFromQueue,
    clearQueue,
    playNextFromQueue,
    connectedDevice,
    playback,
  } = useCast();

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 8 }]}>Kö</Text>
        {connectedDevice ? (
          <Text style={{ color: t.colors.textDim, fontSize: 13, marginBottom: 14 }}>
            Ansluten till {connectedDevice.name}
            {playback ? ` • spelar ${playback.item.name}` : ''}
          </Text>
        ) : (
          <Text style={{ color: t.colors.textDim, fontSize: 13, marginBottom: 14 }}>
            Ingen skärm ansluten — para först under Skärmar
          </Text>
        )}

        {queue.length === 0 ? (
          <View style={[styles.empty, { borderColor: t.colors.border }]}>
            <Text style={{ color: t.colors.textDim, fontSize: 15 }}>Kön är tom</Text>
            <Text style={{ color: t.colors.textDim, fontSize: 13, marginTop: 6, textAlign: 'center' }}>
              Casta något från Bibliotek eller Idag — det läggs här om något redan spelas.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.actions}>
              <Pressable
                onPress={() => void playNextFromQueue()}
                style={[styles.btn, { backgroundColor: t.colors.accent }]}
              >
                <Text style={styles.btnText}>▶ Spela nästa</Text>
              </Pressable>
              <Pressable
                onPress={clearQueue}
                style={[
                  styles.btn,
                  { backgroundColor: t.colors.surface, borderWidth: 1, borderColor: t.colors.border },
                ]}
              >
                <Text style={[styles.btnText, { color: t.colors.text }]}>Rensa</Text>
              </Pressable>
            </View>

            {queue.map((q, idx) => (
              <View
                key={q.id}
                style={[styles.row, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}
              >
                <Text style={{ fontSize: 18, width: 28 }}>{kindIcon[q.item.kind] || '📎'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.colors.text, fontWeight: '600' }} numberOfLines={1}>
                    {idx + 1}. {q.item.name}
                  </Text>
                  <Text style={{ color: t.colors.textDim, fontSize: 12 }}>
                    {q.item.kind}
                    {q.item.sizeLabel ? ` · ${q.item.sizeLabel}` : ''}
                  </Text>
                </View>
                <Pressable onPress={() => removeFromQueue(q.id)} hitSlop={12}>
                  <Text style={{ color: t.colors.textDim, fontSize: 18 }}>✕</Text>
                </Pressable>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, paddingBottom: 40 },
  empty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
  },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
});
