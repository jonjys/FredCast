import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { MediaItem } from '../cast/types';

/**
 * Real device pickers — replaces the mock gallery data with the user's
 * actual photos/videos/files (PRODUCT_PLAN.md §2 Filhanterare, Epic 4).
 * Every result carries a `uri` that's actually renderable by a receiver:
 * a data: URI, built from base64 either handed back directly by the web
 * picker (which otherwise only returns a page-local blob: URL — useless
 * once relayed to another device) or read off disk on native. Whatever the
 * user picks can be sent as-is over PwaReceiverAdapter without a separate
 * upload step.
 *
 * Data-URI-over-WebSocket doesn't scale to large video files — that's a
 * deliberate limit for this MVP milestone (see MEDIA_SIZE_LIMIT_BYTES).
 * Casting a large local video to a *real* Cast/DLNA device needs the
 * embedded local HTTP server described in PRODUCT_PLAN.md §8, which is a
 * native-module milestone tracked in the CastAdapter TODOs, not something
 * this picker layer can shortcut.
 */

export const MEDIA_SIZE_LIMIT_BYTES = 8 * 1024 * 1024; // 8 MB — data-URI relay limit for this milestone

export class MediaTooLargeError extends Error {
  constructor(sizeBytes: number) {
    super(`Filen är ${(sizeBytes / (1024 * 1024)).toFixed(1)} MB — för stor för QR/kod-anslutningen just nu (max ${MEDIA_SIZE_LIMIT_BYTES / (1024 * 1024)} MB).`);
    this.name = 'MediaTooLargeError';
  }
}

function extensionToMime(uri: string, fallback: string): string {
  const ext = uri.split('.').pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    heic: 'image/heic',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    m4v: 'video/mp4',
    pdf: 'application/pdf',
  };
  return (ext && map[ext]) || fallback;
}

function base64Size(base64: string): number {
  const padding = (base64.match(/=+$/)?.[0] ?? '').length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

/** Reads a file already on disk (native uri, e.g. file://) into a data: URI. */
async function fileUriToDataUri(uri: string, mimeFallback: string): Promise<{ dataUri: string; sizeBytes: number }> {
  const info = await FileSystem.getInfoAsync(uri);
  const sizeBytes = info.exists && 'size' in info ? info.size ?? 0 : 0;
  if (sizeBytes > MEDIA_SIZE_LIMIT_BYTES) throw new MediaTooLargeError(sizeBytes);

  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const mime = extensionToMime(uri, mimeFallback);
  return { dataUri: `data:${mime};base64,${base64}`, sizeBytes };
}

function formatSize(bytes: number): string {
  if (bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export const isWeb = Platform.OS === 'web';

export async function pickImageFromLibrary(): Promise<MediaItem | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Åtkomst till bilder nekades.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    base64: isWeb,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  let dataUri: string;
  let sizeBytes: number;

  if (isWeb && asset.base64) {
    const mime = asset.mimeType || extensionToMime(asset.fileName ?? asset.uri, 'image/jpeg');
    dataUri = `data:${mime};base64,${asset.base64}`;
    sizeBytes = asset.fileSize ?? base64Size(asset.base64);
  } else {
    ({ dataUri, sizeBytes } = await fileUriToDataUri(asset.uri, 'image/jpeg'));
  }

  return {
    id: `picked-image-${Date.now()}`,
    kind: 'image',
    name: asset.fileName || asset.uri.split('/').pop() || 'Bild',
    uri: dataUri,
    sizeLabel: formatSize(asset.fileSize ?? sizeBytes),
  };
}

export async function pickVideoFromLibrary(): Promise<MediaItem | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Åtkomst till videor nekades.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['videos'],
    quality: 0.9,
    base64: isWeb,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  let dataUri: string;
  let sizeBytes: number;

  if (isWeb && asset.base64) {
    const mime = asset.mimeType || extensionToMime(asset.fileName ?? asset.uri, 'video/mp4');
    dataUri = `data:${mime};base64,${asset.base64}`;
    sizeBytes = asset.fileSize ?? base64Size(asset.base64);
    if (sizeBytes > MEDIA_SIZE_LIMIT_BYTES) throw new MediaTooLargeError(sizeBytes);
  } else {
    ({ dataUri, sizeBytes } = await fileUriToDataUri(asset.uri, 'video/mp4'));
  }

  return {
    id: `picked-video-${Date.now()}`,
    kind: 'video',
    name: asset.fileName || asset.uri.split('/').pop() || 'Video',
    uri: dataUri,
    sizeLabel: formatSize(asset.fileSize ?? sizeBytes),
    durationMs: asset.duration ? asset.duration * 1000 : undefined,
  };
}

export async function pickDocumentFile(): Promise<MediaItem | null> {
  const result = await DocumentPicker.getDocumentAsync({
    multiple: false,
    copyToCacheDirectory: true,
    base64: isWeb,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  let dataUri: string;
  let sizeBytes: number;

  if (isWeb && asset.base64) {
    const mime = asset.mimeType || 'application/octet-stream';
    dataUri = `data:${mime};base64,${asset.base64}`;
    sizeBytes = asset.size ?? base64Size(asset.base64);
    if (sizeBytes > MEDIA_SIZE_LIMIT_BYTES) throw new MediaTooLargeError(sizeBytes);
  } else {
    ({ dataUri, sizeBytes } = await fileUriToDataUri(asset.uri, asset.mimeType ?? 'application/octet-stream'));
  }

  return {
    id: `picked-file-${Date.now()}`,
    kind: 'file',
    name: asset.name,
    uri: dataUri,
    sizeLabel: formatSize(asset.size ?? sizeBytes),
  };
}
