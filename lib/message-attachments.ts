import path from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { randomUUID } from 'crypto';
import { RowDataPacket } from 'mysql2';
import pool from '@/lib/db';

export type SavedMessageAttachment = {
  url: string;
  name: string;
  type: string;
  size: number;
};

async function hasColumn(tableName: string, columnName: string) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND COLUMN_NAME = ?
    LIMIT 1
    `,
    [tableName, columnName]
  );
  return rows.length > 0;
}

function sanitizeBaseName(name: string) {
  return name
    .trim()
    .replace(/[^\w.\-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80) || 'attachment';
}

function inferExtension(name: string, mimeType: string) {
  const existingExt = path.extname(name).toLowerCase();
  if (existingExt) return existingExt;

  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'audio/webm': '.webm',
    'audio/ogg': '.ogg',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'video/mp4': '.mp4',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  };

  return map[mimeType] || '.bin';
}

export async function ensureAdminTeacherAttachmentColumns() {
  const exists = await hasColumn('admin_teacher_message', 'attachmentUrl');
  if (exists) return;

  try {
    await pool.query(`
      ALTER TABLE admin_teacher_message
      ADD COLUMN attachmentUrl VARCHAR(512) NULL,
      ADD COLUMN attachmentName VARCHAR(255) NULL,
      ADD COLUMN attachmentType VARCHAR(120) NULL,
      ADD COLUMN attachmentSize INT NULL,
      ADD INDEX idx_admin_teacher_attachment_url (attachmentUrl)
    `);
  } catch (error: unknown) {
    const code = (error as { code?: string }).code;
    if (code !== 'ER_DUP_FIELDNAME' && code !== 'ER_DUP_KEYNAME') {
      throw error;
    }
  }
}

export async function saveMessageAttachment(
  file: File,
  subdir = 'message-attachments'
): Promise<SavedMessageAttachment> {
  const safeName = sanitizeBaseName(file.name || 'attachment');
  const extension = inferExtension(safeName, file.type || '');
  const stem = path.basename(safeName, path.extname(safeName)) || 'attachment';
  const uniqueName = `${Date.now()}-${randomUUID()}-${stem}${extension}`;
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads', subdir);
  await mkdir(uploadsDir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, uniqueName), buffer);

  return {
    url: `/uploads/${subdir}/${uniqueName}`,
    name: file.name || uniqueName,
    type: file.type || 'application/octet-stream',
    size: file.size,
  };
}
