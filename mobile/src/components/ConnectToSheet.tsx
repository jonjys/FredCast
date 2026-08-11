import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { DeviceCard } from './DeviceCard';
import { Icon } from '../icons/Icon';
import { CastDevice } from '../cast/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onAddScreen: () => void;
};

/**
 * "Connect to:" — same shape as the native Chromecast/AirPlay picker sheet
 * (Netflix etc. show one when you tap the cast icon). Lists screens already
 * paired via PwaReceiverAdapter (QR/kod) instead of native mDNS discovery —
 * see PRODUCT_PLAN.md §9 for why that's the reachable equivalent without a
 * native app build. "Anslut ny skärm" reopens the QR/kod flow.
 */
export function ConnectToSheet({ visible, onClose, onAddScreen }: Props) {
  const t = useTheme();
  const { groupedDevices, connectedDevice, connect, disconnect } = useCast();

  const handlePress = (device: CastDevice) => {
    if (connectedDevice?.id === device.id) {
      disconnect();
      return;
    }
    if (device.status === 'ready' || device.status === 'connecting') {
      connect(device.id);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
        <View style={[styles.handle, { backgroundColor: t.colors.textFaint }]} />
        <Text style={[t.type.title, { color: t.colors.text, marginBottom: 16 }]}>Connect to:</Text>

        {groupedDevices.length === 0 ? (
          <Text style={{ color: t.colors.textDim, fontSize: 13, marginBottom: 20 }}>
            Inga skärmar anslutna än.
          </Text>
        ) : (
          <ScrollView style={{ maxHeight: 340 }}>
            {groupedDevices.map((group) => (
              <View key={group.room} style={{ marginBottom: 10 }}>
                <Text style={[styles.groupLabel, { color: t.colors.textFaint }]}>{group.room}</Text>
                {group.devices.map((d) => (
                  <DeviceCard key={d.id} device={d} selected={connectedDevice?.id === d.id} onPress={handlePress} />
                ))}
              </View>
            ))}
          </ScrollView>
        )}

        <Pressable
          onPress={() => {
            onClose();
            onAddScreen();
          }}
          style={[styles.addRow, { borderColor: t.colors.accent }]}
        >
          <Icon name="cast" size={16} color={t.colors.accent} />
          <Text style={{ color: t.colors.accent, fontWeight: '700', fontSize: 14 }}>Anslut ny skärm med QR/kod</Text>
        </Pressable>
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
  groupLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 14,
  },
});
