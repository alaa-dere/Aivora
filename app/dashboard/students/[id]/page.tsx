'use client';

import { useEffect, useMemo, useState, type ComponentType } from 'react';
import { useParams } from 'next/navigation';
import {
  AcademicCapIcon,
  TrophyIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  UserCircleIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

type StudentProfile = {
  id: string;
  fullName: string;
  email: string;
  imageUrl?: string | null;
  status: 'active' | 'inactive';
  role: string;
  createdAt: string;
  updatedAt: string;
};

type StudentStats = {
  totalCourses: number;
  totalEnrollments: number;
  completedEnrollments: number;
  avgProgress: number;
  lastEnrollmentDate: string | null;
  totalSpent: number;
  monthSpent: number;
  refundTotal: number;
};

type StudentCourse = {
  enrollmentId: string;
  courseId: string;
  title: string;
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped';
  progressPercentage: number;
  enrolledAt: string;
  completedAt: string | null;
  price: number;
  teacherName: string | null;
};

type StudentTransaction = {
  id: string;
  date: string;
  dateTime: string;
  type: 'enrollment' | 'refund';
  status: 'success' | 'failed' | 'pending';
  amount: number;
  currency: string;
  courseTitle: string | null;
};

type StudentProfileResponse = {
  student: StudentProfile;
  stats: StudentStats;
  courses: StudentCourse[];
  transactions: StudentTransaction[];
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

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = (params?.id as string) || '';
  const [data, setData] = useState<StudentProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTable, setActiveTable] = useState<'courses' | 'transactions'>('courses');

  useEffect(() => {
    if (!studentId) return;
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/students?id=${studentId}`, { cache: 'no-store' });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || 'Failed to load student profile');
        if (isMounted) setData(payload);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load student profile';
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const stats = data?.stats;
  const overviewCards = useMemo(
    () => [
      { title: 'Enrolled Courses', value: stats?.totalCourses ?? 0, icon: AcademicCapIcon },
      { title: 'Completed Courses', value: stats?.completedEnrollments ?? 0, icon: TrophyIcon },
      { title: 'Avg Progress', value: `${Number(stats?.avgProgress || 0).toFixed(1)}%`, icon: ChartBarIcon },
      { title: 'Total Spent', value: money(stats?.totalSpent ?? 0), icon: CurrencyDollarIcon },
    ],
    [stats]
  );

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6">
      <div className="mb-5">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">Student Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Overview, courses, and transactions in one place.</p>
      </div>

      {loading && (
        <div className="admin-surface bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-gray-500 dark:text-gray-300">
          Loading student profile...
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
                <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-5">Profile Details</h2>
                <div className="flex flex-col items-center text-center mb-6 mt-2">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-green-50 to-blue-50 dark:from-white/10 dark:to-white/10 border border-green-100 dark:border-white/20 flex items-center justify-center overflow-hidden">
                    {data.student.imageUrl ? (
                      <img src={data.student.imageUrl} alt={data.student.fullName || 'Student'} className="h-full w-full rounded-2xl object-cover" />
                    ) : (
                      <UserCircleIcon className="h-12 w-12 text-blue-700 dark:text-white" />
                    )}
                  </div>
                  <div className="mt-3">
                    <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{data.student.fullName}</p>
                    <p className="text-[15px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1.5 mt-1">
                      <EnvelopeIcon className="w-4 h-4" />
                      {data.student.email}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <ProfileField label="Joined" value={formatDate(data.student.createdAt)} />
                  <ProfileField label="Last Updated" value={formatDate(data.student.updatedAt)} />
                  <ProfileField label="Last Enrollment" value={formatDate(stats?.lastEnrollmentDate)} />
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
              <div className="mt-8 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTable('courses')}
                  className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
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
                  onClick={() => setActiveTable('transactions')}
                  className={`inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                    activeTable === 'transactions'
                      ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-slate-900/40 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <CurrencyDollarIcon className="w-4 h-4" />
                  Transactions
                </button>
              </div>

              <div className="md:hidden space-y-4">
                {activeTable === 'courses' ? (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Courses</h2>
                    </div>
                    <div className="p-3 space-y-2">
                      {data.courses.length === 0 ? (
                        <p className="px-1 py-6 text-center text-sm text-gray-500 dark:text-gray-300">No enrollments found for this student.</p>
                      ) : (
                        data.courses.map((course) => (
                          <div key={course.enrollmentId} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100 line-clamp-2">{course.title}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{formatDate(course.enrolledAt)}</p>
                              </div>
                              <EnrollmentStatus status={course.status} />
                            </div>
                            <div className="mt-3 flex items-center gap-3">
                              <div className="h-2 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-blue-500"
                                  style={{ width: `${Math.min(100, Math.max(0, course.progressPercentage || 0))}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-300">{Number(course.progressPercentage || 0).toFixed(0)}%</span>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span>{money(course.price)}</span>
                              <span>{course.teacherName || 'Teacher'}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm">
                    <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                      <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Transactions</h2>
                    </div>
                    <div className="p-3 space-y-2">
                      {data.transactions.length === 0 ? (
                        <p className="px-1 py-6 text-center text-sm text-gray-500 dark:text-gray-300">No transactions recorded yet.</p>
                      ) : (
                        data.transactions.map((tx) => (
                          <div key={tx.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-100 line-clamp-2">{tx.courseTitle || '-'}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{formatDate(tx.dateTime)}</p>
                              </div>
                              <TransactionStatus status={tx.status} />
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800">
                                {tx.type}
                              </span>
                              <span className="font-semibold text-slate-800 dark:text-slate-100">{money(tx.amount || 0, tx.currency || 'USD')}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {activeTable === 'courses' && (
                <div className="relative hidden md:block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                    <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Courses</h2>
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-sm table-fixed">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr className="text-left">
                          <th className="px-4 py-2.5 font-medium w-[34%]">Course</th>
                          <th className="px-4 py-2.5 font-medium w-[18%]">Status</th>
                          <th className="px-4 py-2.5 font-medium w-[20%]">Progress</th>
                          <th className="px-4 py-2.5 font-medium w-[14%]">Price</th>
                          <th className="px-4 py-2.5 font-medium w-[14%]">Enrolled</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                        {data.courses.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-300">
                              No enrollments found for this student.
                            </td>
                          </tr>
                        ) : (
                          data.courses.map((course) => (
                            <tr key={course.enrollmentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 truncate">{course.title}</td>
                              <td className="px-4 py-3"><EnrollmentStatus status={course.status} /></td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  <div className="h-2 w-24 rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.min(100, Math.max(0, course.progressPercentage || 0))}%` }} />
                                  </div>
                                  <span className="text-xs text-gray-500 dark:text-gray-300">{Number(course.progressPercentage || 0).toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{money(course.price)}</td>
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-300">{formatDate(course.enrolledAt)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTable === 'transactions' && (
                <div className="relative hidden md:block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60">
                    <h2 className="text-base font-semibold text-slate-700 dark:text-slate-200">Transactions</h2>
                  </div>
                  <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full text-sm table-fixed">
                      <thead className="text-slate-500 dark:text-slate-400">
                        <tr className="text-left">
                          <th className="px-4 py-2.5 font-medium w-[18%]">Date</th>
                          <th className="px-4 py-2.5 font-medium w-[34%]">Course</th>
                          <th className="px-4 py-2.5 font-medium w-[14%]">Type</th>
                          <th className="px-4 py-2.5 font-medium w-[14%]">Status</th>
                          <th className="px-4 py-2.5 font-medium w-[20%] text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                        {data.transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-300">
                              No transactions recorded yet.
                            </td>
                          </tr>
                        ) : (
                          data.transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                              <td className="px-4 py-3 text-gray-500 dark:text-gray-300">{formatDate(tx.dateTime)}</td>
                              <td className="px-4 py-3 text-slate-700 dark:text-slate-200 truncate">{tx.courseTitle || '-'}</td>
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800">{tx.type}</span>
                              </td>
                              <td className="px-4 py-3"><TransactionStatus status={tx.status} /></td>
                              <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{money(tx.amount || 0, tx.currency || 'USD')}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </section>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  icon: ComponentType<{ className?: string }>;
}) {
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

function TransactionStatus({ status }: { status: 'success' | 'failed' | 'pending' }) {
  const style =
    status === 'success'
      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
      : status === 'failed'
      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
      : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
      {status}
    </span>
  );
}
