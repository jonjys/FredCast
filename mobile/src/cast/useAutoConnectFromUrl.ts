import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useCast } from './CastProvider';

export type AutoConnectStatus = 'idle' | 'connecting' | 'connected' | 'error' | 'connect-page';

function extractConnectCode(): { code: string | null; isConnectRoute: boolean } {
  if (typeof window === 'undefined') return { code: null, isConnectRoute: false };
  const { pathname, search, hash } = window.location;
  const params = new URLSearchParams(search);
  if (hash && hash.includes('=')) {
    const hp = new URLSearchParams(hash.replace(/^#/, ''));
    hp.forEach((v, k) => {
      if (!params.has(k)) params.set(k, v);
    });
  }

  const fromQuery = (params.get('connectCode') || params.get('code') || '').replace(/\D/g, '');
  const pathMatch = pathname.match(/\/connect\/(\d{6})\b/);
  const fromPath = pathMatch ? pathMatch[1] : '';
  const code = (fromQuery.length === 6 ? fromQuery : fromPath.length === 6 ? fromPath : '').slice(0, 6) || null;
  const isConnectRoute = pathname === '/connect' || pathname.startsWith('/connect/');
  return { code, isConnectRoute };
}

/**
 * /connect and ?connectCode=XXXXXX — QR 482 019 flow, standalone.
 * Also used when FredCast is iframed from fred-platform /core/cast.
 */
export function useAutoConnectFromUrl(): AutoConnectStatus {
  const { pairWithCode } = useCast();
  const [status, setStatus] = useState<AutoConnectStatus>('idle');
  const attempted = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || attempted.current) return;
    if (typeof window === 'undefined') return;

    const { code, isConnectRoute } = extractConnectCode();
    if (!code || code.length !== 6) {
      if (isConnectRoute) setStatus('connect-page');
      return;
    }

    attempted.current = true;
    setStatus('connecting');

    const params = new URLSearchParams(window.location.search);
    params.delete('connectCode');
    params.delete('code');
    const keepPath = isConnectRoute ? '/connect' : window.location.pathname;
    const cleanUrl = keepPath + (params.toString() ? `?${params}` : '');
    window.history.replaceState({}, '', cleanUrl);

    pairWithCode(code)
      .then(() => setStatus('connected'))
      .catch(() => setStatus('error'));
  }, [pairWithCode]);

  return status;
}
