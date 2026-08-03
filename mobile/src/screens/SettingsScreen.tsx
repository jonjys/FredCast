import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, IconName } from '../icons/Icon';

function ListRow({ icon, label, value, toggle, onToggle }: { icon: IconName; label: string; value?: string; toggle?: boolean; onToggle?: () => void }) {
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

/** Inställningar — molnrelä av som standard (LAN-first, §8–9, MVP_BACKLOG Epic 8). */
export function SettingsScreen() {
  const t = useTheme();
  const [autoQuality, setAutoQuality] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [cloudRelay, setCloudRelay] = useState(false);

  return (
    <ScrollView style={{ backgroundColor: t.colors.bg }} contentContainerStyle={styles.body}>
      <Text style={[t.type.h1, { color: t.colors.text, marginBottom: 16 }]}>Inställningar</Text>

      <Text style={[styles.sectionLabel, { color: t.colors.textFaint }]}>Konto</Text>
      <ListRow icon="user" label="Fredrik K." />

      <Text style={[styles.sectionLabel, { color: t.colors.textFaint }]}>Nätverk &amp; kvalitet</Text>
      <ListRow icon="wifi" label="Wi-Fi" value="Hemma" />
      <ListRow icon="tv" label="Auto-kvalitet" toggle={autoQuality} onToggle={() => setAutoQuality((v) => !v)} />

      <Text style={[styles.sectionLabel, { color: t.colors.textFaint }]}>Notiser &amp; integritet</Text>
      <ListRow icon="bell" label="Anslutningsnotiser" toggle={notifications} onToggle={() => setNotifications((v) => !v)} />
      <ListRow icon="shield" label="Tillåt molnrelä (fallback)" toggle={cloudRelay} onToggle={() => setCloudRelay((v) => !v)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 18, paddingTop: 8 },
  sectionLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8 },
  rowIcon: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  toggle: { width: 36, height: 21, borderRadius: 999, padding: 2, justifyContent: 'center' },
  knob: { width: 17, height: 17, borderRadius: 9 },
  knobOn: { alignSelf: 'flex-end' },
});
