import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

interface Params {
  params: Promise<{ courseId: string }>;
}

function pct(value: number) {
  return `${Math.max(0, Math.min(100, value)).toFixed(1)}%`;
}

export async function POST(req: Request, { params }: Params) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { courseId } = await params;
    const normalizedCourseId = decodeURIComponent(courseId).trim();
    const body = await req.json().catch(() => ({}));
    const moduleId = String(body?.moduleId || '').trim();

    const [enrollmentRows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM enrollment WHERE courseId = ? AND studentId = ? LIMIT 1`,
      [normalizedCourseId, user.id]
    );
    if (!enrollmentRows.length) {
      return NextResponse.json({ message: 'Enrollment required' }, { status: 403 });
    }

    const [lessonAttempts] = await pool.query<RowDataPacket[]>(
      `
      SELECT m.id AS moduleId, m.title AS moduleTitle, a.scorePercentage, a.submittedAt
      FROM lesson_quiz_attempt a
      JOIN lesson l ON l.id = a.lessonId
      JOIN module m ON m.id = l.moduleId
      WHERE a.courseId = ? AND a.studentId = ?
      ORDER BY a.submittedAt DESC
      LIMIT 50
      `,
      [normalizedCourseId, user.id]
    );

    const [finalAttempts] = await pool.query<RowDataPacket[]>(
      `
      SELECT scorePercentage, submittedAt
      FROM course_quiz_attempt
      WHERE courseId = ? AND studentId = ?
      ORDER BY submittedAt DESC
      LIMIT 10
      `,
      [normalizedCourseId, user.id]
    );

    const byLesson = new Map<string, { title: string; scores: number[] }>();
    for (const row of lessonAttempts) {
      const key = String(row.moduleId || '');
      if (!key) continue;
      if (!byLesson.has(key)) {
        byLesson.set(key, { title: String(row.moduleTitle || 'Chapter'), scores: [] });
      }
      byLesson.get(key)!.scores.push(Number(row.scorePercentage || 0));
    }

    const lessonSummaries = Array.from(byLesson.entries()).map(([id, item]) => {
      const latest = item.scores[0] || 0;
      const best = Math.max(...item.scores, 0);
      const avg = item.scores.reduce((sum, v) => sum + v, 0) / Math.max(1, item.scores.length);
      return { id, title: item.title, latest, best, avg };
    });

    const weakest = [...lessonSummaries].sort((a, b) => a.latest - b.latest).slice(0, 3);
    const strongest = [...lessonSummaries].sort((a, b) => b.latest - a.latest).slice(0, 2);
    const overallLatest = finalAttempts.length ? Number(finalAttempts[0].scorePercentage || 0) : null;

    const targetLesson = moduleId
      ? lessonSummaries.find((item) => item.id === moduleId)
      : null;
    const chapterNote = targetLesson
      ? `Current chapter "${targetLesson.title}" latest score: ${pct(targetLesson.latest)}.`
      : null;

    const weakLines =
      weakest.length > 0
        ? weakest.map((item) => `- ${item.title}: latest ${pct(item.latest)}, average ${pct(item.avg)}.`).join('\n')
        : '- No chapter quiz attempts yet.';

    const strongLines =
      strongest.length > 0
        ? strongest.map((item) => `- ${item.title}: latest ${pct(item.latest)}.`).join('\n')
        : '- Not enough data yet.';

    const planLines = [
      'Study Plan:',
      '1) Review weak chapters first and retake their chapter quizzes.',
      '2) After each retake, compare your latest score with your previous score.',
      '3) Use AI chapter summary + notes before reattempting.',
      overallLatest !== null ? `4) Final course quiz latest score: ${pct(overallLatest)}.` : '4) Final course quiz not attempted yet.',
    ];

    return NextResponse.json({
      summary: [chapterNote, 'Weak points:', weakLines, 'Strong points:', strongLines, ...planLines]
        .filter(Boolean)
        .join('\n'),
      weakest,
      strongest,
      currentLesson: targetLesson,
      overallLatest,
    });
  } catch (error: unknown) {
    console.error('Quiz insights error:', error);
    return NextResponse.json(
      {
        message: 'Failed to generate quiz insights',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
