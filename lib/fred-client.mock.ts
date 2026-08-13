/**
 * Fixtures for local development and tests only. lib/fred-client.ts (the
 * module the app actually ships) never imports this file — see the P0
 * Bugg 1 test in __tests__/fred-client.test.ts, which fails the build's
 * test gate if any app/components/lib file ever does.
 */
import type { FredObservation } from './fred-client';

export const mockSeriesObservations: FredObservation[] = [
  { date: '2026-01-01', value: 4.1 },
  { date: '2026-02-01', value: 4.05 },
  { date: '2026-03-01', value: 3.9 },
];
