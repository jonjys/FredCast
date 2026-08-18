import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { AutoConnectStatus } from '../cast/useAutoConnectFromUrl';

const AUTO_DISMISS_MS = 3500;

/**
 * Feedback while a QR-code scan (?connectCode=) auto-pairs on app load.
 * Stays up while connecting, then self-dismisses a few seconds after a
 * terminal result — long enough to read, short enough not to permanently
 * overlap the Idag screen's own heading.
 */
export function AutoConnectBanner({ status }: { status: AutoConnectStatus }) {
  const t = useTheme();
  const { connectedDevice, lastError } = useCast();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (status !== 'connected' && status !== 'error') return;
    const timer = setTimeout(() => setDismissed(true), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [status]);

  if (status === 'idle' || status === 'connect-page' || dismissed) return null;

  return (
    <View style={[styles.banner, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
      {status === 'connecting' ? (
        <>
          <ActivityIndicator size="small" color={t.colors.accent} />
          <Text style={{ color: t.colors.text, fontSize: 13 }}>Ansluter till skärmen från QR-koden…</Text>
        </>
      ) : status === 'connected' ? (
        <Text style={{ color: t.colors.ready, fontSize: 13, fontWeight: '700' }}>
          Ansluten till {connectedDevice?.name ?? 'skärmen'} ✓
        </Text>
      ) : (
        <Text style={{ color: t.colors.danger, fontSize: 13 }}>
          {lastError ?? 'Kunde inte ansluta via QR-koden.'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 8,
  },
});
