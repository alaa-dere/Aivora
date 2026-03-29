import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';
import { mkdir, writeFile, unlink } from 'fs/promises';
import path from 'path';
import fs from 'fs';

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

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export async function POST(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'teacher') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File | null;

    if (!imageFile || imageFile.size === 0) {
      return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
    }

    if (!imageFile.type.startsWith('image/') || !ALLOWED_TYPES.includes(imageFile.type)) {
      return NextResponse.json({ message: 'Please upload a JPG, PNG, or WebP image' }, { status: 400 });
    }

    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ message: 'Image must be 5MB or smaller' }, { status: 400 });
    }

    const [existingRows] = await db.query<RowDataPacket[]>(
      'SELECT imageUrl FROM user WHERE id = ? LIMIT 1',
      [user.id]
    );
    const oldImageUrl = existingRows[0]?.imageUrl as string | null;

    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    await mkdir(uploadsDir, { recursive: true });

    const extensionFromName = imageFile.name.split('.').pop()?.toLowerCase();
    const extensionFromType = imageFile.type.split('/').pop()?.toLowerCase();
    const ext = extensionFromName || extensionFromType || 'jpg';

    const safeId = user.id.replace(/[^a-z0-9_-]/gi, '');
    const fileName = `${safeId}-${Date.now()}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);

    await writeFile(filePath, buffer);

    const imageUrl = `/uploads/profiles/${fileName}`;

    await db.query(
      'UPDATE user SET imageUrl = ?, updatedAt = NOW() WHERE id = ?',
      [imageUrl, user.id]
    );

    if (oldImageUrl && oldImageUrl.startsWith('/uploads/profiles/')) {
      const oldPath = path.join(process.cwd(), 'public', oldImageUrl);
      if (fs.existsSync(oldPath)) {
        try {
          await unlink(oldPath);
        } catch (unlinkError) {
          console.error('Failed to delete old profile image:', unlinkError);
        }
      }
    }

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
    console.error('Teacher photo upload error:', error);
    return NextResponse.json({ message: 'Failed to upload photo' }, { status: 500 });
  }
}
