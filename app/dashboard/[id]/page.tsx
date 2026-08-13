import { auth } from '@clerk/nextjs/server';
import { BarChart } from '@/components/charts/BarChart';
import { KpiCard } from '@/components/charts/KpiCard';
import { LineChart } from '@/components/charts/LineChart';
import { DateRangePicker } from '@/components/DateRangePicker';
import { ExportMenu } from '@/components/ExportMenu';
import { requireOrgAccess } from '@/lib/authz';
import { getBreakdown, getSummary, getTimeSeries } from '@/lib/fred-client';

// Depends on the signed-in user's org and live FRED-platform data — never
// statically prerendered.
export const dynamic = 'force-dynamic';

const DEFAULT_FROM = '2026-07-14';
const DEFAULT_TO = '2026-08-13';

export default async function DashboardPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { from?: string; to?: string };
}) {
  const { orgId } = auth();
  requireOrgAccess(params.id, orgId);

  const from = searchParams.from ?? DEFAULT_FROM;
  const to = searchParams.to ?? DEFAULT_TO;

  // Fetched together, not one after another — a sequential await chain
  // here would be a client/server waterfall (see __tests__/dashboardPage.test.ts).
  const [summary, timeSeries, breakdown] = await Promise.all([
    getSummary(params.id),
    getTimeSeries(params.id, 'totalSaved', from, to),
    getBreakdown(params.id, 'category'),
  ]);

  return (
    <div className="mx-auto max-w-[1920px] p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#FAFAFA]">Oversikt</h1>
        <div className="flex gap-2">
          <DateRangePicker defaultFrom={DEFAULT_FROM} defaultTo={DEFAULT_TO} />
          <ExportMenu orgId={params.id} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="TOTAL SPARAD RANTA" value={summary.totalSaved} format="currency" delta={12.4} />
        <KpiCard title="GENOMSNITTLIG ROI" value={summary.avgROI} format="percent" delta={-2.1} />
        <KpiCard title="BESLUT FATTAT" value={summary.decisionsCount} format="number" />
        <KpiCard title="AKTIVA LAN" value={summary.activeLoans} format="number" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <LineChart title="Sparad ranta over tid" data={timeSeries} total={summary.totalSaved} />
        <BarChart title="Fordelning per kategori" data={breakdown} />
      </div>
    </div>
  );
}
