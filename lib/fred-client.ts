import { z } from 'zod';

/**
 * Server-only client for the FRED-platform analytics API. This file must
 * never contain or fall back to sample/fixture data — if it isn't
 * configured, it fails closed instead of quietly serving fake numbers to
 * a dashboard a CFO is looking at (P0 Bugg 1). Dev/test fixtures live in
 * a separate sibling file that nothing under app/ or components/ may
 * import (see the P0 Bugg 1 tests in __tests__/fredClient.test.ts).
 */

export class FredConfigError extends Error {}

const SummarySchema = z.object({
  totalSaved: z.number(),
  avgROI: z.number(),
  decisionsCount: z.number(),
  activeLoans: z.number(),
  monthlyBurn: z.number(),
});

const TimeSeriesSchema = z.array(
  z.object({
    date: z.string(),
    value: z.number(),
  }),
);

const BreakdownSchema = z.array(
  z.object({
    category: z.string(),
    value: z.number(),
  }),
);

export type Summary = z.infer<typeof SummarySchema>;
export type TimeSeriesPoint = z.infer<typeof TimeSeriesSchema>[number];
export type BreakdownEntry = z.infer<typeof BreakdownSchema>[number];

function getConfig(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.FRED_API_URL;
  const apiKey = process.env.FRED_API_KEY;
  if (!baseUrl || !apiKey) {
    throw new FredConfigError(
      'FRED_API_URL / FRED_API_KEY is not set. Refusing to serve dashboard data without it.',
    );
  }
  return { baseUrl, apiKey };
}

function authHeaders(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export async function getSummary(orgId: string): Promise<Summary> {
  const { baseUrl, apiKey } = getConfig();
  const res = await fetch(`${baseUrl}/api/analytics/summary?orgId=${orgId}`, {
    headers: authHeaders(apiKey),
    next: { tags: [`org:${orgId}:summary`] },
  });
  if (!res.ok) throw new Error('Failed to fetch summary');
  return SummarySchema.parse(await res.json());
}

export async function getTimeSeries(
  orgId: string,
  metric: string,
  from: string,
  to: string,
): Promise<TimeSeriesPoint[]> {
  const { baseUrl, apiKey } = getConfig();
  const url = new URL(`${baseUrl}/api/analytics/timeseries`);
  url.searchParams.set('orgId', orgId);
  url.searchParams.set('metric', metric);
  url.searchParams.set('from', from);
  url.searchParams.set('to', to);

  const res = await fetch(url, {
    headers: authHeaders(apiKey),
    next: { tags: [`org:${orgId}:timeseries:${metric}`] },
  });
  if (!res.ok) throw new Error('Failed to fetch timeseries');
  return TimeSeriesSchema.parse(await res.json());
}

export async function getBreakdown(orgId: string, by: string): Promise<BreakdownEntry[]> {
  const { baseUrl, apiKey } = getConfig();
  const res = await fetch(`${baseUrl}/api/analytics/breakdown?orgId=${orgId}&by=${by}`, {
    headers: authHeaders(apiKey),
    next: { tags: [`org:${orgId}:breakdown:${by}`] },
  });
  if (!res.ok) throw new Error('Failed to fetch breakdown');
  return BreakdownSchema.parse(await res.json());
}
