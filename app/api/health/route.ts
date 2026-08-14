// Otherwise Next statically prerenders this at build time, baking in
// whatever env vars were present during the build instead of checking
// them live on each request — defeating the point of a healthcheck.
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    status: 'ok',
    env: !!process.env.FRED_API_KEY,
  });
}
