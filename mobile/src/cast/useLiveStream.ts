import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useCast, pwaReceiverAdapter } from './CastProvider';

export type LiveStreamStatus = 'idle' | 'requesting-camera' | 'connecting' | 'live' | 'error';

// Same public STUN as receiver/index.html — discovers NAT addresses only.
// Same-Wi-Fi ("hemma") for this version; cross-network needs TURN.
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

/**
 * Live camera → paired PwaReceiver screen over WebRTC, signalled via relay.
 * Web-only (browser getUserMedia / RTCPeerConnection).
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
        // Socket may already be closed — fine.
      }
    }

    try {
      pcRef.current?.close();
    } catch {
      /* ignore */
    }
    pcRef.current = null;

    streamRef.current?.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch {
        /* ignore */
      }
    });
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

      // Clean previous session if any.
      clearAnswerTimeout();
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      try {
        pcRef.current?.close();
      } catch {
        /* ignore */
      }
      pcRef.current = null;
      pendingIceRef.current = [];
      remoteSetRef.current = false;

      setError(null);
      setStatus('requesting-camera');
      previewRef.current = previewEl;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
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
            try {
              pwaReceiverAdapter.sendRaw(connectedDevice.id, {
                type: 'webrtc-ice',
                candidate: event.candidate,
              });
            } catch {
              /* socket gone */
            }
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') {
            clearAnswerTimeout();
            setStatus('live');
          }
          if (pc.connectionState === 'failed') {
            setError('Anslutningen till skärmen tappades.');
            setStatus('error');
          }
        };

        unsubscribeRef.current = pwaReceiverAdapter.onMessage(connectedDevice.id, (msg) => {
          if (msg.type === 'webrtc-answer' && msg.sdp) {
            pc
              .setRemoteDescription(new RTCSessionDescription(msg.sdp as RTCSessionDescriptionInit))
              .then(async () => {
                remoteSetRef.current = true;
                const buffered = pendingIceRef.current;
                pendingIceRef.current = [];
                for (const c of buffered) {
                  try {
                    await pc.addIceCandidate(new RTCIceCandidate(c));
                  } catch {
                    /* ignore bad candidate */
                  }
                }
              })
              .catch(() => undefined);
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

        // If TV never answers (tab closed / relay drop), fail clearly.
        answerTimeoutRef.current = setTimeout(() => {
          if (pcRef.current && pcRef.current.connectionState !== 'connected') {
            setError('Skärmen svarade inte. Öppna receiver-sidan igen och starta om live.');
            setStatus('error');
            try {
              pc.close();
            } catch {
              /* ignore */
            }
          }
        }, 20000);

        const offer = await pc.createOffer({
          offerToReceiveAudio: false,
          offerToReceiveVideo: false,
        });
        await pc.setLocalDescription(offer);
        pwaReceiverAdapter.sendRaw(connectedDevice.id, {
          type: 'webrtc-offer',
          sdp: pc.localDescription,
        });
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
