import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Icon, IconName } from '../icons/Icon';

type Props = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'onAccent';
};

export function PrimaryButton({ label, onPress, icon, loading, disabled, variant = 'primary' }: Props) {
  const t = useTheme();
  const isPrimary = variant === 'primary';
  const isOnAccent = variant === 'onAccent';
  const textColor = isPrimary ? t.colors.accentInk : isOnAccent ? '#fff' : t.colors.text;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isPrimary ? t.colors.accent : isOnAccent ? 'rgba(255,255,255,0.18)' : 'transparent',
          borderColor: t.colors.border,
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon ? <Icon name={icon} size={16} color={textColor} /> : null}
          <Text style={[styles.label, { color: textColor }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  label: { fontSize: 15, fontWeight: '700' },
});
