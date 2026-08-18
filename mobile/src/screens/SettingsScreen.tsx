import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, IconName } from '../icons/Icon';
import { useCast } from '../cast/CastProvider';

function ListRow({
  icon,
  label,
  value,
  toggle,
  onToggle,
}: {
  icon: IconName;
  label: string;
  value?: string;
  toggle?: boolean;
  onToggle?: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable onPress={onToggle} style={[styles.row, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
      <View style={[styles.rowIcon, { backgroundColor: t.colors.surface2 }]}>
        <Icon name={icon} size={16} color={t.colors.textDim} />
      </View>
      <Text style={{ flex: 1, color: t.colors.text, fontSize: 14 }}>{label}</Text>
      {toggle !== undefined ? (
        <View style={[styles.toggle, { backgroundColor: toggle ? t.colors.ready : t.colors.surface2 }]}>
          <View style={[styles.knob, toggle && styles.knobOn, { backgroundColor: toggle ? '#fff' : t.colors.text }]} />
        </View>
      ) : value ? (
        <Text style={{ color: t.colors.textFaint, fontSize: 13 }}>{value}</Text>
      ) : (
        <Icon name="chevron" size={14} color={t.colors.textFaint} />
      )}
    </Pressable>
  );
}

/** Inställningar — LAN-first, plus skärmalias (holy ground rum, inte protokoll). */
export function SettingsScreen() {
  const t = useTheme();
  const { connectedDevice, renameDevice } = useCast();
  const [autoQuality, setAutoQuality] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [cloudRelay, setCloudRelay] = useState(false);
  const [room, setRoom] = useState('');
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!connectedDevice) {
      setRoom('');
      setName('');
      return;
    }
    setRoom(connectedDevice.room);
    setName(connectedDevice.name);
  }, [connectedDevice?.id, connectedDevice?.name, connectedDevice?.room]);

  const saveAlias = () => {
    if (!connectedDevice) return;
    renameDevice(connectedDevice.id, {
      room: room.trim() || 'Vardagsrum',
      name: name.trim() || connectedDevice.name,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1400);
  };

  return (
    <ScrollView style={{ backgroundColor: t.colors.bg }} contentContainerStyle={styles.body}>
      <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 16 }]}>Inställningar</Text>

      <Text style={[styles.sectionLabel, { color: t.colors.textFaint }]}>Denna skärm</Text>
      {connectedDevice ? (
        <View style={[styles.aliasCard, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
          <Text style={{ color: t.colors.textDim, fontSize: 13, marginBottom: 10 }}>
            Döp denna skärm till…
          </Text>
          <TextInput
            value={room}
            onChangeText={setRoom}
            placeholder="Vardagsrum"
            placeholderTextColor={t.colors.textFaint}
            style={[styles.input, { color: t.colors.text, borderColor: t.colors.border, backgroundColor: t.colors.bg }]}
          />
          <Text style={{ color: t.colors.textFaint, fontSize: 12, marginTop: 10, marginBottom: 6 }}>Enhetsnamn</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Sony BRAVIA"
            placeholderTextColor={t.colors.textFaint}
            style={[styles.input, { color: t.colors.text, borderColor: t.colors.border, backgroundColor: t.colors.bg }]}
          />
          <Pressable onPress={saveAlias} style={[styles.saveBtn, { backgroundColor: t.colors.accent }]}>
            <Text style={{ color: '#fff', fontWeight: '700' }}>{saved ? 'Sparat' : 'Spara namn'}</Text>
          </Pressable>
          <Text style={{ color: t.colors.textFaint, fontSize: 12, marginTop: 8 }}>
            Visas som {room.trim() || 'Vardagsrum'} → {name.trim() || connectedDevice.name} (Redo)
          </Text>
        </View>
      ) : (
        <Text style={{ color: t.colors.textDim, fontSize: 13, marginBottom: 8 }}>
          Anslut en skärm först — sedan kan du döpa den till t.ex. Vardagsrum.
        </Text>
      )}

      <Text style={[styles.sectionLabel, { color: t.colors.textFaint }]}>Konto</Text>
      <ListRow icon="user" label="Fredrik K." />

      <Text style={[styles.sectionLabel, { color: t.colors.textFaint }]}>Nätverk & kvalitet</Text>
      <ListRow icon="wifi" label="Wi-Fi" value="Hemma" />
      <ListRow icon="tv" label="Auto-kvalitet" toggle={autoQuality} onToggle={() => setAutoQuality((v) => !v)} />

      <Text style={[styles.sectionLabel, { color: t.colors.textFaint }]}>Notiser & integritet</Text>
      <ListRow icon="bell" label="Anslutningsnotiser" toggle={notifications} onToggle={() => setNotifications((v) => !v)} />
      <ListRow icon="shield" label="Tillåt molnrelä (fallback)" toggle={cloudRelay} onToggle={() => setCloudRelay((v) => !v)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, paddingTop: 8, paddingBottom: 96 },
  sectionLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  rowIcon: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  toggle: { width: 36, height: 21, borderRadius: 999, padding: 2, justifyContent: 'center' },
  knob: { width: 17, height: 17, borderRadius: 9 },
  knobOn: { alignSelf: 'flex-end' },
  aliasCard: { borderWidth: 1, borderRadius: 18, padding: 14, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveBtn: { marginTop: 12, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
});
