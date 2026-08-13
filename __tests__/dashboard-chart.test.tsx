import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardChart } from '@/components/charts/DashboardChart';

describe('P0 Bugg 2: chartDoesNotCalculate', () => {
  it('renders exactly the precomputed total it is given, not a recalculation', () => {
    // If the component summed/derived from `points` internally, this
    // deliberately-mismatched label would not come through unchanged.
    const points = [
      { date: '2026-01', value: 100 },
      { date: '2026-02', value: 200 },
    ];
    render(<DashboardChart points={points} totalSavedLabel="3 200 000 kr" />);
    expect(screen.getByTestId('total-saved')).toHaveTextContent('3 200 000 kr');
  });

  it('the chart component performs no arithmetic on its data prop', () => {
    const src = fs.readFileSync(
      path.join(process.cwd(), 'components/charts/DashboardChart.tsx'),
      'utf8',
    );
    expect(src).not.toMatch(/\.reduce\(/);
    expect(src).not.toMatch(/points\.map\([^)]*[-+*/]/);
    expect(src).not.toMatch(/\bsum\b/i);
  });
});
