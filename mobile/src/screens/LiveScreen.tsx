import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { useLiveStream } from '../cast/useLiveStream';
import { Icon } from '../icons/Icon';

const STATUS_LABEL: Record<string, string> = {
  idle: 'Redo att sända',
  'requesting-camera': 'Ber om kameraåtkomst…',
  connecting: 'Ansluter till skärmen…',
  live: 'Sänder live',
  error: 'Något gick fel',
};

/**
 * "Filma → visas direkt på TV:n" (§ live streaming) — camera preview here,
 * mirrored live to the connected PwaReceiverAdapter screen over WebRTC.
 * Web-only for now: useLiveStream needs browser getUserMedia/RTCPeerConnection
 * (see that file's header comment for the native-build caveat).
 */
export function LiveScreen({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const { connectedDevice } = useCast();
  const { status, error, start, stop } = useLiveStream();
  const previewContainerRef = useRef<View>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !visible) return;
    // react-native-web's View forwards its underlying DOM node — insert a
    // real <video> element into it for the camera preview, same technique
    // receiver/index.html uses for the incoming stream.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const containerNode = previewContainerRef.current as unknown as HTMLElement | null;
    if (!containerNode) return;

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsInline = true;
    video.muted = true;
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.borderRadius = '18px';
    video.style.backgroundColor = '#000';
    containerNode.appendChild(video);
    videoElRef.current = video;

    return () => {
      containerNode.removeChild(video);
      videoElRef.current = null;
    };
  }, [visible]);

  const handleClose = () => {
    stop();
    onClose();
  };

  const handleToggle = () => {
    if (status === 'live' || status === 'connecting' || status === 'requesting-camera') {
      stop();
    } else {
      start(videoElRef.current);
    }
  };

  const isActive = status === 'live' || status === 'connecting' || status === 'requesting-camera';

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={[styles.screen, { backgroundColor: t.colors.bg }]}>
        <Pressable onPress={handleClose} style={styles.closeRow} hitSlop={12}>
          <Icon name="back" size={18} color={t.colors.text} />
        </Pressable>

        <Text style={[styles.label, { color: t.colors.textFaint }]}>Live</Text>
        <Text style={[t.type.title, { color: t.colors.text, marginBottom: 4 }]}>
          {connectedDevice ? `Sänder till ${connectedDevice.name}` : 'Ingen skärm ansluten'}
        </Text>
        <Text style={{ color: t.colors.textDim, fontSize: 13, marginBottom: 20 }}>
          Funkar när telefonen och skärmen är på samma Wi-Fi hemma.
        </Text>

        <View ref={previewContainerRef} style={[styles.preview, { backgroundColor: t.colors.surface2 }]}>
          {status === 'idle' && (
            <View style={styles.previewPlaceholder}>
              <Icon name="cast" size={28} color={t.colors.textFaint} />
            </View>
          )}
        </View>

        <View style={styles.statusRow}>
          {(status === 'connecting' || status === 'requesting-camera') && (
            <ActivityIndicator size="small" color={t.colors.accent} />
          )}
          {status === 'live' && <View style={[styles.liveDot, { backgroundColor: t.colors.danger }]} />}
          <Text style={{ color: status === 'error' ? t.colors.danger : t.colors.textDim, fontSize: 13 }}>
            {error ?? STATUS_LABEL[status]}
          </Text>
        </View>

        <Pressable
          onPress={handleToggle}
          disabled={!connectedDevice && !isActive}
          style={[
            styles.toggleBtn,
            {
              backgroundColor: isActive ? t.colors.danger : t.colors.accent,
              opacity: !connectedDevice && !isActive ? 0.5 : 1,
            },
          ]}
        >
          <Text style={styles.toggleLabel}>{isActive ? 'Avsluta sändning' : 'Starta live'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 60 },
  closeRow: { marginBottom: 18 },
  label: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 18,
    marginBottom: 18,
    overflow: 'hidden',
  },
  previewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  toggleBtn: { borderRadius: 999, paddingVertical: 15, alignItems: 'center' },
  toggleLabel: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
