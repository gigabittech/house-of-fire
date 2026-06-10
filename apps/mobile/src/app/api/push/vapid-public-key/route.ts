import { NextResponse } from 'next/server';
import { isVapidConfigured, readVapidConfigFromEnv } from '@hof/push';

export async function GET() {
  if (!isVapidConfigured()) {
    return NextResponse.json({ error: 'Push is not configured' }, { status: 503 });
  }

  const { publicKey } = readVapidConfigFromEnv();
  return NextResponse.json({ publicKey });
}
