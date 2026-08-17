import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useCast, pwaReceiverAdapter } from './CastProvider';

export type LiveStreamStatus = 'idle' | 'requesting-camera' | 'connecting' | 'live' | 'error';

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

function sdpPlain(desc: RTCSessionDescription | RTCSessionDescriptionInit | null) {
  if (!desc) return null;
  return { type: desc.type, sdp: desc.sdp };
}

/**
 * Live camera → paired PwaReceiver over WebRTC via relay.
 * Fixes: plain SDP, ICE buffer, resilient sendRaw, clearer errors.
 */
export function useLiveStream() {
  const { connectedDevice } = useCast();
  const [status, setStatus] = useState<LiveStreamStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const answerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteSetRef = useRef(false);

  const clearAnswerTimeout = () => {
    if (answerTimeoutRef.current) {
      clearTimeout(answerTimeoutRef.current);
      answerTimeoutRef.current = null;
    }
  };

  const stop = useCallback(() => {
    clearAnswerTimeout();
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    pendingIceRef.current = [];
    remoteSetRef.current = false;

    if (connectedDevice) {
      try {
        pwaReceiverAdapter.sendRaw(connectedDevice.id, { type: 'control', command: 'stop-live' });
      } catch {
        /* socket closed */
      }
    }

    try { pcRef.current?.close(); } catch { /* ignore */ }
    pcRef.current = null;

    streamRef.current?.getTracks().forEach((track) => {
      try { track.stop(); } catch { /* ignore */ }
    });
    streamRef.current = null;

    if (previewRef.current) previewRef.current.srcObject = null;
    setStatus('idle');
    setError(null);
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

      clearAnswerTimeout();
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      try { pcRef.current?.close(); } catch { /* ignore */ }
      pcRef.current = null;
      pendingIceRef.current = [];
      remoteSetRef.current = false;

      setError(null);
      setStatus('requesting-camera');
      previewRef.current = previewEl;

      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }
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
            pwaReceiverAdapter.sendRaw(connectedDevice.id, {
              type: 'webrtc-ice',
              candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          if (state === 'connected') {
            clearAnswerTimeout();
            setStatus('live');
            setError(null);
          } else if (state === 'failed') {
            setError('WebRTC-anslutningen misslyckades (ICE). Är telefon och TV på samma Wi-Fi?');
            setStatus('error');
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'failed') {
            setError('ICE misslyckades. Samma Wi-Fi? Öppna receiver igen och starta om live.');
            setStatus('error');
          }
        };

        unsubscribeRef.current = pwaReceiverAdapter.onMessage(connectedDevice.id, (msg) => {
          if (msg.type === 'webrtc-answer' && msg.sdp) {
            const sdp = msg.sdp as RTCSessionDescriptionInit;
            pc
              .setRemoteDescription(new RTCSessionDescription(sdp))
              .then(async () => {
                remoteSetRef.current = true;
                const buffered = pendingIceRef.current;
                pendingIceRef.current = [];
                for (const c of buffered) {
                  try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch { /* ignore */ }
                }
              })
              .catch((err) => {
                setError('Kunde inte sätta answer från skärmen: ' + (err?.message || String(err)));
                setStatus('error');
              });
          }
          if (msg.type === 'webrtc-ice' && msg.candidate) {
            const candidate = msg.candidate as RTCIceCandidateInit;
            if (!remoteSetRef.current) {
              pendingIceRef.current.push(candidate);
              return;
            }
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => undefined);
          }
        });

        answerTimeoutRef.current = setTimeout(() => {
          if (pcRef.current && pcRef.current.connectionState !== 'connected') {
            setError(
              'Skärmen svarade inte inom 25s. Öppna https://fred-cast.vercel.app/receiver, behåll fliken öppen, och starta live igen.',
            );
            setStatus('error');
            try { pc.close(); } catch { /* ignore */ }
          }
        }, 25000);

        const offer = await pc.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);
        await new Promise((r) => setTimeout(r, 150));

        pwaReceiverAdapter.sendRaw(connectedDevice.id, {
          type: 'webrtc-offer',
          sdp: sdpPlain(pc.localDescription),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Kunde inte starta kameran.';
        if (/Permission|NotAllowed|denied/i.test(msg)) {
          setError('Kameran blockerades. Tillåt kamera i webbläsaren och försök igen.');
        } else {
          setError(msg);
        }
        setStatus('error');
        stop();
      }
    },
    [connectedDevice, stop],
  );

  return { status, error, start, stop };
}
