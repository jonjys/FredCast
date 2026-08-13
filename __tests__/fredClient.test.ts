import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const ROOT = process.cwd();
const ORIGINAL_URL = process.env.FRED_API_URL;
const ORIGINAL_KEY = process.env.FRED_API_KEY;

function collectSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectSourceFiles(full);
    if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.mock.ts')) return [full];
    return [];
  });
}

describe('P0 Bugg 1: mockDataNotInProdBuild', () => {
  beforeEach(() => {
    delete process.env.FRED_API_URL;
    delete process.env.FRED_API_KEY;
  });

  afterEach(() => {
    if (ORIGINAL_URL) process.env.FRED_API_URL = ORIGINAL_URL;
    if (ORIGINAL_KEY) process.env.FRED_API_KEY = ORIGINAL_KEY;
    vi.unstubAllGlobals();
  });

  it('throws instead of silently falling back to mock data when unconfigured', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const { getSummary, FredConfigError } = await import('@/lib/fred-client');
    await expect(getSummary('org_123')).rejects.toBeInstanceOf(FredConfigError);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('the production FRED client file contains no mock/sample data', () => {
    const src = fs.readFileSync(path.join(ROOT, 'lib/fred-client.ts'), 'utf8');
    expect(src).not.toMatch(/mock/i);
    expect(src).not.toMatch(/sample.?data/i);
  });

  it('no file that ships in the app/component bundle imports the mock FRED fixtures', () => {
    const files = [
      ...collectSourceFiles(path.join(ROOT, 'app')),
      ...collectSourceFiles(path.join(ROOT, 'components')),
      ...collectSourceFiles(path.join(ROOT, 'lib')),
    ];
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const src = fs.readFileSync(file, 'utf8');
      expect(src, `${file} must not import fred-client.mock`).not.toMatch(/fred-client\.mock/);
    }
  });
});

describe('lib/fred-client typed fetchers', () => {
  beforeEach(() => {
    process.env.FRED_API_URL = 'https://fred-platform.vercel.app';
    process.env.FRED_API_KEY = 'test-key';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('getSummary parses a valid response and sends the org cache tag + bearer auth', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        totalSaved: 3200000,
        avgROI: 14.2,
        decisionsCount: 128,
        activeLoans: 42,
        monthlyBurn: 210000,
      }),
    }));
    vi.stubGlobal('fetch', fetchSpy);

    const { getSummary } = await import('@/lib/fred-client');
    const summary = await getSummary('org_123');

    expect(summary.totalSaved).toBe(3200000);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain('orgId=org_123');
    expect(init.headers.Authorization).toBe('Bearer test-key');
    expect(init.next.tags).toEqual(['org:org_123:summary']);
  });

  it('getSummary rejects a response that fails Zod validation', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => ({ totalSaved: 'not-a-number' }) })),
    );
    const { getSummary } = await import('@/lib/fred-client');
    await expect(getSummary('org_123')).rejects.toThrow();
  });

  it('getTimeSeries builds from/to/metric query params and its own cache tag', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => [{ date: '2026-07-14', value: 100 }],
    }));
    vi.stubGlobal('fetch', fetchSpy);

    const { getTimeSeries } = await import('@/lib/fred-client');
    const series = await getTimeSeries('org_123', 'totalSaved', '2026-07-14', '2026-08-13');

    expect(series).toEqual([{ date: '2026-07-14', value: 100 }]);
    const [url, init] = fetchSpy.mock.calls[0];
    const calledUrl = new URL(String(url));
    expect(calledUrl.searchParams.get('orgId')).toBe('org_123');
    expect(calledUrl.searchParams.get('metric')).toBe('totalSaved');
    expect(calledUrl.searchParams.get('from')).toBe('2026-07-14');
    expect(calledUrl.searchParams.get('to')).toBe('2026-08-13');
    expect(init.next.tags).toEqual(['org:org_123:timeseries:totalSaved']);
  });

  it('getBreakdown sends the by-dimension cache tag', async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      json: async () => [{ category: 'Refinansiering', value: 100 }],
    }));
    vi.stubGlobal('fetch', fetchSpy);

    const { getBreakdown } = await import('@/lib/fred-client');
    const breakdown = await getBreakdown('org_123', 'category');

    expect(breakdown).toEqual([{ category: 'Refinansiering', value: 100 }]);
    const [, init] = fetchSpy.mock.calls[0];
    expect(init.next.tags).toEqual(['org:org_123:breakdown:category']);
  });

  it('rejects when the API responds not-ok', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, json: async () => ({}) })));
    const { getSummary } = await import('@/lib/fred-client');
    await expect(getSummary('org_123')).rejects.toThrow('Failed to fetch summary');
  });
});
