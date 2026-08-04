import { MediaItem } from '../cast/types';

/** Placeholder gallery content — stands in for the real Photos/Media Library query (Epic 4). */
export interface MockPhoto extends MediaItem {
  gradient: [string, string];
}

/**
 * The in-app gradient tiles are drawn natively (expo-linear-gradient) — they
 * have no bytes of their own. But `uri` is what actually gets sent to a real
 * receiver (PwaReceiverAdapter -> relay -> <img src>), so it needs to be a
 * real, renderable image. An inline SVG data URI matching the same gradient
 * keeps one visual source of truth while giving casting something real to
 * display, standing in for the eventual real Photos-library asset URI.
 */
function gradientDataUri([from, to]: [string, string]): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='640'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='${from}'/><stop offset='100%' stop-color='${to}'/></linearGradient></defs><rect width='640' height='640' fill='url(#g)'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function photo(id: string, name: string, sizeLabel: string, gradient: [string, string]): MockPhoto {
  return { id, kind: 'image', name, uri: gradientDataUri(gradient), sizeLabel, gradient };
}

export const mockPhotos: MockPhoto[] = [
  photo('p1', 'IMG_0231.HEIC', '4,2 MB', ['#e8a86c', '#c9694f']),
  photo('p2', 'IMG_0244.HEIC', '3,8 MB', ['#6c9ce8', '#3a4f8c']),
  photo('p3', 'IMG_0250.HEIC', '5,1 MB', ['#7fd6b0', '#2f7d63']),
  photo('p4', 'IMG_0261.HEIC', '2,9 MB', ['#e0c265', '#a8763a']),
  photo('p5', 'IMG_0270.HEIC', '4,6 MB', ['#c98ce0', '#6b3f8c']),
  photo('p6', 'IMG_0281.HEIC', '3,3 MB', ['#8c8c98', '#3f3f4c']),
  photo('p7', 'IMG_0290.HEIC', '4,0 MB', ['#6c9ce8', '#3a4f8c']),
  photo('p8', 'IMG_0299.HEIC', '3,1 MB', ['#e0c265', '#a8763a']),
  photo('p9', 'IMG_0305.HEIC', '4,4 MB', ['#e8a86c', '#c9694f']),
];

export const mockVideo: MockPhoto = {
  id: 'v1',
  kind: 'video',
  name: 'Sommaren 2025 — Bildspel',
  uri: gradientDataUri(['#3a4f8c', '#0e1220']),
  durationMs: 102000,
  gradient: ['#3a4f8c', '#0e1220'],
};

export const mockFiles: MediaItem[] = [
  { id: 'f1', kind: 'file', name: 'Kvitton_2026.pdf', uri: 'mock://f1', sizeLabel: '2,1 MB' },
  { id: 'f2', kind: 'file', name: 'Bjudning – Midsommar.docx', uri: 'mock://f2', sizeLabel: '312 KB' },
  { id: 'f3', kind: 'file', name: 'Reseplan Grekland.pdf', uri: 'mock://f3', sizeLabel: '1,4 MB' },
];
