'use client';

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export type BreakdownPoint = { category: string; value: number };

/**
 * Pure presentation — renders exactly the category/value pairs it's
 * given, no aggregation or derivation (P0 Bugg 2).
 */
export function BarChart({ title, data }: { title: string; data: BreakdownPoint[] }) {
  return (
    <div className="rounded-2xl bg-card p-4 xs:p-6">
      <p className="mb-4 text-sm text-zinc-400">{title}</p>
      <ResponsiveContainer width="100%" height={220}>
        <RechartsBarChart data={data}>
          <XAxis dataKey="category" stroke="#71717a" fontSize={12} tickLine={false} />
          <YAxis stroke="#71717a" fontSize={12} tickLine={false} width={48} />
          <Tooltip contentStyle={{ background: '#18181B', border: '1px solid #27272a' }} />
          <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
