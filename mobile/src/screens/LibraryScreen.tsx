import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { SegmentedControl } from '../components/SegmentedControl';
import { PhotoGrid, GridItem } from '../components/PhotoGrid';
import { CastSheet } from '../components/CastSheet';
import { Icon } from '../icons/Icon';
import { mockFiles, mockPhotos, mockVideo } from '../data/mockMedia';
import { pickImageFromLibrary, pickVideoFromLibrary, pickDocumentFile, MediaTooLargeError } from '../media/pickers';
import { MediaItem } from '../cast/types';

const SECTIONS = ['Bilder', 'Video', 'Filer', 'Länk'] as const;
type Section = (typeof SECTIONS)[number];

/**
 * Bibliotek — eget galleri (Flöde A, PRODUCT_PLAN.md §2–4). Riktiga filer
 * som användaren väljer från sin enhet läggs till överst i respektive
 * sektion; exempelinnehållet under är kvar som referens/tomt-läge-fyllnad,
 * inte det primära sättet att casta något.
 */
export function LibraryScreen({ onOpenNowPlaying }: { onOpenNowPlaying: () => void }) {
  const t = useTheme();
  const [section, setSection] = useState<Section>('Bilder');
  const [selected, setSelected] = useState<GridItem | null>(null);
  const [pickedImages, setPickedImages] = useState<MediaItem[]>([]);
  const [pickedVideos, setPickedVideos] = useState<MediaItem[]>([]);
  const [pickedFiles, setPickedFiles] = useState<MediaItem[]>([]);
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkItems, setLinkItems] = useState<MediaItem[]>([]);

  const reportPickError = (e: unknown) => {
    const message = e instanceof MediaTooLargeError ? e.message : e instanceof Error ? e.message : 'Kunde inte lägga till filen.';
    setPickError(message);
  };

  const handlePickImage = async () => {
    setPicking(true);
    setPickError(null);
    try {
      const item = await pickImageFromLibrary();
      if (item) setPickedImages((prev) => [item, ...prev]);
    } catch (e) {
      reportPickError(e);
    } finally {
      setPicking(false);
    }
  };

  const handlePickVideo = async () => {
    setPicking(true);
    setPickError(null);
    try {
      const item = await pickVideoFromLibrary();
      if (item) setPickedVideos((prev) => [item, ...prev]);
    } catch (e) {
      reportPickError(e);
    } finally {
      setPicking(false);
    }
  };

  const handlePickFile = async () => {
    setPicking(true);
    setPickError(null);
    try {
      const item = await pickDocumentFile();
      if (item) setPickedFiles((prev) => [item, ...prev]);
    } catch (e) {
      reportPickError(e);
    } finally {
      setPicking(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 16 }]}>Bibliotek</Text>
        <SegmentedControl options={SECTIONS} value={section} onChange={setSection} />
        <View style={{ height: 14 }} />

        {pickError ? (
          <View style={[styles.errorBanner, { backgroundColor: t.colors.surface, borderColor: t.colors.danger }]}>
            <Text style={{ color: t.colors.danger, fontSize: 12, flex: 1 }}>{pickError}</Text>
            <Pressable onPress={() => setPickError(null)} hitSlop={8}>
              <Text style={{ color: t.colors.danger, fontWeight: '700', fontSize: 12 }}>Stäng</Text>
            </Pressable>
          </View>
        ) : null}

        {section === 'Bilder' && (
          <>
            <AddButton label="Välj bild från telefonen" loading={picking} onPress={handlePickImage} />
            <PhotoGrid photos={[...pickedImages, ...mockPhotos]} onPress={setSelected} />
          </>
        )}

        {section === 'Video' && (
          <>
            <AddButton label="Välj video från telefonen" loading={picking} onPress={handlePickVideo} />
            <PhotoGrid photos={[...pickedVideos, mockVideo]} onPress={setSelected} />
          </>
        )}

        {section === 'Filer' && (
          <>
            <AddButton label="Välj fil eller dokument" loading={picking} onPress={handlePickFile} />
            {[...pickedFiles, ...mockFiles].map((file) => (
              <Pressable key={file.id} onPress={() => setSelected(file)} style={[styles.fileRow, { borderColor: t.colors.border }]}>
                <View style={[styles.fileIcon, { backgroundColor: t.colors.surface2 }]}>
                  <Icon name="doc" size={16} color={t.colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.colors.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={{ color: t.colors.textFaint, fontSize: 11, fontFamily: 'monospace' }}>{file.sizeLabel}</Text>
                </View>
              </Pressable>
            ))}
          </>
        )}

        {section === 'Länk' && (
          <>
            <Text style={{ color: t.colors.textDim, fontSize: 13, marginBottom: 12, lineHeight: 18 }}>
              Klistra in en YouTube-länk eller valfri webbadress — den öppnas på skärmen.
            </Text>
            <TextInput
              value={linkUrl}
              onChangeText={setLinkUrl}
              placeholder="https://youtube.com/watch?v=…"
              placeholderTextColor={t.colors.textFaint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={[
                styles.linkInput,
                { color: t.colors.text, borderColor: t.colors.border, backgroundColor: t.colors.surface },
              ]}
            />
            <AddButton
              label="Lägg till länk"
              loading={false}
              onPress={() => {
                const url = linkUrl.trim();
                if (!/^https?:\/\//i.test(url)) {
                  setPickError('Länken måste börja med http:// eller https://');
                  return;
                }
                setPickError(null);
                let name = url;
                try {
                  const host = new URL(url).hostname.replace(/^www\./, '');
                  name = host.includes('youtu') ? 'YouTube-video' : host;
                } catch {
                  /* keep url as name */
                }
                const item: MediaItem = {
                  id: `link-${Date.now()}`,
                  kind: 'link',
                  name,
                  uri: url,
                };
                setLinkItems((prev) => [item, ...prev]);
                setLinkUrl('');
                setSelected(item);
              }}
            />
            {linkItems.map((item) => (
              <Pressable key={item.id} onPress={() => setSelected(item)} style={[styles.fileRow, { borderColor: t.colors.border }]}>
                <View style={[styles.fileIcon, { backgroundColor: t.colors.surface2 }]}>
                  <Icon name="search" size={16} color={t.colors.text} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: t.colors.text, fontSize: 14, fontWeight: '600' }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ color: t.colors.textFaint, fontSize: 11 }} numberOfLines={1}>
                    {item.uri}
                  </Text>
                </View>
              </Pressable>
            ))}
          </>
        )}
      </ScrollView>

      <CastSheet item={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

function AddButton({ label, onPress, loading }: { label: string; onPress: () => void; loading: boolean }) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={[styles.addBtn, { borderColor: t.colors.accent, opacity: loading ? 0.6 : 1 }]}
    >
      {loading ? (
        <ActivityIndicator color={t.colors.accent} size="small" />
      ) : (
        <Icon name="grid" size={14} color={t.colors.accent} />
      )}
      <Text style={{ color: t.colors.accent, fontWeight: '700', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingTop: 8, paddingBottom: 96 },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  fileIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 14,
  },
  linkInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
});
