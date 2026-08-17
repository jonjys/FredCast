import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { DeviceCard } from '../components/DeviceCard';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../icons/Icon';
import { CastDevice } from '../cast/types';

/** Enhetslista — grouped by room, favorites pinned on top, never by protocol (§5). */
export function DevicesScreen({
  onOpenQr,
  onOpenScan,
}: {
  onOpenQr: () => void;
  onOpenScan?: () => void;
}) {
  const t = useTheme();
  const { groupedDevices, connectedDevice, connect, toggleFavorite, queue } = useCast();

  const handlePress = (device: CastDevice) => {
    if (device.status === 'ready' || device.status === 'connecting') connect(device.id);
  };

  const actions = (
    <View style={{ gap: 10, marginTop: 8 }}>
      {onOpenScan ? (
        <Pressable
          onPress={onOpenScan}
          style={[styles.primaryRow, { backgroundColor: t.colors.accent }]}
        >
          <Icon name="search" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>📷 Skanna QR på TV:n</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onOpenQr} style={[styles.qrRow, { borderColor: t.colors.border }]}>
        <Icon name="search" size={14} color={t.colors.textDim} />
        <Text style={{ color: t.colors.textDim, fontSize: 13 }}>Anslut med kod (6 siffror)</Text>
      </Pressable>
    </View>
  );

  if (groupedDevices.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg, padding: 18 }}>
        <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 8 }]}>Skärmar</Text>
        <EmptyState
          title="Inga skärmar hittade"
          subtitle="Skanna QR på TV:n eller skriv in koden"
          onPressQr={onOpenQr}
        />
        {actions}
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: t.colors.bg }} contentContainerStyle={styles.body}>
      <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 16 }]}>Skärmar</Text>
      {connectedDevice ? (
        <View style={[styles.banner, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <Text style={{ color: t.colors.text, fontWeight: '700' }}>
            🟢 Ansluten till {connectedDevice.name}
            {queue.length > 0 ? `  •  ${queue.length} i kö` : ''}
          </Text>
          <Text style={{ color: t.colors.textDim, fontSize: 12, marginTop: 2 }}>
            Session sparad 24h — återansluter automatiskt
          </Text>
        </View>
      ) : null}
      {groupedDevices.map((group) => (
        <View key={group.room} style={{ marginBottom: 8 }}>
          <View style={styles.groupLabel}>
            {group.room !== 'Favoriter' ? <Icon name="pin" size={13} color={t.colors.textDim} /> : null}
            <Text
              style={{
                color: t.colors.textDim,
                fontSize: 13,
                fontWeight: group.room === 'Favoriter' ? '700' : '400',
              }}
            >
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
      {actions}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, paddingTop: 8 },
  groupLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 6 },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 14,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    borderStyle: 'dashed',
    padding: 12,
  },
});
