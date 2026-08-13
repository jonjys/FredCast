/**
 * RLS-style access rule (P0 Bugg 3): a dashboard is visible only to an
 * authenticated user whose Clerk org matches the dashboard's owning org.
 * Kept as a pure function so it's testable without a live Clerk session —
 * app/dashboard/[id]/page.tsx and the PDF route call it with the values
 * Clerk's auth() and the dashboard record give them.
 */

export class AuthzError extends Error {
  status: 401 | 403;

  constructor(message: string, status: 401 | 403) {
    super(message);
    this.name = 'AuthzError';
    this.status = status;
  }
}

export type AuthUser = { id: string; orgId: string | null } | null | undefined;
export type DashboardRecord = { id: string; orgId: string };

export function assertDashboardAccess(user: AuthUser, dashboard: DashboardRecord): void {
  if (!user) {
    throw new AuthzError('Authentication required', 401);
  }
  if (!user.orgId || user.orgId !== dashboard.orgId) {
    throw new AuthzError('Dashboard belongs to a different organization', 403);
  }
}
