import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getRequestRole } from '@/lib/request-auth';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  const role = await getRequestRole(req);
  if (role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const notifId = decodeURIComponent(id).trim();

    await pool.query(
      `UPDATE admin_notification SET readAt = NOW() WHERE id = ? AND readAt IS NULL`,
      [notifId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notification read error:', error);
    return NextResponse.json(
      { message: 'Failed to update notification', error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: Params) {
  const role = await getRequestRole(req);
  if (role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const notifId = decodeURIComponent(id).trim();

    await pool.query(`DELETE FROM admin_notification WHERE id = ?`, [notifId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notification delete error:', error);
    return NextResponse.json(
      { message: 'Failed to delete notification', error: error.message },
      { status: 500 }
    );
  }
}
