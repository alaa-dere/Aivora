import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAdmin } from '@/lib/request-auth';
import { ensureInstructorApplicationSchema } from '@/lib/ensure-instructor-application-schema';

type JobPostingRow = RowDataPacket & {
  id: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  otherNotes: string | null;
  status: 'open' | 'closed';
  createdBy: string | null;
  createdAt: string;
};

export async function GET(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;
  try {
    await ensureInstructorApplicationSchema();
    const [rows] = await pool.query<JobPostingRow[]>(
      `SELECT id, title, description, requirements, responsibilities, otherNotes, status, createdBy, createdAt FROM job_posting ORDER BY createdAt DESC`
    );
    return NextResponse.json({ jobs: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to load jobs', error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;
  try {
    await ensureInstructorApplicationSchema();
    const body = await req.json();
    const title = String(body?.title || '').trim();
    const description = String(body?.description || '').trim();
    const requirements = String(body?.requirements || '').trim();
    const responsibilities = String(body?.responsibilities || '').trim();
    const otherNotes = String(body?.otherNotes || '').trim();
    if (!title || !description || !requirements || !responsibilities) {
      return NextResponse.json(
        { message: 'Title, description, requirements, and responsibilities are required' },
        { status: 400 }
      );
    }
    await pool.query(
      `INSERT INTO job_posting (id, title, description, requirements, responsibilities, otherNotes, status, createdBy, createdAt, updatedAt)
       VALUES (UUID(), ?, ?, ?, ?, ?, 'open', ?, NOW(), NOW())`,
      [title, description, requirements, responsibilities, otherNotes || null, user.id]
    );
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to create job', error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;
  try {
    await ensureInstructorApplicationSchema();
    const body = await req.json();
    const id = String(body?.id || '').trim();
    const title = String(body?.title || '').trim();
    const description = String(body?.description || '').trim();
    const requirements = String(body?.requirements || '').trim();
    const responsibilities = String(body?.responsibilities || '').trim();
    const otherNotes = String(body?.otherNotes || '').trim();
    const status = String(body?.status || '').trim();
    if (!id) return NextResponse.json({ message: 'Job id is required' }, { status: 400 });
    if (status && status !== 'open' && status !== 'closed') {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
    }

    await pool.query(
      `UPDATE job_posting
       SET title = COALESCE(NULLIF(?, ''), title),
           description = COALESCE(NULLIF(?, ''), description),
           requirements = COALESCE(NULLIF(?, ''), requirements),
           responsibilities = COALESCE(NULLIF(?, ''), responsibilities),
           otherNotes = ?,
           status = COALESCE(NULLIF(?, ''), status),
           updatedAt = NOW()
       WHERE id = ?`,
      [title, description, requirements, responsibilities, otherNotes || null, status, id]
    );
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to update job', error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;
  try {
    await ensureInstructorApplicationSchema();
    const body = await req.json();
    const id = String(body?.id || '').trim();
    if (!id) return NextResponse.json({ message: 'Job id is required' }, { status: 400 });
    await pool.query(`DELETE FROM job_posting WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to delete job', error: message }, { status: 500 });
  }
}
