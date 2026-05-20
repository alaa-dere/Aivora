import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { requireAdmin } from '@/lib/request-auth';
import { hasUnifiedNotificationTable } from '@/lib/notifications-unified';

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: Request, { params }: Params) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await params;
    const notifId = decodeURIComponent(id).trim();
    const useUnified = await hasUnifiedNotificationTable();
    if (useUnified) {
      await pool.query(
        `UPDATE notification SET readAt = NOW() WHERE id = ? AND recipientRole = 'admin' AND deletedAt IS NULL AND readAt IS NULL`,
        [notifId]
      );
    } else {
      await pool.query(
        `UPDATE admin_notification SET readAt = NOW() WHERE id = ? AND readAt IS NULL`,
        [notifId]
      );
    }
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
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    const { id } = await params;
    const notifId = decodeURIComponent(id).trim();
    const useUnified = await hasUnifiedNotificationTable();
    if (useUnified) {
      await pool.query(
        `UPDATE notification SET deletedAt = NOW() WHERE id = ? AND recipientRole = 'admin' AND deletedAt IS NULL`,
        [notifId]
      );
    } else {
      await pool.query(`DELETE FROM admin_notification WHERE id = ?`, [notifId]);
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Notification delete error:', error);
    return NextResponse.json(
      { message: 'Failed to delete notification', error: error.message },
      { status: 500 }
    );
  }
}
