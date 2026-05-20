import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { ensureInstructorApplicationSchema } from '@/lib/ensure-instructor-application-schema';

type JobPostingRow = RowDataPacket & {
  id: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  otherNotes: string | null;
  status: 'open' | 'closed';
  createdAt: string;
};

export async function GET() {
  try {
    await ensureInstructorApplicationSchema();
    const [rows] = await pool.query<JobPostingRow[]>(
      `
      SELECT id, title, description, requirements, responsibilities, otherNotes, status, createdAt
      FROM job_posting
      WHERE status = 'open'
      ORDER BY createdAt DESC
      `
    );
    return NextResponse.json({ jobs: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ message: 'Failed to load jobs', error: message }, { status: 500 });
  }
}
