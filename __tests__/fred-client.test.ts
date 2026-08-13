import fs from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const ROOT = process.cwd();

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
  const originalKey = process.env.FRED_API_KEY;

  beforeEach(() => {
    delete process.env.FRED_API_KEY;
  });

  afterEach(() => {
    if (originalKey) process.env.FRED_API_KEY = originalKey;
  });

  it('throws instead of silently falling back to mock data when unconfigured', async () => {
    const { fetchSeriesObservations, FredConfigError } = await import('@/lib/fred-client');
    await expect(fetchSeriesObservations('DGS10')).rejects.toBeInstanceOf(FredConfigError);
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
