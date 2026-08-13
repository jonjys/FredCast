import { revalidateTag } from 'next/cache';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { orgId, type } = await req.json();
  revalidateTag(`org:${orgId}:${type}`);
  return Response.json({ revalidated: true });
}
