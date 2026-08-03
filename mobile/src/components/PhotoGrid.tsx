import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MockPhoto } from '../data/mockMedia';

type Props = {
  photos: MockPhoto[];
  onPress: (photo: MockPhoto) => void;
};

export function PhotoGrid({ photos, onPress }: Props) {
  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <Pressable key={photo.id} style={styles.cell} onPress={() => onPress(photo)}>
          <LinearGradient colors={photo.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: '31%', aspectRatio: 1, borderRadius: 6, overflow: 'hidden' },
});
