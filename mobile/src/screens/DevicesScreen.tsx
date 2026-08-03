import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { DeviceCard } from '../components/DeviceCard';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../icons/Icon';
import { CastDevice } from '../cast/types';

/** Enhetslista — grouped by room, favorites pinned on top, never by protocol (§5). */
export function DevicesScreen({ onOpenQr }: { onOpenQr: () => void }) {
  const t = useTheme();
  const { groupedDevices, connectedDevice, connect, toggleFavorite } = useCast();

  const handlePress = (device: CastDevice) => {
    if (device.status === 'ready' || device.status === 'connecting') connect(device.id);
  };

  if (groupedDevices.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg }}>
        <Text style={[t.type.h1, { color: t.colors.text, padding: 18, paddingBottom: 0 }]}>Skärmar</Text>
        <EmptyState
          title="Inga skärmar hittade"
          subtitle="Kontrollera att telefon och TV är på samma Wi-Fi"
          onPressQr={onOpenQr}
        />
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: t.colors.bg }} contentContainerStyle={styles.body}>
      <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 16 }]}>Skärmar</Text>
      {groupedDevices.map((group) => (
        <View key={group.room} style={{ marginBottom: 8 }}>
          <View style={styles.groupLabel}>
            {group.room !== 'Favoriter' ? <Icon name="pin" size={13} color={t.colors.textDim} /> : null}
            <Text style={{ color: t.colors.textDim, fontSize: 13, fontWeight: group.room === 'Favoriter' ? '700' : '400' }}>
              {group.room}
            </Text>
          </View>
          {group.devices.map((d) => (
            <DeviceCard
              key={d.id}
              device={d}
              selected={connectedDevice?.id === d.id}
              onPress={handlePress}
              onToggleFavorite={(device) => toggleFavorite(device.id)}
            />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, paddingTop: 8 },
  groupLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 6 },
});
