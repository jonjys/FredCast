import { describe, expect, it, vi } from 'vitest';
import { AuthzError, assertDashboardAccess, requireOrgAccess } from '@/lib/authz';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

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

describe('P0 Bugg 3: requireOrgAccess (route-level, 404 on mismatch)', () => {
  it('404s an unauthenticated request instead of a differentiated status', () => {
    expect(() => requireOrgAccess('org_123', undefined)).toThrow('NEXT_NOT_FOUND');
  });

  it('404s a signed-in user from a different org — org_456 cannot see org_123', () => {
    expect(() => requireOrgAccess('org_123', 'org_456')).toThrow('NEXT_NOT_FOUND');
  });

  it('allows a user whose org matches the route', () => {
    expect(() => requireOrgAccess('org_123', 'org_123')).not.toThrow();
  });
});
