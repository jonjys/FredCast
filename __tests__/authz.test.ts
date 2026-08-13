import { describe, expect, it } from 'vitest';
import { AuthzError, assertDashboardAccess } from '@/lib/authz';

describe('P0 Bugg 3: dashboardRequiresAuthAndOrgMatch', () => {
  const dashboard = { id: 'demo', orgId: 'org_a' };

  it('rejects an unauthenticated request', () => {
    expect(() => assertDashboardAccess(null, dashboard)).toThrow(AuthzError);
    try {
      assertDashboardAccess(null, dashboard);
    } catch (error) {
      expect((error as AuthzError).status).toBe(401);
    }
  });

  it('rejects a signed-in user from a different org', () => {
    const user = { id: 'u1', orgId: 'org_b' };
    expect(() => assertDashboardAccess(user, dashboard)).toThrow(/organization/i);
    try {
      assertDashboardAccess(user, dashboard);
    } catch (error) {
      expect((error as AuthzError).status).toBe(403);
    }
  });

  it('rejects a signed-in user with no org at all', () => {
    const user = { id: 'u1', orgId: null };
    expect(() => assertDashboardAccess(user, dashboard)).toThrow(AuthzError);
  });

  it('allows a user whose org matches the dashboard', () => {
    const user = { id: 'u1', orgId: 'org_a' };
    expect(() => assertDashboardAccess(user, dashboard)).not.toThrow();
  });
});
