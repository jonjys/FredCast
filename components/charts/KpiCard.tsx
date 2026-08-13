import { formatNumber, formatPercent, formatSEK } from '@/lib/metrics';

type Format = 'currency' | 'percent' | 'number';

/**
 * Pure presentation: `value` and `delta` are already computed upstream
 * (lib/metrics.ts / the FRED-platform API). This only formats a given
 * number for display — it never derives it from other data (P0 Bugg 2).
 */
export function KpiCard({
  title,
  value,
  format,
  delta,
}: {
  title: string;
  value: number;
  format: Format;
  delta?: number;
}) {
  const formatted =
    format === 'currency' ? formatSEK(value) : format === 'percent' ? formatPercent(value) : formatNumber(value);

  return (
    <div className="rounded-2xl bg-card p-4 xs:p-6">
      <p className="text-xs uppercase tracking-wide text-zinc-400">{title}</p>
      <p data-testid="kpi-value" className="mt-2 font-mono text-2xl text-zinc-50">
        {formatted}
      </p>
      {typeof delta === 'number' && (
        <p className={`mt-1 text-sm ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {delta >= 0 ? '+' : ''}
          {delta}%
        </p>
      )}
    </div>
  );
}
