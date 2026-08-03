import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../icons/Icon';
import { CastDevice } from '../cast/types';

const statusLabel: Record<CastDevice['status'], string> = {
  ready: 'Redo',
  connecting: 'Ansluter…',
  busy: 'Upptagen',
  unavailable: 'Otillgänglig',
};

export function StatusDot({ status }: { status: CastDevice['status'] }) {
  const t = useTheme();
  if (status === 'connecting') {
    return <View style={[styles.dot, styles.dotHollow, { borderColor: t.colors.textFaint }]} />;
  }
  const color = status === 'ready' ? t.colors.ready : status === 'busy' ? t.colors.connecting : t.colors.textFaint;
  return <View style={[styles.dot, { backgroundColor: color }]} />;
}

type Props = {
  device: CastDevice;
  selected?: boolean;
  onPress: (device: CastDevice) => void;
  onToggleFavorite?: (device: CastDevice) => void;
};

export function DeviceCard({ device, selected, onPress, onToggleFavorite }: Props) {
  const t = useTheme();

  return (
    <Pressable
      onPress={() => onPress(device)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: t.colors.surface,
          borderColor: selected ? t.colors.accent : t.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: t.colors.surface2 }]}>
        <Icon name={device.type} size={18} color={t.colors.text} />
      </View>
      <View style={styles.meta}>
        <Text style={[t.type.label, { color: t.colors.text }]} numberOfLines={1}>
          {device.name}
        </Text>
        <View style={styles.statusRow}>
          <StatusDot status={device.status} />
          <Text style={[styles.statusText, { color: t.colors.textDim }]}>{statusLabel[device.status]}</Text>
        </View>
      </View>
      {onToggleFavorite ? (
        <Pressable hitSlop={10} onPress={() => onToggleFavorite(device)}>
          <Icon name="star" size={16} color={device.isFavorite ? t.colors.accent : t.colors.border} />
        </Pressable>
      ) : device.isFavorite ? (
        <Icon name="star" size={14} color={t.colors.accent} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: { flex: 1, minWidth: 0 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusText: { fontSize: 12 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotHollow: { backgroundColor: 'transparent', borderWidth: 1.5 },
});
