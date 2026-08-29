import { NextResponse } from 'next/server';
const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

const unavailable = (message: string) => NextResponse.json(
  { status: 'UNAVAILABLE', data: [], message },
  { status: 503, headers: noStoreHeaders },
);

async function readAuthoritativeBackend(backendUrl: string) {
  const response = await fetch(`${backendUrl.replace(/\/$/, '')}/market/prices`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Authoritative market backend returned ${response.status}.`);
  return NextResponse.json(await response.json(), {
    headers: { ...noStoreHeaders, 'X-NEXI-Market-Source': 'NEXI_BACKEND' },
  });
}

export async function GET() {
  const backendUrl = process.env.NEXI_BACKEND_URL;
  try {
    if (backendUrl && /^https?:\/\//i.test(backendUrl)) {
      return await readAuthoritativeBackend(backendUrl);
    }
    return unavailable('Authoritative NEXI market backend is not configured.');
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : 'Market data could not be reached.');
  }
}
