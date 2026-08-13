import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { DashboardChart } from '@/components/charts/DashboardChart';
import { assertDashboardAccess } from '@/lib/authz';
import { getDashboardById } from '@/lib/dashboards';
import { fetchSeriesObservations } from '@/lib/fred-client';
import { computeInterestSaved, formatSEK } from '@/lib/metrics';

// Dashboard data depends on the signed-in user's org and live FRED data —
// never statically prerendered.
export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: { id: string } }) {
  const dashboard = getDashboardById(params.id);
  if (!dashboard) notFound();

  const { userId, orgId } = auth();
  assertDashboardAccess(userId ? { id: userId, orgId: orgId ?? null } : null, dashboard);

  const observations = await fetchSeriesObservations(dashboard.seriesId);
  // TODO(Modul 3 data layer): baseline should come from the org's actual
  // pre-refinancing rate series, not the same series compared to itself.
  // Wiring that is a separate data-modeling task; computeInterestSaved is
  // already unit-tested against a real baseline in __tests__/metrics.test.ts.
  const totalSaved = computeInterestSaved(observations, observations);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 xs:px-6">
      <h1 className="mb-6 text-xl font-semibold">{dashboard.title}</h1>
      <DashboardChart points={observations} totalSavedLabel={formatSEK(totalSaved)} />
    </main>
  );
}
