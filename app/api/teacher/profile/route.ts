import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import { getRequestUser } from '@/lib/request-auth';

type TeacherProfile = {
  id: string;
  fullName: string;
  email: string;
  status: 'active' | 'inactive';
  role: string;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `
        SELECT
          u.id,
          u.fullName,
          u.email,
          u.status,
          u.imageUrl,
          r.name AS role,
          u.createdAt,
          u.updatedAt
        FROM user u
        JOIN role r ON r.id = u.roleId
        WHERE u.id = ? AND r.name = 'teacher'
        LIMIT 1
      `,
      [user.id]
    );

    const teacher = rows[0] as TeacherProfile | undefined;
    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ teacher });
  } catch (error) {
    const err = error as { code?: string; message?: string };
    if (err?.code === 'ER_BAD_FIELD_ERROR' && err?.message?.includes('imageUrl')) {
      return NextResponse.json(
        {
          message:
            "Profile image column is missing. Please add `imageUrl` to the `user` table and retry.",
        },
        { status: 500 }
      );
    }
    console.error('Teacher profile error:', error);
    return NextResponse.json({ message: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const currentPassword =
      typeof body.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (!fullName || !email) {
      return NextResponse.json({ message: 'Full name and email are required' }, { status: 400 });
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        { message: 'New password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const [emailRows] = await db.query<RowDataPacket[]>(
      'SELECT id FROM user WHERE email = ? AND id != ?',
      [email, user.id]
    );
    if (emailRows.length > 0) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    let passwordHashToSet: string | null = null;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { message: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }

      const [pwRows] = await db.query<RowDataPacket[]>(
        'SELECT passwordHash FROM user WHERE id = ? LIMIT 1',
        [user.id]
      );
      const existingHash = pwRows[0]?.passwordHash as string | undefined;

      if (existingHash) {
        const ok = await bcrypt.compare(currentPassword, existingHash);
        if (!ok) {
          return NextResponse.json({ message: 'Current password is incorrect' }, { status: 400 });
        }
      }

      passwordHashToSet = await bcrypt.hash(newPassword, 10);
    }

    const updates: string[] = ['fullName = ?', 'email = ?', 'updatedAt = NOW()'];
    const params: any[] = [fullName, email];

    if (passwordHashToSet) {
      updates.push('passwordHash = ?');
      params.push(passwordHashToSet);
    }

    params.push(user.id);

    await db.query(
      `
        UPDATE user
        SET ${updates.join(', ')}
        WHERE id = ?
      `,
      params
    );

    const [rows] = await db.query<RowDataPacket[]>(
      `
        SELECT
          u.id,
          u.fullName,
          u.email,
          u.status,
          u.imageUrl,
          r.name AS role,
          u.createdAt,
          u.updatedAt
        FROM user u
        JOIN role r ON r.id = u.roleId
        WHERE u.id = ? AND r.name = 'teacher'
        LIMIT 1
      `,
      [user.id]
    );

    const teacher = rows[0] as TeacherProfile | undefined;
    if (!teacher) {
      return NextResponse.json({ message: 'Teacher not found' }, { status: 404 });
    }

    return NextResponse.json({ teacher });
  } catch (error) {
    const err = error as { code?: string; message?: string };
    if (err?.code === 'ER_BAD_FIELD_ERROR' && err?.message?.includes('imageUrl')) {
      return NextResponse.json(
        {
          message:
            "Profile image column is missing. Please add `imageUrl` to the `user` table and retry.",
        },
        { status: 500 }
      );
    }
    console.error('Teacher profile update error:', error);
    return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
  }
}
