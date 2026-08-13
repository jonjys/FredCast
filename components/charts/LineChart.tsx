'use client';

import { Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatSEK } from '@/lib/metrics';

export type ChartPoint = { date: string; value: number };

/**
 * Pure presentation: `data` and `total` are already computed upstream
 * (lib/metrics.ts / the FRED-platform API's summary endpoint). This
 * component must not derive or otherwise calculate anything from its
 * props — see __tests__/lineChart.test.tsx (P0 Bugg 2).
 */
export function LineChart({ title, data, total }: { title: string; data: ChartPoint[]; total: number }) {
  return (
    <div className="rounded-2xl bg-card p-4 xs:p-6">
      <p className="text-sm text-zinc-400">{title}</p>
      <p data-testid="total-saved" className="mb-4 font-mono text-2xl text-zinc-50">
        {formatSEK(total)}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <RechartsLineChart data={data}>
          <XAxis dataKey="date" stroke="#71717a" fontSize={12} tickLine={false} />
          <YAxis stroke="#71717a" fontSize={12} tickLine={false} width={48} />
          <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #27272a' }} />
          <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} dot={false} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
