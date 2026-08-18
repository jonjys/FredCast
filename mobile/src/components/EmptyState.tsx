import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon } from '../icons/Icon';

type Props = {
  title: string;
  subtitle: string;
  onPressQr?: () => void;
};

export function EmptyState({ title, subtitle, onPressQr }: Props) {
  const t = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.ring, styles.ringOuter, { borderColor: t.colors.border }]}>
        <View style={[styles.ring, styles.ringMiddle, { borderColor: t.colors.border }]}>
          <View style={[styles.ring, styles.ringInner, { borderColor: t.colors.border }]}>
            <Icon name="search" size={20} color={t.colors.textFaint} />
          </View>
        </View>
      </View>
      <Text style={[t.type.title, { color: t.colors.text, marginTop: 22, marginBottom: 6, textAlign: 'center' }]}>
        {title}
      </Text>
      <Text style={[styles.subtitle, { color: t.colors.textDim }]}>{subtitle}</Text>
      {onPressQr ? (
        <Pressable
          onPress={onPressQr}
          style={[styles.qrBtn, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}
        >
          <View style={[styles.qrMini, { backgroundColor: t.colors.text }]} />
          <Text style={{ color: t.colors.text, fontWeight: '700', fontSize: 13 }}>Anslut med QR-kod istället</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 28 },
  ring: { borderRadius: 999, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  ringOuter: { width: 96, height: 96 },
  ringMiddle: { width: 66, height: 66 },
  ringInner: { width: 38, height: 38 },
  subtitle: { fontSize: 14, textAlign: 'center', maxWidth: 300, marginBottom: 22, lineHeight: 21 },
  qrBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  qrMini: { width: 22, height: 22, borderRadius: 4, opacity: 0.9 },
});
