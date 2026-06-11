import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    return NextResponse.json(session ?? { user: null, expires: null });
  } catch (error) {
    console.error('Session endpoint error:', error);
    return NextResponse.json({ user: null, expires: null }, { status: 200 });
  }
}
