import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { Icon } from '../icons/Icon';

/**
 * Global cast icon, always reachable regardless of tab — the same role the
 * Chromecast icon plays in the top bar of Netflix/YouTube etc. Tapping it
 * opens ConnectToSheet's "Connect to:" picker. Filled/accent-colored while
 * a screen is connected, outline otherwise, so state is visible at a
 * glance without opening the sheet.
 */
export function CastHeaderButton({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  const { connectedDevice } = useCast();
  const active = !!connectedDevice;

  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.wrap}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: active ? t.colors.accent : t.colors.surface,
            borderColor: active ? t.colors.accent : t.colors.border,
          },
        ]}
      >
        <Icon name="cast" size={16} color={active ? t.colors.accentInk : t.colors.text} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, right: 16 },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
