import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useCast } from './CastProvider';

export type AutoConnectStatus = 'idle' | 'connecting' | 'connected' | 'error';

/**
 * Scanning the QR code on the receiver's TV screen (receiver/index.html)
 * opens the web app with `?connectCode=XXXXXX` in the URL — this hook reads
 * that once at startup and pairs automatically via the same
 * PwaReceiverAdapter path as manually typing the code in QrConnectScreen,
 * so a phone with no app installed can cast to a screen in zero taps after
 * the camera scan (PRODUCT_PLAN.md §9 QR fallback).
 *
 * Web-only: native builds don't receive query params the same way, and the
 * QR/manual-code flow already covers native until deep linking is wired up.
 */
export function useAutoConnectFromUrl(): AutoConnectStatus {
  const { pairWithCode } = useCast();
  const [status, setStatus] = useState<AutoConnectStatus>('idle');
  const attempted = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || attempted.current) return;
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('connectCode')?.replace(/\D/g, '');
    if (!code || code.length !== 6) return;

    attempted.current = true;
    setStatus('connecting');

    // Strip the param immediately so a refresh doesn't re-trigger pairing
    // against a code the receiver may have already rotated away from.
    params.delete('connectCode');
    const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : '');
    window.history.replaceState({}, '', cleanUrl);

    pairWithCode(code)
      .then(() => setStatus('connected'))
      .catch(() => setStatus('error'));
  }, [pairWithCode]);

  return status;
}
