import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';

/**
 * Persistent status pill shown on every tab while something is casting
 * (PRODUCT_PLAN.md §3) — same idea as Spotify's now-playing bar.
 */
export function CastBubble({ onPress }: { onPress: () => void }) {
  const t = useTheme();
  const { playback, connectedDevice } = useCast();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.35, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  if (!playback || !connectedDevice) return null;

  return (
    <Pressable onPress={onPress} style={[styles.bubble, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
      <Animated.View style={[styles.dot, { backgroundColor: t.colors.ready, opacity: pulse }]} />
      <View style={[styles.thumb, { backgroundColor: t.colors.surface2 }]} />
      <Text style={{ color: t.colors.text, fontSize: 12, flexShrink: 1 }} numberOfLines={1}>
        Sänder till <Text style={{ fontWeight: '700' }}>{connectedDevice.name}</Text>
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  thumb: { width: 22, height: 22, borderRadius: 6 },
});
