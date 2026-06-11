import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

function base64UrlEncode(input: string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

export async function POST(req: NextRequest) {
  try {
    const sdkKey = process.env.ZOOM_MEETING_SDK_KEY || process.env.NEXT_PUBLIC_ZOOM_MEETING_SDK_KEY;
    const sdkSecret = process.env.ZOOM_MEETING_SDK_SECRET;

    if (!sdkKey || !sdkSecret) {
      return NextResponse.json({ message: 'Zoom SDK credentials are not configured.' }, { status: 500 });
    }

    const body = await req.json();
    const meetingNumber = String(body?.meetingNumber || '').replace(/\D/g, '');
    const role = Number(body?.role) === 1 ? 1 : 0;

    if (!meetingNumber) {
      return NextResponse.json({ message: 'meetingNumber is required.' }, { status: 400 });
    }

    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const payload = {
      sdkKey,
      mn: meetingNumber,
      role,
      iat,
      exp,
      appKey: sdkKey,
      tokenExp: exp,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const message = `${encodedHeader}.${encodedPayload}`;

    const signature = crypto
      .createHmac('sha256', sdkSecret)
      .update(message)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');

    return NextResponse.json({ signature: `${message}.${signature}` });
  } catch (error) {
    console.error('zoom-signature error', error);
    return NextResponse.json({ message: 'Failed to generate Zoom signature.' }, { status: 500 });
  }
}