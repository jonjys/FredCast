/**
 * Where to find the FredCast relay for the PWA-receiver fallback adapter.
 * Production default: hosted Render free tier. Override with
 * EXPO_PUBLIC_RELAY_WS_URL for local dev (ws://localhost:8787/ws).
 */
export const RELAY_WS_URL =
  process.env.EXPO_PUBLIC_RELAY_WS_URL || 'wss://fredcast-relay.onrender.com/ws';
