import { PDFDocument, StandardFonts, degrees, rgb } from 'pdf-lib';

/**
 * P0 Bugg 4: every exported PDF must carry this watermark — a dashboard
 * screenshot ending up in someone's inbox outside the org shouldn't read
 * as an unmarked, official-looking report.
 */
export const WATERMARK_TEXT = 'FRED CONFIDENTIAL';

export type DashboardPdfInput = {
  title: string;
  totalSavedLabel: string;
  points: { date: string; value: number }[];
  exportedBy?: string;
};

export async function generateDashboardPdf(input: DashboardPdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  page.drawText(input.title, { x: 50, y: 780, size: 20, font: boldFont, color: rgb(1, 1, 1) });
  page.drawText(`Sparad ranta: ${input.totalSavedLabel}`, {
    x: 50,
    y: 745,
    size: 14,
    font,
    color: rgb(1, 1, 1),
  });
  if (input.exportedBy) {
    page.drawText(`Exporterad av: ${input.exportedBy}`, {
      x: 50,
      y: 725,
      size: 10,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });
  }

  let y = 695;
  for (const point of input.points) {
    if (y < 60) break;
    page.drawText(`${point.date}   ${point.value}`, { x: 50, y, size: 10, font, color: rgb(0.7, 0.7, 0.7) });
    y -= 14;
  }

  page.drawText(WATERMARK_TEXT, {
    x: 90,
    y: 400,
    size: 48,
    font: boldFont,
    color: rgb(0.55, 0.55, 0.55),
    opacity: 0.3,
    rotate: degrees(35),
  });

  return doc.save();
}
