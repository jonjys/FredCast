import React, { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { DeviceCard } from './DeviceCard';
import { PrimaryButton } from './PrimaryButton';
import { Icon } from '../icons/Icon';
import { MediaItem } from '../cast/types';

type CastableItem = MediaItem & { gradient?: [string, string] };

type Props = {
  item: CastableItem | null;
  onClose: () => void;
};

/** Bottom sheet — Visa nu / Lägg i kö (PRODUCT_PLAN.md §6). */
export function CastSheet({ item, onClose }: Props) {
  const t = useTheme();
  const { connectedDevice, groupedDevices, cast, enqueue, sending, lastError, playback } = useCast();
  const [picking, setPicking] = useState(false);

  if (!item) return null;

  const handleCastTo = async (deviceId: string) => {
    await cast(item, deviceId, { force: true });
    setPicking(false);
    onClose();
  };

  const handlePrimary = async () => {
    if (!connectedDevice) {
      setPicking(true);
      return;
    }
    // Explicit "Visa nu" always forces play
    await cast(item, connectedDevice.id, { force: true });
    onClose();
  };

  const handleEnqueue = () => {
    enqueue(item);
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
        <View style={[styles.handle, { backgroundColor: t.colors.textFaint }]} />

        {picking ? (
          <>
            <Text style={[t.type.title, { color: t.colors.text, marginBottom: 12 }]}>Välj skärm</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {groupedDevices.map((group) => (
                <View key={group.room} style={{ marginBottom: 10 }}>
                  <Text style={[styles.groupLabel, { color: t.colors.textFaint }]}>{group.room}</Text>
                  {group.devices.map((d) => (
                    <DeviceCard key={d.id} device={d} onPress={(device) => handleCastTo(device.id)} />
                  ))}
                </View>
              ))}
            </ScrollView>
          </>
        ) : (
          <>
            {item.gradient ? (
              <LinearGradient colors={item.gradient} style={styles.thumb} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            ) : item.kind === 'image' && item.uri ? (
              <Image source={{ uri: item.uri }} style={styles.thumb} resizeMode="cover" />
            ) : (
              <View style={[styles.thumb, styles.thumbIconWrap, { backgroundColor: t.colors.surface2 }]}>
                <Icon name={item.kind === 'video' ? 'play' : 'doc'} size={28} color={t.colors.textFaint} />
              </View>
            )}
            <Text style={[styles.fileLabel, { color: t.colors.textDim }]}>
              {item.name}
              {item.sizeLabel ? ` · ${item.sizeLabel}` : ''}
            </Text>
            {playback ? (
              <Text style={{ color: t.colors.textDim, fontSize: 12, textAlign: 'center', marginBottom: 10 }}>
                Spelar nu: {playback.item.name} — ny cast läggs i kö om du inte väljer Visa nu
              </Text>
            ) : null}
            <PrimaryButton
              label={connectedDevice ? `Visa nu på ${connectedDevice.name}` : 'Välj en skärm'}
              icon="tv"
              onPress={handlePrimary}
              loading={sending}
            />
            {connectedDevice ? (
              <Pressable onPress={handleEnqueue} style={{ paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ color: t.colors.accent, fontSize: 15, fontWeight: '700' }}>
                  {playback ? 'Lägg i kö' : 'Lägg i kö (spela sen)'}
                </Text>
              </Pressable>
            ) : null}
            {connectedDevice ? (
              <Pressable onPress={() => setPicking(true)} style={{ paddingVertical: 6, alignItems: 'center' }}>
                <Text style={{ color: t.colors.textDim, fontSize: 13 }}>Byt skärm</Text>
              </Pressable>
            ) : null}
            {lastError ? (
              <Text style={{ color: t.colors.danger, fontSize: 12, textAlign: 'center' }}>{lastError}</Text>
            ) : null}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: 34,
  },
  handle: { width: 34, height: 4, borderRadius: 3, opacity: 0.5, alignSelf: 'center', marginBottom: 16 },
  thumb: { width: '100%', height: 140, borderRadius: 14, marginBottom: 14 },
  thumbIconWrap: { alignItems: 'center', justifyContent: 'center' },
  fileLabel: { fontSize: 13, marginBottom: 14, textAlign: 'center' },
  groupLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
});
