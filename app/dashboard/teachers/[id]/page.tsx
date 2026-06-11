'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import {
  AcademicCapIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  UserCircleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

type TeacherProfile = {
  id: string;
  fullName: string;
  email: string;
  imageUrl?: string | null;
  status: 'active' | 'inactive';
  role: string;
  createdAt: string;
  updatedAt: string;
};

type TeacherStats = {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  archivedCourses: number;
  totalStudents: number;
  totalEnrollments: number;
  completedEnrollments: number;
  avgProgress: number;
  totalRevenue: number;
  monthRevenue: number;
  grossSales: number;
  totalPaid: number;
  pendingPayout: number;
  lastPayoutDate: string | null;
};

type TeacherCourse = {
  id: string;
  title: string;
  status: 'draft' | 'published' | 'archived';
  price: number;
  durationWeeks: number;
  createdAt: string;
  students: number;
  revenue: number;
};

type TeacherStudent = {
  enrollmentId: string;
  enrolledAt: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  progressPercentage: number;
  studentId: string;
  fullName: string;
  email: string;
  courseTitle: string;
};

type TeacherTransaction = {
  id: string;
  date: string;
  dateTime: string;
  type: 'enrollment' | 'refund';
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  teacherShare: number;
  platformShare: number;
  studentName: string | null;
  courseTitle: string | null;
};

type TeacherProfileResponse = {
  teacher: TeacherProfile;
  stats: TeacherStats;
  courses: TeacherCourse[];
  students: TeacherStudent[];
  transactions: TeacherTransaction[];
};

const money = (value: number, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value || 0);
  } catch {
    return `$${Number(value || 0).toFixed(2)}`;
  }
};

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
};

export default function TeacherProfilePage() {
  const params = useParams();
  const teacherId = (params?.id as string) || '';
  const [data, setData] = useState<TeacherProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTable, setActiveTable] = useState<'courses' | 'students' | 'earnings'>('courses');

  useEffect(() => {
    if (!teacherId) return;
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/teachers?id=${teacherId}`, { cache: 'no-store' });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to load teacher profile');
        if (mounted) setData(payload);
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load teacher profile');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [teacherId]);

  const stats = data?.stats;
  const completionRate = stats?.totalEnrollments
    ? Math.round(((stats.completedEnrollments || 0) / stats.totalEnrollments) * 100)
    : 0;

  const overviewCards = useMemo(
    () => [
      { title: 'Total Courses', value: stats?.totalCourses ?? 0, icon: AcademicCapIcon },
      { title: 'Total Students', value: stats?.totalStudents ?? 0, icon: UsersIcon },
      { title: 'Total Revenue', value: money(stats?.totalRevenue ?? 0), icon: CurrencyDollarIcon },
      { title: 'Completion Rate', value: `${completionRate}%`, icon: ChartBarIcon },
    ],
    [stats, completionRate]
  );

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 transition-colors duration-300">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Teacher Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Overview, courses, students, and earnings in one place.
        </p>
      </div>

      {loading && (
        <div className="admin-surface relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75 backdrop-blur shadow-md p-10 text-center text-gray-500 dark:text-gray-300">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-200 via-sky-300 to-blue-200 dark:from-green-700 dark:via-sky-700 dark:to-blue-700" />
          Loading teacher profile...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 dark:bg-red-900/30 rounded-2xl border border-red-200 dark:border-red-800 p-6 text-center text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
            <aside className="xl:col-span-3">
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 p-5 pt-7 bg-white dark:bg-slate-900/70 shadow-sm h-full min-h-[560px]">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-green-200 via-sky-300 to-blue-200 dark:from-green-700 dark:via-sky-700 dark:to-blue-700" />
                <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-5">
                  Profile Details
                </h2>

                <div className="flex flex-col items-center text-center mb-6 mt-2">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 dark:from-white/10 dark:to-white/10 border border-green-100 dark:border-white/20 flex items-center justify-center overflow-hidden">
                    {data.teacher.imageUrl ? (
                      <img
                        src={data.teacher.imageUrl}
                        alt={data.teacher.fullName || 'Teacher'}
                        className="h-full w-full rounded-2xl object-cover"
                      />
                    ) : (
                      <UserCircleIcon className="h-12 w-12 text-blue-700 dark:text-white" />
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
                      {data.teacher.fullName}
                    </p>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5 mt-1">
                      <EnvelopeIcon className="w-4 h-4" />
                      {data.teacher.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <ProfileField label="Joined" value={formatDate(data.teacher.createdAt)} />
                  <ProfileField label="Last Updated" value={formatDate(data.teacher.updatedAt)} />
                  <ProfileField
                    label="Average Progress"
                    value={Number.isFinite(stats?.avgProgress) ? `${Number(stats?.avgProgress || 0).toFixed(1)}%` : '0%'}
                  />
                  <ProfileField label="Total Enrollments" value={String(stats?.totalEnrollments ?? 0)} />
                </div>
              </div>
            </aside>

            <section className="xl:col-span-9 space-y-4 pt-3">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {overviewCards.map((card) => (
                  <InfoCard key={card.title} title={card.title} value={card.value} icon={card.icon} />
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mt-10">
                <button
                  type="button"
                  onClick={() => setActiveTable('courses')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    activeTable === 'courses'
                      ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <AcademicCapIcon className="w-4 h-4" />
                  Courses
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTable('students')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    activeTable === 'students'
                      ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <UsersIcon className="w-4 h-4" />
                  Students
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTable('earnings')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    activeTable === 'earnings'
                      ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800'
                      : 'bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <CurrencyDollarIcon className="w-4 h-4" />
                  Earnings
                </button>
              </div>

              <div className="md:hidden space-y-4">
                {activeTable === 'courses' && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Courses</h2>
                    </div>
                    <div className="p-3 space-y-2">
                      {data.courses.length === 0 ? (
                        <p className="px-1 py-6 text-center text-sm text-gray-500 dark:text-gray-300">No courses found for this teacher.</p>
                      ) : (
                        data.courses.map((course) => (
                          <div key={course.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100 line-clamp-2">{course.title}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{formatDate(course.createdAt)}</p>
                              </div>
                              <StatusPill status={course.status} />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <div className="rounded-lg bg-white/80 dark:bg-slate-950/30 p-2">
                                <p>Students</p>
                                <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{course.students}</p>
                              </div>
                              <div className="rounded-lg bg-white/80 dark:bg-slate-950/30 p-2">
                                <p>Price</p>
                                <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{money(course.price)}</p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>Revenue</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-100">{money(course.revenue)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTable === 'students' && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Students</h2>
                    </div>
                    <div className="p-3 space-y-2">
                      {data.students.length === 0 ? (
                        <p className="px-1 py-6 text-center text-sm text-gray-500 dark:text-gray-300">No active students currently taking this teacher&apos;s courses.</p>
                      ) : (
                        data.students.map((student) => (
                          <div key={student.enrollmentId} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100 line-clamp-2">{student.fullName}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{student.email}</p>
                              </div>
                              <EnrollmentStatus status={student.status} />
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{student.courseTitle}</p>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-green-500"
                                  style={{ width: `${Math.min(100, Math.max(0, student.progressPercentage || 0))}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-300">
                                {Number(student.progressPercentage || 0).toFixed(0)}%
                              </span>
                            </div>
                            <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">{formatDate(student.enrolledAt)}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTable === 'earnings' && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Earnings</h2>
                    </div>
                    <div className="p-3 space-y-2">
                      {data.transactions.length === 0 ? (
                        <p className="px-1 py-6 text-center text-sm text-gray-500 dark:text-gray-300">No transactions recorded yet.</p>
                      ) : (
                        data.transactions.map((tx) => (
                          <div key={tx.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100 line-clamp-2">{tx.studentName || '-'}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{tx.courseTitle || '-'}</p>
                              </div>
                              <TransactionStatus status={tx.status} />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>{formatDate(tx.dateTime)}</span>
                              <span className="font-semibold text-slate-800 dark:text-slate-100">
                                {money(tx.teacherShare || 0, tx.currency || 'USD')}
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800">
                                {tx.type}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {activeTable === 'courses' && (
                <TableShell title="Courses">
                  <thead className="text-slate-500 dark:text-slate-400">
                    <tr className="text-left">
                      <th className="px-4 py-2.5 font-medium">Course</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Price</th>
                      <th className="px-4 py-2.5 font-medium">Students</th>
                      <th className="px-4 py-2.5 font-medium">Revenue</th>
                      <th className="px-4 py-2.5 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {data.courses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-300">
                          No courses found for this teacher.
                        </td>
                      </tr>
                    ) : (
                      data.courses.map((course) => (
                        <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{course.title}</td>
                          <td className="px-4 py-3"><StatusPill status={course.status} /></td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{money(course.price)}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{course.students}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{money(course.revenue)}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-300">{formatDate(course.createdAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </TableShell>
              )}

              {activeTable === 'students' && (
                <TableShell title="Students">
                  <thead className="text-slate-500 dark:text-slate-400">
                    <tr className="text-left">
                      <th className="px-4 py-2.5 font-medium">Student</th>
                      <th className="px-4 py-2.5 font-medium">Course</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Progress</th>
                      <th className="px-4 py-2.5 font-medium">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {data.students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-300">
                          No active students currently taking this teacher&apos;s courses.
                        </td>
                      </tr>
                    ) : (
                      data.students.map((student) => (
                        <tr key={student.enrollmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3">
                            <div className="text-slate-800 dark:text-slate-100">{student.fullName}</div>
                            <div className="text-xs text-slate-500">{student.email}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{student.courseTitle}</td>
                          <td className="px-4 py-3"><EnrollmentStatus status={student.status} /></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className="h-2 rounded-full bg-green-500"
                                  style={{ width: `${Math.min(100, Math.max(0, student.progressPercentage || 0))}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-300">
                                {Number(student.progressPercentage || 0).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-300">{formatDate(student.enrolledAt)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </TableShell>
              )}

              {activeTable === 'earnings' && (
                <TableShell title="Earnings">
                  <thead className="text-slate-500 dark:text-slate-400">
                    <tr className="text-left">
                      <th className="px-4 py-2.5 font-medium">Date</th>
                      <th className="px-4 py-2.5 font-medium">Student</th>
                      <th className="px-4 py-2.5 font-medium">Course</th>
                      <th className="px-4 py-2.5 font-medium">Type</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium text-right">Teacher Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {data.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-300">
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      data.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-300">{formatDate(tx.dateTime)}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{tx.studentName || '-'}</td>
                          <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{tx.courseTitle || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800">
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-4 py-3"><TransactionStatus status={tx.status} /></td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                            {money(tx.teacherShare || 0, tx.currency || 'USD')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </TableShell>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function TableShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="hidden md:block relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
        <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">{title}</h2>
      </div>
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">{children}</table>
      </div>
    </div>
  );
}

function InfoCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: typeof AcademicCapIcon }) {
  return (
    <div className="group relative overflow-hidden h-full min-h-[124px] bg-white dark:bg-slate-900/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-200 via-sky-300 to-blue-200 dark:from-green-700 dark:via-sky-700 dark:to-blue-700" />
      <div className="flex justify-between mb-2">
        <span className="h-9 w-9 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-700 dark:text-blue-300" />
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white leading-tight">{value}</p>
      <p className="text-[13px] text-gray-500 mt-1">{title}</p>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1 text-center">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm text-slate-800 dark:text-slate-200 mt-1">{value}</p>
    </div>
  );
}

function EnrollmentStatus({ status }: { status: 'enrolled' | 'in_progress' | 'completed' | 'dropped' }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
      {status.replace('_', ' ')}
    </span>
  );
}

function StatusPill({ status }: { status: 'draft' | 'published' | 'archived' }) {
  const style =
    status === 'published'
      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
      : status === 'draft'
        ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800'
        : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>{status}</span>;
}

function TransactionStatus({ status }: { status: 'success' | 'failed' | 'pending' }) {
  const style =
    status === 'success'
      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
      : status === 'failed'
        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
  return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>{status}</span>;
}
