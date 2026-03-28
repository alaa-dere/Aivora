'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AcademicCapIcon,
  TrophyIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

type StudentProfile = {
  id: string;
  fullName: string;
  email: string;
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
  return d.toLocaleDateString('en-US');
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = (params?.id as string) || '';

  const [tab, setTab] = useState<'overview' | 'courses' | 'transactions'>('overview');
  const [data, setData] = useState<StudentProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!studentId) return;
    let isMounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/students?id=${studentId}`, { cache: 'no-store' });
        const payload = await res.json();
        if (!res.ok) {
          throw new Error(payload?.message || 'Failed to load student profile');
        }
        if (isMounted) {
          setData(payload);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load student profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      isMounted = false;
    };
  }, [studentId]);

  const stats = data?.stats;
  const overviewCards = useMemo(() => {
    return [
      {
        title: 'Enrolled Courses',
        value: stats?.totalCourses ?? 0,
        icon: AcademicCapIcon,
      },
      {
        title: 'Completed Courses',
        value: stats?.completedEnrollments ?? 0,
        icon: TrophyIcon,
      },
      {
        title: 'Avg Progress',
        value: `${Number(stats?.avgProgress || 0).toFixed(1)}%`,
        icon: ChartBarIcon,
      },
      {
        title: 'Total Spent',
        value: money(stats?.totalSpent ?? 0),
        icon: CurrencyDollarIcon,
      },
    ];
  }, [stats]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-blue-200 dark:border-blue-800 p-6 mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Student Profile</h1>
            <p className="text-sm text-gray-500 mt-2">
              Name:{' '}
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {data?.student.fullName || '-'}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/students"
              className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border border-gray-200 text-gray-600 bg-white hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-700 transition-colors"
            >
              Back to all students
            </Link>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                data?.student.status === 'inactive'
                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800'
                  : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-800'
              }`}
            >
              {data?.student.status === 'inactive' ? 'Inactive' : 'Active'}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800">
              {data?.student.role || 'Student'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'courses', label: 'Courses' },
          { key: 'transactions', label: 'Transactions' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.key
                ? 'bg-blue-950 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-blue-800 p-10 text-center text-gray-500 dark:text-gray-300">
          Loading student profile...
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 dark:bg-red-900/30 rounded-2xl border border-red-200 dark:border-red-800 p-6 text-center text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-blue-200 dark:border-blue-800 p-6 shadow-sm">
          {tab === 'overview' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {overviewCards.map((card) => (
                  <InfoCard key={card.title} title={card.title} value={card.value} icon={card.icon} />
                ))}
              </div>

              <div className="grid lg:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Profile Details</h2>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <dt className="text-gray-500">Full Name</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white">{data.student.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Email</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white">{data.student.email}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Joined</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white">{formatDate(data.student.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Last Updated</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white">{formatDate(data.student.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Last Enrollment</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white">{formatDate(stats?.lastEnrollmentDate)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Total Enrollments</dt>
                      <dd className="font-semibold text-gray-900 dark:text-white">{stats?.totalEnrollments ?? 0}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 bg-gray-50 dark:bg-gray-900">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Payment Snapshot</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <SummaryRow label="Total Spent" value={money(stats?.totalSpent ?? 0)} />
                    <SummaryRow label="This Month" value={money(stats?.monthSpent ?? 0)} />
                    <SummaryRow label="Refunds" value={money(stats?.refundTotal ?? 0)} />
                    <SummaryRow label="Avg Progress" value={`${Number(stats?.avgProgress || 0).toFixed(1)}%`} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === 'courses' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Pill label={`Courses ${stats?.totalCourses ?? 0}`} />
                <Pill label={`Completed ${stats?.completedEnrollments ?? 0}`} />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">Course</th>
                      <th className="px-4 py-3 font-medium">Teacher</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Progress</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.courses.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-gray-500 dark:text-gray-300">
                          No enrollments found for this student.
                        </td>
                      </tr>
                    ) : (
                      data.courses.map((course) => (
                        <tr key={course.enrollmentId} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-gray-900 dark:text-white">{course.title}</div>
                            <div className="text-xs text-gray-500">ID: {course.courseId}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                            {course.teacherName || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <EnrollmentStatus status={course.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-2 w-20 rounded-full bg-gray-200 dark:bg-gray-700">
                                <div
                                  className="h-2 rounded-full bg-blue-600"
                                  style={{ width: `${Math.min(100, Math.max(0, course.progressPercentage || 0))}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-300">
                                {Number(course.progressPercentage || 0).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                            {money(course.price)}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-300">
                            {formatDate(course.enrolledAt)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'transactions' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <InfoCard title="Total Spent" value={money(stats?.totalSpent ?? 0)} icon={CurrencyDollarIcon} />
                <InfoCard title="This Month" value={money(stats?.monthSpent ?? 0)} icon={ArrowTrendingUpIcon} />
                <InfoCard title="Refunds" value={money(stats?.refundTotal ?? 0)} icon={ClipboardDocumentListIcon} />
                <InfoCard title="Courses" value={stats?.totalCourses ?? 0} icon={AcademicCapIcon} />
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Course</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.transactions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-gray-500 dark:text-gray-300">
                          No transactions recorded yet.
                        </td>
                      </tr>
                    ) : (
                      data.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10">
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-300">{formatDateTime(tx.dateTime)}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{tx.courseTitle || '-'}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800">
                              {tx.type}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <TransactionStatus status={tx.status} />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                            {money(tx.amount || 0, tx.currency || 'USD')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: any }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-700 hover:-translate-y-1 transition-all">
      <div className="flex justify-between mb-2">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/70 px-4 py-3">
      <span className="text-gray-600 dark:text-gray-300 text-sm">{label}</span>
      <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800">
      {label}
    </span>
  );
}

function EnrollmentStatus({ status }: { status: 'enrolled' | 'in_progress' | 'completed' | 'dropped' }) {
  const style =
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
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
