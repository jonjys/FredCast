import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../icons/Icon';

/** QR/kod-anslutning — universell fallback när mDNS/DLNA inte hittar skärmen (§9, Epic 7). */
export function QrConnectScreen({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet">
      <View style={[styles.screen, { backgroundColor: t.colors.bg }]}>
        <Pressable onPress={onClose} style={styles.backRow} hitSlop={12}>
          <Icon name="back" size={18} color={t.colors.text} />
          <Text style={[t.type.title, { color: t.colors.text }]}>Anslut med kod</Text>
        </Pressable>

        <View style={[styles.qr, { backgroundColor: t.colors.text }]}>
          <View style={[styles.qrInner, { backgroundColor: t.colors.bg }]} />
        </View>

        <Text style={[styles.code, { color: t.colors.text }]}>482 019</Text>
        <Text style={[styles.help, { color: t.colors.textDim }]}>
          Öppna <Text style={{ color: t.colors.text, fontWeight: '700' }}>fredcast.app/connect</Text> i webbläsaren på din
          skärm, eller skanna koden — funkar även om ni är på olika nätverk.
        </Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 60, alignItems: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', marginBottom: 30 },
  qr: { width: 176, height: 176, borderRadius: 18, padding: 14, marginBottom: 20 },
  qrInner: { flex: 1, borderRadius: 10 },
  code: { fontSize: 22, fontFamily: 'monospace', letterSpacing: 4, marginBottom: 10 },
  help: { fontSize: 13, textAlign: 'center', maxWidth: 260, lineHeight: 19 },
});
