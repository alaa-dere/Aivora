import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type LeaderboardRow = {
  id: string;
  fullName: string;
  minutesLast7: number;
  minutesPrev7: number;
};

type RankedRow = LeaderboardRow & {
  improvement: number;
  rank: number;
};

async function ensureStudySessionTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS lesson_study_session (
      id VARCHAR(36) PRIMARY KEY COLLATE utf8mb4_unicode_ci,
      enrollmentId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      lessonId VARCHAR(36) NOT NULL COLLATE utf8mb4_unicode_ci,
      startedAt DATETIME NOT NULL,
      endedAt DATETIME NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_lss_enrollment (enrollmentId),
      INDEX idx_lss_lesson (lessonId),
      INDEX idx_lss_started (startedAt),
      INDEX idx_lss_ended (endedAt),
      CONSTRAINT fk_lss_enrollment FOREIGN KEY (enrollmentId) REFERENCES enrollment(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_lss_lesson FOREIGN KEY (lessonId) REFERENCES lesson(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB
  `);
}

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await ensureStudySessionTable();
    const [rows] = await db.query<RowDataPacket[]>(
      `
        SELECT
          u.id,
          u.fullName,
          COALESCE(SUM(CASE
            WHEN s.startedAt IS NOT NULL
             AND s.startedAt >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            THEN LEAST(
              GREATEST(
                TIMESTAMPDIFF(
                  MINUTE,
                  s.startedAt,
                  CASE
                    WHEN s.endedAt IS NOT NULL AND s.endedAt >= s.startedAt THEN s.endedAt
                    ELSE NOW()
                  END
                ),
                0
              ),
              180
            )
            ELSE 0
          END), 0) AS minutesLast7,
          COALESCE(SUM(CASE
            WHEN s.startedAt IS NOT NULL
             AND s.startedAt >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
             AND s.startedAt < DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            THEN LEAST(
              GREATEST(
                TIMESTAMPDIFF(
                  MINUTE,
                  s.startedAt,
                  CASE
                    WHEN s.endedAt IS NOT NULL AND s.endedAt >= s.startedAt THEN s.endedAt
                    ELSE NOW()
                  END
                ),
                0
              ),
              180
            )
            ELSE 0
          END), 0) AS minutesPrev7
        FROM user u
        JOIN role r ON r.id = u.roleId AND r.name = 'student'
        LEFT JOIN enrollment e ON e.studentId = u.id
        LEFT JOIN lesson_study_session s
          ON s.enrollmentId = e.id
        GROUP BY u.id, u.fullName
      `
    );

    const mapped: LeaderboardRow[] = (rows || []).map((row) => ({
      id: String(row.id),
      fullName: String(row.fullName || ''),
      minutesLast7: Number(row.minutesLast7 || 0),
      minutesPrev7: Number(row.minutesPrev7 || 0),
    }));

    const ranked = mapped
      .map((row) => ({
        ...row,
        improvement: row.minutesLast7 - row.minutesPrev7,
      }))
      .sort((a, b) => {
        if (b.improvement !== a.improvement) return b.improvement - a.improvement;
        if (b.minutesLast7 !== a.minutesLast7) return b.minutesLast7 - a.minutesLast7;
        return a.fullName.localeCompare(b.fullName);
      })
      .map((row, index) => ({
        ...row,
        rank: index + 1,
      }));

    const top = ranked.slice(0, 10);
    const current = ranked.find((row) => row.id === user.id) || null;

    return NextResponse.json({
      top,
      current,
      totalStudents: ranked.length,
      metric: 'Time spent (last 7 days vs previous 7 days)',
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ message: 'Failed to load leaderboard' }, { status: 500 });
  }
}
