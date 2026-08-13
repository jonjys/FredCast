/**
 * All arithmetic on dashboard numbers lives here, not in the chart
 * components (P0 Bugg 2) — components only ever render values this
 * module already computed.
 */

export type SeriesPoint = { date: string; value: number };

export function computeInterestSaved(actual: SeriesPoint[], baseline: SeriesPoint[]): number {
  const baselineByDate = new Map(baseline.map((point) => [point.date, point.value]));
  return actual.reduce((total, point) => {
    const baselineValue = baselineByDate.get(point.date);
    if (baselineValue === undefined) return total;
    return total + (baselineValue - point.value);
  }, 0);
}

export function formatSEK(value: number): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0,
  }).format(value);
}
