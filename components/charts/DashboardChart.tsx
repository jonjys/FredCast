'use client';

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type ChartPoint = { date: string; value: number };

/**
 * Pure presentation: every number here (points, totalSavedLabel) is
 * already computed by lib/metrics.ts. This component must not derive or
 * otherwise calculate anything from its props — see
 * __tests__/dashboard-chart.test.tsx (P0 Bugg 2).
 */
export function DashboardChart({
  points,
  totalSavedLabel,
}: {
  points: ChartPoint[];
  totalSavedLabel: string;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 xs:p-6">
      <p className="text-sm text-zinc-400">Sparad ranta</p>
      <p data-testid="total-saved" className="mb-4 font-mono text-2xl text-zinc-50">
        {totalSavedLabel}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={points}>
          <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} />
          <YAxis stroke="#71717a" fontSize={12} tickLine={false} width={48} />
          <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #27272a' }} />
          <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
