import { describe, expect, it } from 'vitest';
import { computeInterestSaved, formatSEK } from '@/lib/metrics';

describe('lib/metrics', () => {
  it('sums the per-date difference between baseline and actual', () => {
    const baseline = [
      { date: '2026-01', value: 1000 },
      { date: '2026-02', value: 1000 },
    ];
    const actual = [
      { date: '2026-01', value: 800 },
      { date: '2026-02', value: 700 },
    ];
    expect(computeInterestSaved(actual, baseline)).toBe(500);
  });

  it('ignores actual points with no matching baseline date', () => {
    const baseline = [{ date: '2026-01', value: 1000 }];
    const actual = [
      { date: '2026-01', value: 800 },
      { date: '2026-99', value: 1 },
    ];
    expect(computeInterestSaved(actual, baseline)).toBe(200);
  });

  it('formats SEK with no decimals', () => {
    expect(formatSEK(3200000)).toContain('3');
    expect(formatSEK(3200000)).not.toMatch(/,\d{2}\s*kr/);
  });
});
