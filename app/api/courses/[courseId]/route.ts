import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function PUT(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const body = await req.json();
    const { title, description, teacherId, price, status } = body;

    await pool.query(
      `UPDATE Course 
       SET title = ?, description = ?, teacherId = ?, price = ?, status = ?
       WHERE id = ?`,
      [title, description, teacherId, price, status, courseId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ message: 'Failed to update course' }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    const body = await req.json();
    const { status } = body;

    await pool.query(
      'UPDATE Course SET status = ? WHERE id = ?',
      [status, courseId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating course status:', error);
    return NextResponse.json({ message: 'Failed to update status' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { courseId } = params;
    await pool.query('DELETE FROM Course WHERE id = ?', [courseId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ message: 'Failed to delete course' }, { status: 500 });
  }
}