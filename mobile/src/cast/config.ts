/**
 * FredCast relay endpoints.
 * Production: Render free tier. Override with EXPO_PUBLIC_RELAY_* for local dev.
 */
export const RELAY_WS_URL =
  process.env.EXPO_PUBLIC_RELAY_WS_URL || 'wss://fredcast-relay.onrender.com/ws';

/** HTTP base for /api/groups and /new-code (same host as WS, without /ws). */
export const RELAY_HTTP_URL =
  process.env.EXPO_PUBLIC_RELAY_HTTP_URL ||
  RELAY_WS_URL.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:').replace(/\/ws$/, '');
