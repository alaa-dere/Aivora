import Link from 'next/link';
import { notFound } from 'next/navigation';

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  teacherName: string;
  price: number;
  teacherSharePct: number;
  status: 'draft' | 'published' | 'archived';
  imageUrl?: string | null;
  students: number;
  createdAt: string;
}

async function getCourse(id: string): Promise<CourseDetail | null> {
  const res = await fetch(`http://localhost:3000/api/courses/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.course || null;
}

export default async function TeacherCourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {course.title}
          </h1>
          <div className="flex gap-3">
            <Link
              href="/teacher/courses"
              className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Back to List
            </Link>
          </div>
        </div>

        {course.imageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700">
            <img
              src={course.imageUrl}
              alt={`${course.title} cover`}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {course.description || 'No description available yet.'}
              </p>
            </section>
          </div>

          <div className="space-y-6">
            <div className="portal-surface bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="font-medium text-lg mb-4 text-gray-900 dark:text-white">
                Course Information
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Teacher</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-200">
                    {course.teacherName || 'Not specified'}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Price</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-200">
                    ${Number(course.price).toFixed(2)}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Students</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-200">
                    {course.students}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-gray-500 dark:text-gray-400">Status</dt>
                  <dd>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        course.status === 'published'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : course.status === 'archived'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                      }`}
                    >
                      {course.status === 'published'
                        ? 'Published'
                        : course.status === 'archived'
                        ? 'Archived'
                        : 'Draft'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
