import { beforeEach, describe, expect, it, vi } from 'vitest';

const { callOrder } = vi.hoisted(() => ({ callOrder: [] as string[] }));

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

vi.mock('@/lib/fred-client', () => ({
  getSummary: vi.fn(async () => {
    callOrder.push('start:summary');
    await new Promise((resolve) => setTimeout(resolve, 10));
    callOrder.push('end:summary');
    return { totalSaved: 3200000, avgROI: 14.2, decisionsCount: 128, activeLoans: 42, monthlyBurn: 210000 };
  }),
  getTimeSeries: vi.fn(async () => {
    callOrder.push('start:timeseries');
    await new Promise((resolve) => setTimeout(resolve, 5));
    callOrder.push('end:timeseries');
    return [{ date: '2026-07-14', value: 100 }];
  }),
  getBreakdown: vi.fn(async () => {
    callOrder.push('start:breakdown');
    await new Promise((resolve) => setTimeout(resolve, 1));
    callOrder.push('end:breakdown');
    return [{ category: 'Refinansiering', value: 100 }];
  }),
}));

const { auth } = await import('@clerk/nextjs/server');
const DashboardPage = (await import('@/app/dashboard/[id]/page')).default;

describe('app/dashboard/[id]/page (RSC)', () => {
  beforeEach(() => {
    callOrder.length = 0;
    vi.mocked(auth).mockReturnValue({ orgId: 'org_123' } as ReturnType<typeof auth>);
  });

  it('dispatches getSummary/getTimeSeries/getBreakdown in parallel — no client waterfall', async () => {
    await DashboardPage({ params: { id: 'org_123' }, searchParams: {} });

    // If the page awaited each fetcher one at a time (a waterfall), we'd
    // see start/end/start/end/start/end. Fetching in parallel means all
    // three starts happen before the first one finishes.
    const firstEndIndex = callOrder.findIndex((entry) => entry.startsWith('end:'));
    expect(callOrder.slice(0, firstEndIndex)).toEqual(
      expect.arrayContaining(['start:summary', 'start:timeseries', 'start:breakdown']),
    );
    expect(firstEndIndex).toBe(3);
  });

  it('renders for a signed-in user whose org matches the route', async () => {
    const result = await DashboardPage({ params: { id: 'org_123' }, searchParams: {} });
    expect(result).toBeTruthy();
  });

  it('404s when the signed-in org does not match the route (org_456 cannot see org_123)', async () => {
    vi.mocked(auth).mockReturnValue({ orgId: 'org_456' } as ReturnType<typeof auth>);
    await expect(DashboardPage({ params: { id: 'org_123' }, searchParams: {} })).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
  });
});
