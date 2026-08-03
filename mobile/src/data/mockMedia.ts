import { MediaItem } from '../cast/types';

/** Placeholder gallery content — stands in for the real Photos/Media Library query (Epic 4). */
export interface MockPhoto extends MediaItem {
  gradient: [string, string];
}

export const mockPhotos: MockPhoto[] = [
  { id: 'p1', kind: 'image', name: 'IMG_0231.HEIC', uri: 'mock://p1', sizeLabel: '4,2 MB', gradient: ['#e8a86c', '#c9694f'] },
  { id: 'p2', kind: 'image', name: 'IMG_0244.HEIC', uri: 'mock://p2', sizeLabel: '3,8 MB', gradient: ['#6c9ce8', '#3a4f8c'] },
  { id: 'p3', kind: 'image', name: 'IMG_0250.HEIC', uri: 'mock://p3', sizeLabel: '5,1 MB', gradient: ['#7fd6b0', '#2f7d63'] },
  { id: 'p4', kind: 'image', name: 'IMG_0261.HEIC', uri: 'mock://p4', sizeLabel: '2,9 MB', gradient: ['#e0c265', '#a8763a'] },
  { id: 'p5', kind: 'image', name: 'IMG_0270.HEIC', uri: 'mock://p5', sizeLabel: '4,6 MB', gradient: ['#c98ce0', '#6b3f8c'] },
  { id: 'p6', kind: 'image', name: 'IMG_0281.HEIC', uri: 'mock://p6', sizeLabel: '3,3 MB', gradient: ['#8c8c98', '#3f3f4c'] },
  { id: 'p7', kind: 'image', name: 'IMG_0290.HEIC', uri: 'mock://p7', sizeLabel: '4,0 MB', gradient: ['#6c9ce8', '#3a4f8c'] },
  { id: 'p8', kind: 'image', name: 'IMG_0299.HEIC', uri: 'mock://p8', sizeLabel: '3,1 MB', gradient: ['#e0c265', '#a8763a'] },
  { id: 'p9', kind: 'image', name: 'IMG_0305.HEIC', uri: 'mock://p9', sizeLabel: '4,4 MB', gradient: ['#e8a86c', '#c9694f'] },
];

export const mockVideo: MockPhoto = {
  id: 'v1',
  kind: 'video',
  name: 'Sommaren 2025 — Bildspel',
  uri: 'mock://v1',
  durationMs: 102000,
  gradient: ['#3a4f8c', '#0e1220'],
};

export const mockFiles: MediaItem[] = [
  { id: 'f1', kind: 'file', name: 'Kvitton_2026.pdf', uri: 'mock://f1', sizeLabel: '2,1 MB' },
  { id: 'f2', kind: 'file', name: 'Bjudning – Midsommar.docx', uri: 'mock://f2', sizeLabel: '312 KB' },
  { id: 'f3', kind: 'file', name: 'Reseplan Grekland.pdf', uri: 'mock://f3', sizeLabel: '1,4 MB' },
];
