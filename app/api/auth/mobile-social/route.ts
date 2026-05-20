import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'superLongRandomSecret123!@#$%^&*()_+-=abcDEF987654321xyz'
);

type Provider = 'google' | 'github';

async function fetchGoogleProfile(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Google authentication failed.');
  const data = await res.json();
  return {
    email: String(data?.email || '').trim().toLowerCase(),
    fullName: String(data?.name || '').trim(),
  };
}

async function exchangeGithubCodeForToken(code: string, redirectUri?: string) {
  const clientId = process.env.GITHUB_ID || '';
  const clientSecret = process.env.GITHUB_SECRET || '';
  if (!clientId || !clientSecret) {
    throw new Error('GitHub OAuth is not configured on server.');
  }
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
  });
  if (redirectUri) body.set('redirect_uri', redirectUri);
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  const tokenData = await tokenRes.json();
  const accessToken = String(tokenData?.access_token || '').trim();
  if (!accessToken) throw new Error('GitHub token exchange failed.');
  return accessToken;
}

async function fetchGithubProfile(accessToken: string) {
  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'User-Agent': 'aivora-mobile',
      Accept: 'application/vnd.github+json',
    },
  });
  if (!userRes.ok) throw new Error('GitHub authentication failed.');
  const user = await userRes.json();
  let email = String(user?.email || '').trim().toLowerCase();
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'aivora-mobile',
        Accept: 'application/vnd.github+json',
      },
    });
    if (emailsRes.ok) {
      const emails = (await emailsRes.json()) as Array<{ email: string; verified: boolean; primary: boolean }>;
      const best =
        emails.find((e) => e.verified && !String(e.email || '').endsWith('@users.noreply.github.com')) ||
        emails.find((e) => !String(e.email || '').endsWith('@users.noreply.github.com')) ||
        emails.find((e) => e.primary) ||
        emails[0];
      email = String(best?.email || '').trim().toLowerCase();
    }
  }
  return {
    email,
    fullName: String(user?.name || user?.login || '').trim(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const provider = String(body?.provider || '').toLowerCase() as Provider;
    const accessTokenInput = String(body?.accessToken || '').trim();
    const code = String(body?.code || '').trim();
    const redirectUri = String(body?.redirectUri || '').trim();

    if (provider !== 'google' && provider !== 'github') {
      return NextResponse.json({ message: 'Unsupported provider.' }, { status: 400 });
    }

    let profile: { email: string; fullName: string };
    if (provider === 'google') {
      if (!accessTokenInput) {
        return NextResponse.json({ message: 'Google access token is required.' }, { status: 400 });
      }
      profile = await fetchGoogleProfile(accessTokenInput);
    } else {
      const githubToken = accessTokenInput || (code ? await exchangeGithubCodeForToken(code, redirectUri || undefined) : '');
      if (!githubToken) {
        return NextResponse.json({ message: 'GitHub authorization code or token is required.' }, { status: 400 });
      }
      profile = await fetchGithubProfile(githubToken);
    }

    if (!profile.email) {
      return NextResponse.json({ message: 'No verified email returned by provider.' }, { status: 400 });
    }

    const [existingRows] = await pool.query<RowDataPacket[]>(
      'SELECT u.id, u.fullName, u.email, u.status, r.name AS role FROM user u JOIN role r ON u.roleId = r.id WHERE u.email = ? LIMIT 1',
      [profile.email]
    );

    let user = existingRows[0];
    if (!user) {
      const [roleRows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM role WHERE name = ? LIMIT 1',
        ['student']
      );
      if (roleRows.length === 0) {
        return NextResponse.json({ message: "Role 'student' not found" }, { status: 500 });
      }
      const pseudoPassword = await bcrypt.hash(`${provider}:${profile.email}:${Date.now()}`, 10);
      await pool.query(
        `INSERT INTO user (id, roleId, fullName, email, passwordHash, status, createdAt, updatedAt)
         VALUES (UUID(), ?, ?, ?, ?, 'active', NOW(), NOW())`,
        [roleRows[0].id, profile.fullName || 'Student', profile.email, pseudoPassword]
      );
      const [createdRows] = await pool.query<RowDataPacket[]>(
        'SELECT u.id, u.fullName, u.email, u.status, r.name AS role FROM user u JOIN role r ON u.roleId = r.id WHERE u.email = ? LIMIT 1',
        [profile.email]
      );
      user = createdRows[0];
    }

    if (!user || user.status !== 'active') {
      return NextResponse.json({ message: 'Account is not active.' }, { status: 403 });
    }

    const session = {
      id: String(user.id),
      email: String(user.email),
      fullName: String(user.fullName || profile.fullName || ''),
      role: String(user.role || 'student'),
    };

    const token = await new SignJWT(session)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secretKey);

    const response = NextResponse.json({
      success: true,
      user: session,
    });

    response.cookies.set('aivora_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Mobile social auth error:', error);
    return NextResponse.json(
      { message: error?.message || 'Social authentication failed.' },
      { status: 500 }
    );
  }
}
