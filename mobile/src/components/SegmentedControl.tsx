import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type Props<T extends string> = {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const t = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
      {options.map((option) => {
        const active = option === value;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            style={[styles.segment, active && { backgroundColor: t.colors.surface2 }]}
          >
            <Text style={[styles.label, { color: active ? t.colors.text : t.colors.textDim, fontWeight: active ? '700' : '400' }]}>
              {option}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', borderRadius: 999, padding: 3, borderWidth: 1 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 999 },
  label: { fontSize: 13 },
});
