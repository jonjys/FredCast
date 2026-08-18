import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { DeviceCard } from '../components/DeviceCard';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../icons/Icon';
import { CastDevice } from '../cast/types';
import { formatGroupCode, loadGroup } from '../cast/groupStorage';

const statusWord: Record<string, string> = {
  ready: 'Redo',
  connecting: 'Ansluter…',
  busy: 'Upptagen',
  unavailable: 'Otillgänglig',
};

/** Enhetslista — grouped by room, never by protocol (§5). Kö + grupper as sections. */
export function DevicesScreen({
  onOpenQr,
  onOpenScan,
  onOpenQueue,
  onOpenGroups,
}: {
  onOpenQr: () => void;
  onOpenScan?: () => void;
  onOpenQueue?: () => void;
  onOpenGroups?: () => void;
}) {
  const t = useTheme();
  const { groupedDevices, connectedDevice, connect, toggleFavorite, queue, playNextFromQueue } = useCast();
  const group = loadGroup();

  const handlePress = (device: CastDevice) => {
    if (device.status === 'ready' || device.status === 'connecting') connect(device.id);
  };

  const actions = (
    <View style={{ gap: 10, marginTop: 8 }}>
      {onOpenScan ? (
        <Pressable onPress={onOpenScan} style={[styles.primaryRow, { backgroundColor: t.colors.accent }]}>
          <Icon name="search" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>Skanna QR på TV:n</Text>
        </Pressable>
      ) : null}
      <Pressable onPress={onOpenQr} style={[styles.qrRow, { borderColor: t.colors.border }]}>
        <Icon name="search" size={14} color={t.colors.textDim} />
        <Text style={{ color: t.colors.textDim, fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
          Anslut med kod 482 019 → fredcast.app/connect
        </Text>
      </Pressable>
      <Text style={{ color: t.colors.textFaint, fontSize: 12, textAlign: 'center', lineHeight: 17 }}>
        Funkar även om ni är på olika nätverk
      </Text>
    </View>
  );

  if (groupedDevices.length === 0) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: t.colors.bg }} contentContainerStyle={styles.body}>
        <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 8 }]}>Skärmar</Text>
        <EmptyState
          title="Inga skärmar hittade"
          subtitle="Kontrollera att telefon och TV är på samma Wi-Fi → Anslut med QR-kod istället"
          onPressQr={onOpenQr}
        />
        {actions}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: t.colors.bg }} contentContainerStyle={styles.body}>
      <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 16 }]}>Skärmar</Text>
      {connectedDevice ? (
        <View style={[styles.banner, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <Text style={{ color: t.colors.text, fontWeight: '700' }}>
            {connectedDevice.room} → {connectedDevice.name} ({statusWord[connectedDevice.status] || 'Redo'})
          </Text>
          <Text style={{ color: t.colors.textDim, fontSize: 12, marginTop: 2 }}>
            Session sparad 24h — återansluter automatiskt
            {queue.length > 0 ? ` · ${queue.length} i kö` : ''}
          </Text>
        </View>
      ) : null}

      {group && onOpenGroups ? (
        <Pressable
          onPress={onOpenGroups}
          style={[styles.banner, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}
        >
          <Text style={{ color: t.colors.textFaint, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase' }}>
            Grupp
          </Text>
          <Text style={{ color: t.colors.text, fontWeight: '700', marginTop: 4 }}>
            {group.name} · Kod {formatGroupCode(group.code)}
          </Text>
        </Pressable>
      ) : null}

      {groupedDevices.map((g) => (
        <View key={g.room} style={{ marginBottom: 8 }}>
          <View style={styles.groupLabel}>
            {g.room !== 'Favoriter' ? <Icon name="pin" size={13} color={t.colors.textDim} /> : null}
            <Text
              style={{
                color: t.colors.textDim,
                fontSize: 13,
                fontWeight: g.room === 'Favoriter' ? '700' : '400',
              }}
            >
              {g.room}
            </Text>
          </View>
          {g.devices.map((d) => (
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

      <View style={{ marginTop: 12, marginBottom: 8 }}>
        <View style={styles.queueHead}>
          <Text style={[styles.sectionEyebrow, { color: t.colors.textFaint }]}>Kö</Text>
          {onOpenQueue ? (
            <Pressable onPress={onOpenQueue} hitSlop={8}>
              <Text style={{ color: t.colors.accent, fontSize: 13, fontWeight: '600' }}>Öppna</Text>
            </Pressable>
          ) : null}
        </View>
        {queue.length === 0 ? (
          <Text style={{ color: t.colors.textDim, fontSize: 13 }}>Inget i kön — casta mer när något redan spelas.</Text>
        ) : (
          <View style={[styles.queueBox, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
            <Text style={{ color: t.colors.text, fontWeight: '600' }} numberOfLines={1}>
              Nästa: {queue[0].item.name}
            </Text>
            <Text style={{ color: t.colors.textDim, fontSize: 12, marginTop: 2 }}>
              {queue.length} i kö
            </Text>
            <Pressable onPress={() => void playNextFromQueue()} style={[styles.nextBtn, { backgroundColor: t.colors.accent }]}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>Spela nästa</Text>
            </Pressable>
          </View>
        )}
      </View>

      {actions}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingTop: 8, paddingBottom: 96 },
  groupLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8, marginTop: 6 },
  banner: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 14,
  },
  sectionEyebrow: { fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '600' },
  queueHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  queueBox: { borderWidth: 1, borderRadius: 18, padding: 14 },
  nextBtn: { marginTop: 10, alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 14,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    borderStyle: 'dashed',
    padding: 12,
  },
});
