/**
 * Where to find the FredCast relay for the PWA-receiver fallback adapter.
 * In production this would be a stable hosted relay URL; for local
 * development/testing it points at a relay run alongside the app
 * (see relay/README or repo root README "Köra relayn").
 */
export const RELAY_WS_URL = process.env.EXPO_PUBLIC_RELAY_WS_URL || 'ws://localhost:8787/ws';
