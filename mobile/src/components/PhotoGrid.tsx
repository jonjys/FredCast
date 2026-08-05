import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MediaItem } from '../cast/types';

export type GridItem = MediaItem & { gradient?: [string, string] };

type Props<T extends GridItem> = {
  photos: T[];
  onPress: (photo: T) => void;
};

/** Renders a real thumbnail for picked media (has `uri`, no `gradient`), or the mock gradient tile for sample content. */
export function PhotoGrid<T extends GridItem>({ photos, onPress }: Props<T>) {
  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <Pressable key={photo.id} style={styles.cell} onPress={() => onPress(photo)}>
          {photo.gradient ? (
            <LinearGradient colors={photo.gradient} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          ) : (
            <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: { width: '31%', aspectRatio: 1, borderRadius: 6, overflow: 'hidden' },
});
