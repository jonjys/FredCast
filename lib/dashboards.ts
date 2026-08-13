/**
 * Placeholder dashboard-metadata store (id/title/org ownership) so the
 * auth + org-match flow (P0 Bugg 3) has something real to check against.
 * Not FRED financial data — swap for the real DB lookup once Modul 3's
 * data layer lands; the shape (id, orgId, title, seriesId) is what
 * app/dashboard/[id]/page.tsx and lib/authz.ts depend on.
 */

export type DashboardRecord = {
  id: string;
  orgId: string;
  title: string;
  seriesId: string;
};

const DASHBOARDS: DashboardRecord[] = [
  { id: 'demo', orgId: 'org_demo', title: 'Acme AB — Rantekostnad', seriesId: 'DGS10' },
];

export function getDashboardById(id: string): DashboardRecord | null {
  return DASHBOARDS.find((dashboard) => dashboard.id === id) ?? null;
}
