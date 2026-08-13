import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getSummary, getTimeSeries } from '@/lib/fred-client';
import { formatSEK } from '@/lib/metrics';
import { generateDashboardPdf } from '@/lib/pdf';

const DEFAULT_FROM = '2026-07-14';
const DEFAULT_TO = '2026-08-13';

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId');
  if (!orgId) {
    return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
  }

  const { orgId: sessionOrgId } = auth();
  // Same 404-not-403 posture as the dashboard page: don't confirm via
  // status code whether an org's dashboard exists to a caller who can't
  // access it.
  if (!sessionOrgId || sessionOrgId !== orgId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const user = await currentUser();

  let orgName = orgId;
  try {
    const client = await clerkClient();
    const organization = await client.organizations.getOrganization({ organizationId: orgId });
    orgName = organization.name;
  } catch {
    // Fall back to the raw orgId — export must still succeed even if the
    // org-name lookup fails.
  }

  const [summary, timeSeries] = await Promise.all([
    getSummary(orgId),
    getTimeSeries(orgId, 'totalSaved', DEFAULT_FROM, DEFAULT_TO),
  ]);

  const pdfBytes = await generateDashboardPdf({
    title: `${orgName} — Sparad ranta`,
    totalSavedLabel: formatSEK(summary.totalSaved),
    points: timeSeries,
    exportedBy: user?.primaryEmailAddress?.emailAddress,
  });

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${orgId}-dashboard.pdf"`,
    },
  });
}
