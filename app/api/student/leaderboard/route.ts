import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { getRequestUser } from '@/lib/request-auth';

type LeaderboardRow = {
  id: string;
  fullName: string;
  imageUrl: string | null;
  minutesAllTime: number;
  minutesLast7: number;
  minutesPrev7: number;
};

type RankedRow = LeaderboardRow & {
  improvement: number;
  rank: number;
};

function computeRankedRows(rows: LeaderboardRow[]): RankedRow[] {
  const sorted = rows
    .map((row) => ({
      ...row,
      improvement: row.minutesLast7 - row.minutesPrev7,
    }))
    .sort((a, b) => {
      if (b.improvement !== a.improvement) return b.improvement - a.improvement;
      if (b.minutesLast7 !== a.minutesLast7) return b.minutesLast7 - a.minutesLast7;
      return a.fullName.localeCompare(b.fullName);
    });

  let previousKey = '';
  let currentRank = 0;

  return sorted.map((row, index) => {
    const tieKey = `${row.improvement}|${row.minutesLast7}`;
    if (tieKey !== previousKey) {
      currentRank = index + 1;
      previousKey = tieKey;
    }

    return {
      ...row,
      rank: currentRank,
    };
  });
}

export async function GET(req: Request) {
  const user = await getRequestUser(req);
  if (!user || user.role !== 'student') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `
        SELECT
          u.id,
          u.fullName,
          u.imageUrl,
          COALESCE(SUM(COALESCE(
            NULLIF(lesson.durationMinutes, 0),
            LEAST(
              GREATEST(TIMESTAMPDIFF(MINUTE, lp.startedAt, lp.completedAt), 0),
              180
            ),
            0
          )), 0) AS minutesAllTime,
          COALESCE(SUM(CASE
            WHEN COALESCE(lp.completedAt, lp.startedAt) >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            THEN COALESCE(
              NULLIF(lesson.durationMinutes, 0),
              LEAST(
                GREATEST(TIMESTAMPDIFF(MINUTE, lp.startedAt, lp.completedAt), 0),
                180
              ),
              0
            )
            ELSE 0
          END), 0) AS minutesLast7,
          COALESCE(SUM(CASE
            WHEN COALESCE(lp.completedAt, lp.startedAt) >= DATE_SUB(NOW(), INTERVAL 14 DAY)
             AND COALESCE(lp.completedAt, lp.startedAt) < DATE_SUB(NOW(), INTERVAL 7 DAY)
            THEN COALESCE(
              NULLIF(lesson.durationMinutes, 0),
              LEAST(
                GREATEST(TIMESTAMPDIFF(MINUTE, lp.startedAt, lp.completedAt), 0),
                180
              ),
              0
            )
            ELSE 0
          END), 0) AS minutesPrev7
        FROM user u
        JOIN role r ON r.id = u.roleId AND r.name = 'student'
        LEFT JOIN enrollment e ON e.studentId = u.id
        LEFT JOIN lessonprogress lp
          ON lp.enrollmentId = e.id
        LEFT JOIN lesson
          ON lesson.id = lp.lessonId
        GROUP BY u.id, u.fullName, u.imageUrl
      `
    );

    const mapped: LeaderboardRow[] = (rows || []).map((row) => ({
      id: String(row.id),
      fullName: String(row.fullName || ''),
      imageUrl: row.imageUrl ? String(row.imageUrl) : null,
      minutesAllTime: Number(row.minutesAllTime || 0),
      minutesLast7: Number(row.minutesLast7 || 0),
      minutesPrev7: Number(row.minutesPrev7 || 0),
    }));

    const ranked = computeRankedRows(mapped);

    const top = ranked.slice(0, 10);
    const current = ranked.find((row) => row.id === user.id) || null;

    return NextResponse.json({
      top,
      current,
      totalStudents: ranked.length,
      metric: 'Learning minutes (last 7 days vs previous 7 days)',
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ message: 'Failed to load leaderboard' }, { status: 500 });
  }
}
