import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { ensureLearningPathSchema } from '@/lib/ensure-learning-path-schema';

type CategoryRow = RowDataPacket & {
  id: string;
  name: string;
};

type ItemRow = RowDataPacket & {
  id: string;
  title: string;
  categoryId: string;
  description?: string | null;
  price?: number | string | null;
  imageUrl?: string | null;
  instructor?: string | null;
  durationWeeks?: number | string | null;
  studentsCount?: number | string | null;
  averageRating?: number | string | null;
  evaluationCount?: number | string | null;
};

export async function GET() {
  try {
    await ensureLearningPathSchema();

    const [courseCategoryColumnRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 1
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'course'
        AND COLUMN_NAME = 'categoryId'
      LIMIT 1
      `
    );
    const hasCourseCategoryColumn = courseCategoryColumnRows.length > 0;

    const [pathTableRows] = await pool.query<RowDataPacket[]>(
      `
      SELECT 1
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'learning_path'
      LIMIT 1
      `
    );
    const hasLearningPathTable = pathTableRows.length > 0;

    const [categories] = await pool.query<CategoryRow[]>(
      `
      SELECT id, name
      FROM category
      WHERE status = 'active'
      ORDER BY name ASC
      `
    );

    const [courses] = hasCourseCategoryColumn
      ? await pool.query<ItemRow[]>(
          `
          SELECT
            c.id,
            c.title,
            c.categoryId,
            c.description,
            c.price,
            c.imageUrl,
            c.durationWeeks,
            u.fullName AS instructor,
            (
              SELECT COUNT(*)
              FROM enrollment e
              WHERE e.courseId = c.id
            ) AS studentsCount,
            (
              SELECT AVG(ce.rating)
              FROM course_evaluation ce
              WHERE ce.courseId = c.id
                AND ce.rating IS NOT NULL
            ) AS averageRating,
            (
              SELECT COUNT(*)
              FROM course_evaluation ce
              WHERE ce.courseId = c.id
                AND ce.rating IS NOT NULL
            ) AS evaluationCount
          FROM course c
          JOIN user u ON u.id = c.teacherId
          WHERE c.status = 'published'
            AND c.categoryId IS NOT NULL
          ORDER BY c.title ASC
          `
        )
      : [[] as ItemRow[]];

    const [paths] = hasLearningPathTable
      ? await pool.query<ItemRow[]>(
          `
          SELECT id, title, categoryId
          FROM learning_path
          WHERE status = 'published'
            AND categoryId IS NOT NULL
          ORDER BY title ASC
          `
        )
      : [[] as ItemRow[]];

    const grouped = categories.map((category) => ({
      id: category.id,
      name: category.name,
      courses: courses
        .filter((course) => course.categoryId === category.id)
        .map((course) => ({
          id: course.id,
          title: course.title,
          description: String(course.description || ''),
          price: Number(course.price || 0),
          image: course.imageUrl || '/default-course.jpg',
          instructor: String(course.instructor || ''),
          duration: `${Number(course.durationWeeks || 0)} Weeks`,
          students: String(Number(course.studentsCount || 0)),
          averageRating:
            course.averageRating === null || course.averageRating === undefined
              ? 0
              : Number(course.averageRating),
          evaluationCount: Number(course.evaluationCount || 0),
        })),
      paths: paths
        .filter((path) => path.categoryId === category.id)
        .map((path) => ({ id: path.id, title: path.title })),
    }));

    return NextResponse.json({ categories: grouped });
  } catch (error: unknown) {
    console.error('Error loading home categories:', error);
    return NextResponse.json(
      {
        message: 'Failed to load categories',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
