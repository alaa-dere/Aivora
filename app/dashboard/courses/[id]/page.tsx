import { notFound } from 'next/navigation';

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  teacherName: string;
  price: number;
  teacherSharePct: number;
  status: 'draft' | 'published' | 'archived';
  coverImage?: string | null;
  students: number;
  createdAt: string;
  // You can add more later: modules count, lessons count, etc.
}

async function getCourse(id: string): Promise<CourseDetail | null> {
  const res = await fetch(`http://localhost:3000/api/courses/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.course || null;
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = await getCourse(id);

  if (!course) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header with title and actions */}
        <div className="flex items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{course.title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Course overview and key details.
            </p>
          </div>
          <div className="flex gap-3">
            <a
              href={`/dashboard/courses/${course.id}/edit`}
              className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-sm shadow-md hover:shadow-md border border-blue-500/50 transition-all duration-200 active:scale-95"
            >
              Edit
            </a>
          </div>
        </div>

        {/* Cover Image */}
        {course.imageUrl && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-800">
            <img
              src={course.imageUrl}
              alt={`${course.title} cover`}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content - Description */}
          <div className="md:col-span-2 space-y-6">
            <section className="admin-surface bg-white/80 dark:bg-slate-900/70 backdrop-blur p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
              <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">
                Description
              </h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line leading-relaxed">
                {course.description || 'No description available yet.'}
              </p>
            </section>

            {/* You can add more sections here later, e.g. Modules, Lessons, Reviews... */}
          </div>

          {/* Sidebar - General Info */}
          <div className="space-y-6">
            <div className="admin-surface bg-white/80 dark:bg-slate-900/70 backdrop-blur p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md">
              <h3 className="font-medium text-lg mb-4 text-gray-900 dark:text-white">
                General Information
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Teacher</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-200">
                    {course.teacherName || 'Not specified'}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Price</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-200">
                    ${Number(course.price).toFixed(2)}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Teacher Share</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-200">
                    {Number(course.teacherSharePct).toFixed(1)}%
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Enrolled Students</dt>
                  <dd className="font-medium text-gray-900 dark:text-gray-200">
                    {course.students}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-slate-500 dark:text-slate-400">Status</dt>
                  <dd>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${
                        course.status === 'published'
                          ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                          : course.status === 'archived'
                          ? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
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
