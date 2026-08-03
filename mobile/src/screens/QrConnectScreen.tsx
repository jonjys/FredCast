import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { Icon } from '../icons/Icon';

/**
 * QR/kod-anslutning — universell fallback när mDNS/DLNA inte hittar skärmen
 * (§9, Epic 7). Användaren läser en 6-siffrig kod på TV:ns FredCast Receiver
 * -sida och skriver in den här; pairWithCode ansluter via relayn på riktigt
 * (PwaReceiverAdapter), det är inte längre bara en visuell mockup.
 */
export function QrConnectScreen({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const { pairWithCode, pairing, lastError } = useCast();
  const [code, setCode] = useState('');
  const [connected, setConnected] = useState(false);

  const handleConnect = async () => {
    const digits = code.replace(/\D/g, '');
    if (digits.length !== 6) return;
    try {
      await pairWithCode(digits);
      setConnected(true);
      setTimeout(onClose, 900);
    } catch {
      // lastError from context already surfaces the message
    }
  };

  const handleClose = () => {
    setCode('');
    setConnected(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} presentationStyle="pageSheet">
      <View style={[styles.screen, { backgroundColor: t.colors.bg }]}>
        <Pressable onPress={handleClose} style={styles.backRow} hitSlop={12}>
          <Icon name="back" size={18} color={t.colors.text} />
          <Text style={[t.type.title, { color: t.colors.text }]}>Anslut med kod</Text>
        </Pressable>

        <Text style={[styles.help, { color: t.colors.textDim }]}>
          Öppna <Text style={{ color: t.colors.text, fontWeight: '700' }}>fredcast.app/receiver</Text> i webbläsaren på
          din skärm och skriv in koden som visas där. Funkar även om ni är på olika nätverk.
        </Text>

        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          placeholder="482019"
          placeholderTextColor={t.colors.textFaint}
          keyboardType="number-pad"
          maxLength={6}
          style={[styles.input, { color: t.colors.text, borderColor: t.colors.border, backgroundColor: t.colors.surface }]}
        />

        <Pressable
          onPress={handleConnect}
          disabled={code.length !== 6 || pairing}
          style={[
            styles.connectBtn,
            { backgroundColor: t.colors.accent, opacity: code.length !== 6 || pairing ? 0.5 : 1 },
          ]}
        >
          {pairing ? (
            <ActivityIndicator color="#fff" />
          ) : connected ? (
            <Text style={styles.connectLabel}>Ansluten ✓</Text>
          ) : (
            <Text style={styles.connectLabel}>Anslut</Text>
          )}
        </Pressable>

        {lastError ? <Text style={[styles.error, { color: t.colors.danger }]}>{lastError}</Text> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 60, alignItems: 'center' },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', marginBottom: 24 },
  help: { fontSize: 13, textAlign: 'center', maxWidth: 280, lineHeight: 19, marginBottom: 28 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 16,
    fontSize: 24,
    fontFamily: 'monospace',
    letterSpacing: 6,
    textAlign: 'center',
    marginBottom: 16,
  },
  connectBtn: { width: '100%', borderRadius: 999, paddingVertical: 15, alignItems: 'center' },
  connectLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  error: { fontSize: 12, textAlign: 'center', marginTop: 16, maxWidth: 280 },
});
