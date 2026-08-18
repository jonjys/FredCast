import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { useCast } from '../cast/CastProvider';
import { Icon } from '../icons/Icon';

/**
 * Web: BarcodeDetector API (Chrome/Edge/Android). Falls back to message if unavailable.
 * Native would use expo-barcode-scanner — not installed in this web-first build.
 */
export function QrScanScreen({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTheme();
  const { pairWithCode, pairing, lastError } = useCast();
  const [status, setStatus] = useState<'idle' | 'scanning' | 'connecting' | 'done' | 'unsupported' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    let cancelled = false;

    const run = async () => {
      // @ts-expect-error BarcodeDetector is experimental
      const Detector = typeof window !== 'undefined' ? window.BarcodeDetector : undefined;
      if (!Detector) {
        setStatus('unsupported');
        setMessage('QR-scanner stöds inte i denna webbläsare. Använd "Anslut med kod" eller iPhone-kameran på TV:ns QR.');
        return;
      }

      setStatus('scanning');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((tr) => tr.stop());
          return;
        }
        streamRef.current = stream;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const node = containerRef.current as unknown as HTMLElement | null;
        if (!node) return;
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsInline = true;
        video.muted = true;
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.borderRadius = '16px';
        node.appendChild(video);
        videoRef.current = video;
        video.srcObject = stream;
        await video.play().catch(() => undefined);

        const detector = new Detector({ formats: ['qr_code'] });

        const tick = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes && codes.length) {
              const raw = String(codes[0].rawValue || '');
              const match = raw.match(/connectCode=(\d{6})/) || raw.match(/\/connect\/(\d{6})/) || raw.match(/\b(\d{6})\b/);
              if (match) {
                setStatus('connecting');
                stream.getTracks().forEach((tr) => tr.stop());
                await pairWithCode(match[1]);
                setStatus('done');
                setTimeout(onClose, 800);
                return;
              }
            }
          } catch {
            /* keep scanning */
          }
          rafRef.current = requestAnimationFrame(() => {
            void tick();
          });
        };
        void tick();
      } catch (e) {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Kunde inte öppna kameran.');
      }
    };

    void run();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      if (videoRef.current?.parentNode) videoRef.current.parentNode.removeChild(videoRef.current);
      videoRef.current = null;
    };
  }, [visible, pairWithCode, onClose]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.screen, { backgroundColor: t.colors.bg }]}>
        <Pressable onPress={onClose} style={styles.back} hitSlop={12}>
          <Icon name="back" size={18} color={t.colors.text} />
          <Text style={{ color: t.colors.text, fontWeight: '700', fontSize: 16 }}>Skanna QR</Text>
        </Pressable>

        <View ref={containerRef} style={[styles.preview, { backgroundColor: t.colors.surface2 }]}>
          {status === 'scanning' && !videoRef.current ? (
            <ActivityIndicator color={t.colors.accent} />
          ) : null}
        </View>

        <Text style={{ color: t.colors.textDim, textAlign: 'center', marginTop: 16, maxWidth: 300 }}>
          {status === 'scanning' && 'Rikta kameran mot QR-koden på TV:n'}
          {status === 'connecting' && (pairing ? 'Väcker relay…' : 'Ansluter…')}
          {status === 'done' && 'Ansluten ✓'}
          {(status === 'unsupported' || status === 'error') && (message || lastError)}
          {status === 'idle' && 'Startar kamera…'}
        </Text>
        {lastError && status !== 'error' ? (
          <Text style={{ color: t.colors.danger, marginTop: 10, textAlign: 'center' }}>{lastError}</Text>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, paddingTop: 60, alignItems: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', marginBottom: 20 },
  preview: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
