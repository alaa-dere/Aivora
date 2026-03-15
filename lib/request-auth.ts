import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import { hasPermission, Permission, Role } from './permissions';

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'superLongRandomSecret123!@#$%^&*()_+-=abcDEF987654321xyz'
);

export async function getRequestRole(req: Request): Promise<Role | null> {
  const cookieStore = await cookies();
  const legacyToken = cookieStore.get('aivora_session')?.value;

  if (legacyToken) {
    try {
      const { payload } = await jwtVerify(legacyToken, secretKey);
      const legacyRole = (payload as { role?: string }).role?.toLowerCase();
      if (legacyRole === 'admin' || legacyRole === 'teacher' || legacyRole === 'student') {
        return legacyRole;
      }
    } catch (error) {
      console.error('Request auth legacy token error:', error);
    }
  }

  const nextAuthToken = await getToken({
    req: req as any,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const role = typeof nextAuthToken?.role === 'string' ? nextAuthToken.role.toLowerCase() : undefined;

  if (role === 'admin' || role === 'teacher' || role === 'student') {
    return role;
  }

  return null;
}

export async function requirePermission(req: Request, permission: Permission) {
  const role = await getRequestRole(req);

  if (!hasPermission(role, permission)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  return null;
}
