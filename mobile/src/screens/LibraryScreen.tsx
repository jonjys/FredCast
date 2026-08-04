import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { SegmentedControl } from '../components/SegmentedControl';
import { PhotoGrid } from '../components/PhotoGrid';
import { CastSheet } from '../components/CastSheet';
import { CastBubble } from '../components/CastBubble';
import { Icon } from '../icons/Icon';
import { mockFiles, mockPhotos, mockVideo, MockPhoto } from '../data/mockMedia';

const SECTIONS = ['Bilder', 'Video', 'Filer'] as const;
type Section = (typeof SECTIONS)[number];

/** Bibliotek — eget galleri (Flöde A) med samma cast-ark oavsett mediatyp (§2–3, §4). */
export function LibraryScreen({ onOpenNowPlaying }: { onOpenNowPlaying: () => void }) {
  const t = useTheme();
  const [section, setSection] = useState<Section>('Bilder');
  const [selected, setSelected] = useState<MockPhoto | null>(null);

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 16 }]}>Bibliotek</Text>
        <SegmentedControl options={SECTIONS} value={section} onChange={setSection} />
        <View style={{ height: 14 }} />

        {section === 'Bilder' && <PhotoGrid photos={mockPhotos} onPress={setSelected} />}

        {section === 'Video' && (
          <PhotoGrid photos={[mockVideo]} onPress={setSelected} />
        )}

        {section === 'Filer' &&
          mockFiles.map((file) => (
            <View key={file.id} style={[styles.fileRow, { borderColor: t.colors.border }]}>
              <View style={[styles.fileIcon, { backgroundColor: t.colors.surface2 }]}>
                <Icon name="doc" size={16} color={t.colors.text} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: t.colors.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                  {file.name}
                </Text>
                <Text style={{ color: t.colors.textFaint, fontSize: 11, fontFamily: 'monospace' }}>{file.sizeLabel}</Text>
              </View>
            </View>
          ))}
      </ScrollView>

      <CastBubble onPress={onOpenNowPlaying} />
      <CastSheet item={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, paddingTop: 8, paddingBottom: 8 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  fileIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
});
