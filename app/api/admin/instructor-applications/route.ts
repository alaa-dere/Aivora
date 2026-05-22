import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requireAdmin } from '@/lib/request-auth';
import { ensureInstructorApplicationSchema } from '@/lib/ensure-instructor-application-schema';
import nodemailer from 'nodemailer';

type ApplicationRow = RowDataPacket & {
  id: string;
  fullName: string;
  email: string;
  jobPostingId: string | null;
  jobTitle: string | null;
  phone: string | null;
  bio: string | null;
  cvFileUrl: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
  reviewedBy: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
};

const ALLOWED_STATUS = new Set(['pending', 'reviewed', 'accepted', 'rejected']);

export async function GET(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await ensureInstructorApplicationSchema();

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') || 'all').trim();
    const q = (searchParams.get('q') || '').trim();
    const whereParts: string[] = [];
    const params: Array<string> = [];

    if (status !== 'all' && ALLOWED_STATUS.has(status)) {
      whereParts.push('ia.status = ?');
      params.push(status);
    }
    if (q) {
      whereParts.push('(ia.fullName LIKE ? OR ia.email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const [rows] = await pool.query<ApplicationRow[]>(
      `
      SELECT
        ia.id,
        ia.fullName,
        ia.email,
        ia.jobPostingId,
        jp.title AS jobTitle,
        ia.phone,
        ia.bio,
        ia.cvFileUrl,
        ia.status,
        ia.reviewedBy,
        reviewer.fullName AS reviewerName,
        ia.reviewedAt,
        ia.adminNotes,
        ia.createdAt,
        ia.updatedAt
      FROM instructor_application ia
      LEFT JOIN job_posting jp ON jp.id = ia.jobPostingId
      LEFT JOIN user reviewer ON reviewer.id = ia.reviewedBy
      ${where}
      ORDER BY ia.createdAt DESC
      LIMIT 300
      `,
      params
    );

    return NextResponse.json({ applications: rows });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Admin instructor applications GET error:', error);
    return NextResponse.json(
      { message: 'Failed to load applications', error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const { user, error } = await requireAdmin(req);
  if (error) return error;

  try {
    await ensureInstructorApplicationSchema();

    const body = await req.json();
    const id = String(body?.id || '').trim();
    const status = String(body?.status || '').trim();
    const adminNotes = String(body?.adminNotes || '').trim();
    const emailSubject = String(body?.emailSubject || '').trim();
    const emailBody = String(body?.emailBody || '').trim();

    if (!id || !ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        { message: 'Valid id and status are required' },
        { status: 400 }
      );
    }

    if (status === 'accepted' && !adminNotes) {
      return NextResponse.json(
        { message: 'Please add meeting details in notes before accepting.' },
        { status: 400 }
      );
    }

    const [applicationRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT id, fullName, email
      FROM instructor_application
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (applicationRows.length === 0) {
      return NextResponse.json({ message: 'Application not found' }, { status: 404 });
    }

    const app = applicationRows[0] as { id: string; fullName: string; email: string };

    const finalStatus = status as 'accepted' | 'rejected' | 'reviewed' | 'pending';
    let emailMessage = 'No email needed for this status.';
    if (finalStatus === 'accepted' || finalStatus === 'rejected') {
      const emailResult = await sendDecisionEmail({
        to: app.email,
        fullName: app.fullName,
        status: finalStatus,
        notes: adminNotes,
        emailSubject,
        emailBody,
      });
      if (!emailResult.sent) {
        return NextResponse.json(
          { message: emailResult.message || 'Failed to send email. Please try again.' },
          { status: 502 }
        );
      }
      emailMessage = emailResult.message;
    }

    await pool.query(
      `
      UPDATE instructor_application
      SET
        status = ?,
        adminNotes = ?,
        reviewedBy = ?,
        reviewedAt = NOW(),
        updatedAt = NOW()
      WHERE id = ?
      `,
      [status, adminNotes || null, user.id, id]
    );

    return NextResponse.json({
      success: true,
      emailSent: finalStatus === 'accepted' || finalStatus === 'rejected',
      emailMessage,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Admin instructor applications PATCH error:', error);
    return NextResponse.json(
      { message: 'Failed to update application', error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { error } = await requireAdmin(req);
  if (error) return error;

  try {
    await ensureInstructorApplicationSchema();

    const body = await req.json();
    const id = String(body?.id || '').trim();
    if (!id) {
      return NextResponse.json({ message: 'Application id is required' }, { status: 400 });
    }

    await pool.query(`DELETE FROM instructor_application WHERE id = ?`, [id]);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Admin instructor applications DELETE error:', error);
    return NextResponse.json(
      { message: 'Failed to delete application', error: message },
      { status: 500 }
    );
  }
}

async function sendDecisionEmail(input: {
  to: string;
  fullName: string;
  status: 'accepted' | 'rejected' | 'reviewed' | 'pending';
  notes: string;
  emailSubject?: string;
  emailBody?: string;
}) {
  if (input.status !== 'accepted' && input.status !== 'rejected') {
    return { sent: false, message: 'Email skipped: status does not require email.' };
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpSecure = process.env.SMTP_SECURE === 'true';
  const emailFrom = process.env.EMAIL_FROM || emailUser;

  if (!emailFrom) {
    return { sent: false, message: 'Email skipped: EMAIL_FROM/EMAIL_USER is missing.' };
  }

  if (!smtpHost && (!emailUser || !emailPass)) {
    return { sent: false, message: 'Email skipped: SMTP config is missing.' };
  }

  try {
    const transportTimeouts = {
      connectionTimeout: 7000,
      greetingTimeout: 7000,
      socketTimeout: 8000,
    };

    const subject =
      input.emailSubject ||
      (input.status === 'accepted'
        ? 'Aivora Instructor Application - Interview Invitation'
        : 'Aivora Instructor Application - Update');

    const defaultHtml =
      input.status === 'accepted'
        ? `
          <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
            <h2 style="color: #003153;">Interview Invitation</h2>
            <p>Hello ${escapeHtml(input.fullName)},</p>
            <p>Thank you for applying to join Aivora as an instructor.</p>
            <p>Your application has been accepted for the interview stage. Please find the meeting details below:</p>
            <div style="background:#f1f5f9;border:1px solid #cbd5e1;border-radius:8px;padding:12px;white-space:pre-wrap;">
              ${escapeHtml(input.notes)}
            </div>
            <p style="margin-top:16px;">Best regards,<br/>Aivora Team</p>
          </div>
        `
        : `
          <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
            <h2 style="color: #003153;">Application Update</h2>
            <p>Hello ${escapeHtml(input.fullName)},</p>
            <p>Thank you for your interest in joining Aivora as an instructor.</p>
            <p>After review, we are unable to move forward with your application at this time.</p>
            ${
              input.notes
                ? `<p>Additional note:</p><div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;white-space:pre-wrap;">${escapeHtml(input.notes)}</div>`
                : ''
            }
            <p style="margin-top:16px;">We appreciate your time and wish you success.</p>
            <p>Best regards,<br/>Aivora Team</p>
          </div>
        `;
    const html = input.emailBody
      ? `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; white-space: pre-wrap;">
        ${escapeHtml(input.emailBody)}
      </div>
      `
      : defaultHtml;

    const transportCandidates: Array<Parameters<typeof nodemailer.createTransport>[0]> = smtpHost
      ? [
          {
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: emailUser && emailPass ? { user: emailUser, pass: emailPass } : undefined,
            ...transportTimeouts,
          },
          // fallback for common SMTP setups
          {
            host: smtpHost,
            port: 587,
            secure: false,
            auth: emailUser && emailPass ? { user: emailUser, pass: emailPass } : undefined,
            ...transportTimeouts,
          },
          {
            host: smtpHost,
            port: 465,
            secure: true,
            auth: emailUser && emailPass ? { user: emailUser, pass: emailPass } : undefined,
            ...transportTimeouts,
          },
        ]
      : [
          {
            service: 'gmail',
            auth: {
              user: emailUser,
              pass: emailPass,
            },
            ...transportTimeouts,
          },
        ];

    let lastError: unknown = null;
    for (const candidate of transportCandidates) {
      try {
        const transporter = nodemailer.createTransport(candidate);
        await transporter.sendMail({
          from: `"Aivora Team" <${emailFrom}>`,
          to: input.to,
          subject,
          html,
        });
        return { sent: true, message: 'Email sent successfully.' };
      } catch (candidateError) {
        lastError = candidateError;
      }
    }

    throw lastError || new Error('No SMTP transport succeeded');
  } catch (error) {
    console.error('Instructor application decision email error:', error);
    return { sent: false, message: 'Email failed to send. Please check SMTP settings and retry.' };
  }
}

function escapeHtml(value: string) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
