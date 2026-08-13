import fs from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LineChart } from '@/components/charts/LineChart';
import { formatSEK } from '@/lib/metrics';

describe('P0 Bugg 2: chartDoesNotCalculate (LineChart)', () => {
  it('renders exactly the precomputed total it is given, not a recalculation', () => {
    // If the component summed/derived from `data` internally, this
    // deliberately-mismatched total would not come through unchanged.
    const data = [
      { date: '2026-07-14', value: 100 },
      { date: '2026-08-13', value: 200 },
    ];
    render(<LineChart title="Sparad ranta over tid" data={data} total={3200000} />);
    // toHaveTextContent's whitespace normalizer mangles the non-breaking
    // spaces sv-SE currency formatting uses — compare textContent directly.
    expect(screen.getByTestId('total-saved').textContent).toBe(formatSEK(3200000));
  });

  it('the component performs no arithmetic on its data prop', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'components/charts/LineChart.tsx'), 'utf8');
    expect(src).not.toMatch(/\.reduce\(/);
    expect(src).not.toMatch(/data\.map\([^)]*[-+*/]/);
  });
});
