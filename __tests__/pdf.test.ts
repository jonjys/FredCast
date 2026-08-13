// @vitest-environment node
// pdf-parse's pdfjs backend needs a real Node environment — under jsdom it
// thinks it's in a browser and looks for a PDF.js worker that isn't there.
import { describe, expect, it } from 'vitest';
import { WATERMARK_TEXT, generateDashboardPdf } from '@/lib/pdf';

describe('P0 Bugg 4: pdfContainsWatermark', () => {
  it('embeds the watermark text in every generated PDF', async () => {
    const bytes = await generateDashboardPdf({
      title: 'Acme AB',
      totalSavedLabel: '3 200 000 kr',
      points: [{ date: '2026-01', value: 100 }],
    });

    const pdfParse = (await import('pdf-parse')).default;
    const parsed = await pdfParse(Buffer.from(bytes));
    expect(parsed.text).toContain(WATERMARK_TEXT);
  });
});
