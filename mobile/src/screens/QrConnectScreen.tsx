import React, { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { Icon } from '../icons/Icon';

/**
 * QR/kod-anslutning — 6-siffrig kod från TV receiver.
 * BUG-2: letterSpacing var för stor och klippte sista siffran på mobil.
 * Vi lagrar alltid råa 6 siffror utan mellanslag mot relayn.
 */
export function QrConnectScreen({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const { pairWithCode, pairing, lastError } = useCast();
  const [code, setCode] = useState('');
  const [connected, setConnected] = useState(false);

  const digits = code.replace(/\D/g, '').slice(0, 6);

  const handleConnect = async () => {
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
          Öppna <Text style={{ color: t.colors.text, fontWeight: '700' }}>fred-cast.vercel.app/receiver</Text> på
          TV:n/datorn och skriv in de 6 siffrorna. Eller skanna QR-koden med telefonens kamera.
        </Text>

        <TextInput
          value={digits}
          onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
          placeholder="482019"
          placeholderTextColor={t.colors.textFaint}
          keyboardType="number-pad"
          maxLength={6}
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          importantForAutofill="yes"
          style={[
            styles.input,
            { color: t.colors.text, borderColor: t.colors.border, backgroundColor: t.colors.surface },
          ]}
        />

        <Text style={[styles.digitCount, { color: t.colors.textFaint }]}>
          {digits.length}/6 siffror
        </Text>

        <Pressable
          onPress={handleConnect}
          disabled={digits.length !== 6 || pairing}
          style={[
            styles.connectBtn,
            { backgroundColor: t.colors.accent, opacity: digits.length !== 6 || pairing ? 0.5 : 1 },
          ]}
        >
          {pairing ? (
            <View style={styles.pairingRow}>
              <ActivityIndicator color="#fff" />
              <Text style={styles.connectLabel}>Väcker relay…</Text>
            </View>
          ) : connected ? (
            <Text style={styles.connectLabel}>Ansluten ✓</Text>
          ) : (
            <Text style={styles.connectLabel}>Anslut</Text>
          )}
        </Pressable>

        {pairing ? (
          <Text style={[styles.hint, { color: t.colors.textDim }]}>
            Första gången efter vila kan det ta 30–45 sek medan relayn vaknar.
          </Text>
        ) : null}

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
    paddingHorizontal: 12,
    fontSize: 28,
    fontFamily: 'monospace',
    // letterSpacing > 4 klippte sista siffran på smala skärmar (BUG-2)
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  digitCount: { fontSize: 12, marginBottom: 16 },
  connectBtn: { width: '100%', borderRadius: 999, paddingVertical: 15, alignItems: 'center' },
  pairingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  connectLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
  hint: { fontSize: 12, textAlign: 'center', marginTop: 14, maxWidth: 280, lineHeight: 17 },
  error: { fontSize: 12, textAlign: 'center', marginTop: 16, maxWidth: 280 },
});
