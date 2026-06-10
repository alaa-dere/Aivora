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
  level?: string | null;
  estimatedHours?: number | string | null;
  courseIds?: string | null;
  coursesCount?: number | string | null;
  enrolledStudents?: number | string | null;
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
          SELECT
            lp.id,
            lp.title,
            lp.categoryId,
            lp.description,
            lp.imageUrl,
            lp.level,
            lp.price,
            lp.estimatedHours,
            (
              SELECT COUNT(*)
              FROM learning_path_course lpc
              WHERE lpc.pathId = lp.id
            ) AS coursesCount,
            (
              SELECT GROUP_CONCAT(lpc.courseId ORDER BY lpc.orderNumber ASC SEPARATOR ',')
              FROM learning_path_course lpc
              WHERE lpc.pathId = lp.id
            ) AS courseIds,
            (
              SELECT COUNT(*)
              FROM path_enrollment pe
              WHERE pe.pathId = lp.id
            ) AS enrolledStudents
          FROM learning_path lp
          WHERE lp.status = 'published'
            AND lp.categoryId IS NOT NULL
          ORDER BY lp.title ASC
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
        .map((path) => ({
          id: path.id,
          title: path.title,
          description: String(path.description || ''),
          imageUrl: path.imageUrl || '/default-course.jpg',
          level: path.level || 'beginner',
          price: Number(path.price || 0),
          estimatedHours: Number(path.estimatedHours || 0),
          estimatedWeeks: Math.max(1, Math.ceil(Number(path.estimatedHours || 0) / 5)),
          coursesCount: Number(path.coursesCount || 0),
          enrolledStudents: Number(path.enrolledStudents || 0),
          courseIds: path.courseIds ? path.courseIds.split(',').filter(Boolean) : [],
          categoryName: category.name,
        })),
    }));

    const categoriesWithCourses = grouped.filter(
      (category) => category.courses.length > 0 || category.paths.length > 0
    );

    return NextResponse.json({ categories: categoriesWithCourses });
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
