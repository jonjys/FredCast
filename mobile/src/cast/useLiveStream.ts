import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useCast, pwaReceiverAdapter } from './CastProvider';

export type LiveStreamStatus = 'idle' | 'requesting-camera' | 'connecting' | 'live' | 'error';

// Same public STUN server as receiver/index.html — only used to discover
// NAT-mapped addresses, never carries video. Same-Wi-Fi ("hemma") only for
// this first version; streaming across networks ("ute") needs a TURN relay
// too, which is a separate (often paid) service — see PRODUCT_PLAN.md §9.
const RTC_CONFIG: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

/**
 * "Filma → visas direkt på TV:n" — live camera streaming to the paired
 * PwaReceiverAdapter screen over WebRTC, signalled through the existing
 * relay (see relay/server.js webrtc-offer/webrtc-answer/webrtc-ice
 * handling and receiver/index.html's handleOffer). Web-only: relies on
 * browser-native getUserMedia/RTCPeerConnection, which react-native-web
 * exposes as-is — a native iOS/Android build would need react-native-webrtc
 * instead, out of scope until this app has a native build (see README).
 */
export function useLiveStream() {
  const { connectedDevice } = useCast();
  const [status, setStatus] = useState<LiveStreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    if (connectedDevice) {
      pwaReceiverAdapter.sendRaw(connectedDevice.id, { type: 'control', command: 'stop-live' });
    }
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (previewRef.current) previewRef.current.srcObject = null;
    setStatus('idle');
  }, [connectedDevice]);

  const start = useCallback(
    async (previewEl: HTMLVideoElement | null, facingMode: 'user' | 'environment' = 'environment') => {
      if (Platform.OS !== 'web') {
        setError('Livestreaming stöds bara i webbläget just nu.');
        setStatus('error');
        return;
      }
      if (!connectedDevice) {
        setError('Ingen skärm vald. Anslut en skärm först.');
        setStatus('error');
        return;
      }

      setError(null);
      setStatus('requesting-camera');
      previewRef.current = previewEl;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true,
        });
        streamRef.current = stream;
        if (previewEl) {
          previewEl.srcObject = stream;
          previewEl.muted = true;
          await previewEl.play().catch(() => undefined);
        }

        setStatus('connecting');

        const pc = new RTCPeerConnection(RTC_CONFIG);
        pcRef.current = pc;
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            pwaReceiverAdapter.sendRaw(connectedDevice.id, { type: 'webrtc-ice', candidate: event.candidate });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') setStatus('live');
          if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
            setError('Anslutningen till skärmen tappades.');
            setStatus('error');
          }
        };

        unsubscribeRef.current = pwaReceiverAdapter.onMessage(connectedDevice.id, (msg) => {
          if (msg.type === 'webrtc-answer' && msg.sdp) {
            pc.setRemoteDescription(new RTCSessionDescription(msg.sdp as RTCSessionDescriptionInit)).catch(() => undefined);
          }
          if (msg.type === 'webrtc-ice' && msg.candidate) {
            pc.addIceCandidate(new RTCIceCandidate(msg.candidate as RTCIceCandidateInit)).catch(() => undefined);
          }
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        pwaReceiverAdapter.sendRaw(connectedDevice.id, { type: 'webrtc-offer', sdp: pc.localDescription });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Kunde inte starta kameran.');
        setStatus('error');
        stop();
      }
    },
    [connectedDevice, stop],
  );

  return { status, error, start, stop };
}
