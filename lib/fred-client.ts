/**
 * Server-only client for the FRED (Federal Reserve Economic Data) API.
 * This file must never contain or fall back to sample/fixture data — if
 * it isn't configured, it fails closed instead of quietly serving fake
 * numbers to a dashboard a CFO is looking at (P0 Bugg 1). Dev/test
 * fixtures live in a separate sibling file that nothing under app/ or
 * components/ may import (see the P0 Bugg 1 test).
 */

const FRED_BASE_URL = 'https://api.stlouisfed.org/fred';

export class FredConfigError extends Error {}

export type FredObservation = { date: string; value: number };

function getApiKey(): string {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    throw new FredConfigError(
      'FRED_API_KEY is not set. Refusing to serve dashboard data without it.',
    );
  }
  return key;
}

export async function fetchSeriesObservations(seriesId: string): Promise<FredObservation[]> {
  const apiKey = getApiKey();
  const url = `${FRED_BASE_URL}/series/observations?series_id=${encodeURIComponent(
    seriesId,
  )}&api_key=${apiKey}&file_type=json`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FRED API error ${res.status} for series ${seriesId}`);
  }

  const data = (await res.json()) as { observations?: Array<{ date: string; value: string }> };
  return (data.observations ?? [])
    .filter((observation) => observation.value !== '.')
    .map((observation) => ({ date: observation.date, value: Number(observation.value) }));
}
