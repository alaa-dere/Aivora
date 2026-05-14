import { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

let cachedExists: boolean | null = null;

export async function hasUnifiedNotificationTable() {
  if (cachedExists !== null) return cachedExists;
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification'
    LIMIT 1
    `
  );
  cachedExists = rows.length > 0;
  return cachedExists;
}
