/**
 * Fixtures for local development and tests only. lib/fred-client.ts (the
 * module the app actually ships) never imports this file — see the P0
 * Bugg 1 tests in __tests__/fredClient.test.ts, which fail the build's
 * test gate if any app/components/lib file ever does.
 */
import type { BreakdownEntry, Summary, TimeSeriesPoint } from './fred-client';

export const devSummary: Summary = {
  totalSaved: 3_200_000,
  avgROI: 14.2,
  decisionsCount: 128,
  activeLoans: 42,
  monthlyBurn: 210_000,
};

export const devTimeSeries: TimeSeriesPoint[] = [
  { date: '2026-07-14', value: 2_600_000 },
  { date: '2026-07-28', value: 2_950_000 },
  { date: '2026-08-13', value: 3_200_000 },
];

export const devBreakdown: BreakdownEntry[] = [
  { category: 'Refinansiering', value: 1_800_000 },
  { category: 'Rantehedging', value: 900_000 },
  { category: 'Ovrigt', value: 500_000 },
];
