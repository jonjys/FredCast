import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { AuthzError, assertDashboardAccess } from '@/lib/authz';
import { getDashboardById } from '@/lib/dashboards';
import { fetchSeriesObservations } from '@/lib/fred-client';
import { computeInterestSaved, formatSEK } from '@/lib/metrics';
import { generateDashboardPdf } from '@/lib/pdf';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const dashboard = getDashboardById(params.id);
  if (!dashboard) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { userId, orgId } = auth();
  try {
    assertDashboardAccess(userId ? { id: userId, orgId: orgId ?? null } : null, dashboard);
  } catch (error) {
    if (error instanceof AuthzError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }

  const observations = await fetchSeriesObservations(dashboard.seriesId);
  const totalSaved = computeInterestSaved(observations, observations);
  const pdfBytes = await generateDashboardPdf({
    title: dashboard.title,
    totalSavedLabel: formatSEK(totalSaved),
    points: observations,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${dashboard.id}.pdf"`,
    },
  });
}
