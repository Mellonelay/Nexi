import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = process.env.NEXI_BACKEND_URL?.replace(/\/$/, '');
  if (!backendUrl) {
    return NextResponse.json({
      status: 'UNAVAILABLE',
      data: [],
      message: 'Authoritative NEXI Binary configuration is not configured.',
    }, { status: 503 });
  }

  try {
    const response = await fetch(`${backendUrl}/binary/config`, {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: { 'content-type': response.headers.get('content-type') ?? 'application/json' },
    });
  } catch {
    return NextResponse.json({
      status: 'UNAVAILABLE',
      data: [],
      message: 'Authoritative NEXI Binary configuration is unavailable.',
    }, { status: 503 });
  }
}
