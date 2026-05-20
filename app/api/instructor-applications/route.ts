import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { createAdminNotification } from '@/lib/notifications-write';
import { ensureInstructorApplicationSchema } from '@/lib/ensure-instructor-application-schema';

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function POST(req: Request) {
  try {
    await ensureInstructorApplicationSchema();

    const formData = await req.formData();
    const fullName = String(formData.get('fullName') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const jobPostingId = String(formData.get('jobPostingId') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const bio = String(formData.get('bio') || '').trim();
    const cvFile = formData.get('cv') as File | null;

    if (!fullName || !email || !jobPostingId || !cvFile || cvFile.size === 0) {
      return NextResponse.json(
        { message: 'Full name, email, job selection, and CV are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: 'Invalid email address' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(cvFile.type)) {
      return NextResponse.json(
        { message: 'CV must be PDF, DOC, or DOCX' },
        { status: 400 }
      );
    }

    if (cvFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'CV file must be 8MB or smaller' },
        { status: 400 }
      );
    }

    const [jobRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, status FROM job_posting WHERE id = ? LIMIT 1`,
      [jobPostingId]
    );
    if (jobRows.length === 0 || jobRows[0].status !== 'open') {
      return NextResponse.json({ message: 'Selected job is not available' }, { status: 400 });
    }

    const [idRows] = await pool.query<RowDataPacket[]>('SELECT UUID() AS id');
    const applicationId = idRows[0].id as string;

    const bytes = await cvFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'instructor-cv');
    await mkdir(uploadsDir, { recursive: true });

    const extensionFromName = cvFile.name.split('.').pop()?.toLowerCase();
    const extensionFromType =
      cvFile.type === 'application/pdf'
        ? 'pdf'
        : cvFile.type === 'application/msword'
          ? 'doc'
          : 'docx';
    const ext = extensionFromName || extensionFromType || 'pdf';

    const safeEmail = email.replace(/[^a-z0-9@._-]/gi, '').replace('@', '_at_');
    const fileName = `${applicationId}-${safeEmail}.${ext}`;
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    const cvFileUrl = `/uploads/instructor-cv/${fileName}`;

    await pool.query(
      `
      INSERT INTO instructor_application
        (id, fullName, email, jobPostingId, phone, bio, cvFileUrl, status, createdAt, updatedAt)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
      `,
      [
        applicationId,
        fullName,
        email.toLowerCase(),
        jobPostingId,
        phone || null,
        bio || null,
        cvFileUrl,
      ]
    );

    try {
      await createAdminNotification({
        type: 'instructor_application',
        title: 'New Instructor Application',
        message: `${fullName} applied for "${String(jobRows[0].title || 'Job')}".`,
      });
    } catch (notificationError) {
      console.error('Failed to create instructor application admin notification:', notificationError);
    }

    return NextResponse.json({ success: true, id: applicationId }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Instructor application submit error:', error);
    return NextResponse.json(
      { message: 'Failed to submit application', error: message },
      { status: 500 }
    );
  }
}
