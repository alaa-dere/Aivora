"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
  UserCircleIcon,
  EnvelopeIcon,
  AcademicCapIcon,
  TrophyIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

type StudentDetails = {
  student: {
    id: string;
    fullName: string;
    email: string;
    imageUrl?: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  stats: {
    totalCourses: number;
    totalEnrollments: number;
    completedCourses: number;
    avgProgress: number;
    lastEnrollmentDate: string | null;
    totalCourseValue: number;
    certificatesCount: number;
  };
  courses: Array<{
    enrollmentId: string;
    courseId: string;
    title: string;
    status: string;
    progressPercentage: number;
    enrolledAt: string;
    completedAt: string | null;
    price: number;
    avgQuizScore: number;
    quizAttempts: number;
    missedSessions: number;
    attendedSessions: number;
    totalSessions: number;
    certificateId: string | null;
  }>;
  aiRisk: {
    score: number;
    level: "low" | "medium" | "high";
    factors: {
      avgProgress: number;
      avgQuizScore: number;
      maxMissedSessions: number;
    };
  };
  timeline: Array<{
    eventAt: string;
    eventType: string;
    eventTitle: string;
    eventMeta: string;
  }>;
};

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "2-digit" });
};

export default function TeacherStudentDetailsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const studentId = String(params?.id || "");
  const tabParam = (searchParams.get("tab") || "overview").toLowerCase();
  const tab: "overview" | "courses" | "activity" =
    tabParam === "courses" || tabParam === "activity"
      ? (tabParam as "courses" | "activity")
      : "overview";

  const [data, setData] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/api/teacher/students/${studentId}`, { cache: "no-store" });
        const payload = await res.json();
        if (!res.ok) throw new Error(payload?.message || "Failed to load student details");
        if (mounted) setData(payload);
      } catch (err: unknown) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load student details");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [studentId]);

  const cards = useMemo(() => {
    if (!data) return [];
    return [
      { title: "Enrolled Courses", value: data.stats.totalCourses, icon: AcademicCapIcon },
      { title: "Completed", value: data.stats.completedCourses, icon: TrophyIcon },
      { title: "Avg Progress", value: `${data.stats.avgProgress.toFixed(1)}%`, icon: ChartBarIcon },
      { title: "Course Value", value: money(data.stats.totalCourseValue), icon: CurrencyDollarIcon },
    ];
  }, [data]);

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6">
      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-6 mb-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-sky-50 dark:bg-white/10 border border-sky-100 dark:border-white/20 flex items-center justify-center overflow-hidden">
              {data?.student.imageUrl ? (
                <img src={data.student.imageUrl} alt={data.student.fullName} className="h-full w-full object-cover" />
              ) : (
                <UserCircleIcon className="h-8 w-8 text-sky-700 dark:text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Student Details</h1>
              <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 font-medium">
                {data?.student.fullName || "-"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 inline-flex items-center gap-1.5">
                <EnvelopeIcon className="w-4 h-4" />
                {data?.student.email || "-"}
              </p>
              <div className="mt-3 flex gap-5 text-sm font-semibold">
                {[
                  { key: "overview", label: "Overview" },
                  { key: "courses", label: "Courses" },
                  { key: "activity", label: "Activity" },
                ].map((item) => (
                  <Link
                    key={item.key}
                    href={`/teacher/students/${studentId}?tab=${item.key}`}
                    className={tab === item.key ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400"}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {loading && <div className="text-sm text-slate-500 dark:text-slate-300">Loading student details...</div>}
      {!loading && error && <div className="text-sm text-red-600 dark:text-red-400">{error}</div>}

      {!loading && !error && data && (
        <div className="space-y-6">
          {tab === "overview" && (
            <>
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {cards.map((card) => (
                  <div key={card.title} className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-sky-500" />
                    <card.icon className="w-5 h-5 text-blue-600 dark:text-blue-300 mb-3" />
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{card.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{card.title}</p>
                  </div>
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 admin-surface relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white/85 dark:bg-slate-900/75">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-400 via-sky-400 to-cyan-300 dark:from-slate-700 dark:via-sky-700 dark:to-cyan-700" />
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Student Snapshot</h2>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <Row label="Status" value={data.student.status} />
                    <Row label="Certificates" value={String(data.stats.certificatesCount)} />
                    <Row label="Last Enrollment" value={formatDate(data.stats.lastEnrollmentDate)} />
                    <Row label="Joined Platform" value={formatDate(data.student.createdAt)} />
                  </div>
                </div>

                <div className="admin-surface relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white/85 dark:bg-slate-900/75">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-orange-400 to-rose-400" />
                  <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                    AI Risk
                  </h2>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{data.aiRisk.score}%</p>
                  <p className="text-sm mt-1 text-slate-600 dark:text-slate-300 capitalize">
                    {data.aiRisk.level} risk
                  </p>
                  <div className="mt-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                    <p>Avg progress: {data.aiRisk.factors.avgProgress.toFixed(1)}%</p>
                    <p>Avg quiz: {data.aiRisk.factors.avgQuizScore.toFixed(1)}%</p>
                    <p>Max missed sessions: {data.aiRisk.factors.maxMissedSessions}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === "courses" && (
            <div className="admin-surface rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75">
              <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium">Course</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 font-medium">Quiz</th>
                    <th className="px-4 py-3 font-medium">Attendance</th>
                    <th className="px-4 py-3 font-medium">Certificate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.courses.map((course) => (
                    <tr key={course.enrollmentId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{course.title}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{course.status.replace("_", " ")}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{course.progressPercentage.toFixed(0)}%</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {course.quizAttempts} attempts | {course.avgQuizScore.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {course.attendedSessions}/{course.totalSessions} attended | {course.missedSessions} missed
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{course.certificateId ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="md:hidden p-2.5 space-y-2.5">
                {data.courses.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-300 px-2 py-6">No courses yet.</p>
                ) : (
                  data.courses.map((course) => (
                    <div
                      key={`mobile-${course.enrollmentId}`}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-3"
                    >
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{course.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                        Status: <span className="text-slate-700 dark:text-slate-300">{course.status.replace("_", " ")}</span>
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="text-slate-500 dark:text-slate-400">Progress</div>
                        <div className="text-right text-slate-700 dark:text-slate-300">{course.progressPercentage.toFixed(0)}%</div>
                        <div className="text-slate-500 dark:text-slate-400">Quiz</div>
                        <div className="text-right text-slate-700 dark:text-slate-300">{course.avgQuizScore.toFixed(1)}%</div>
                        <div className="text-slate-500 dark:text-slate-400">Attempts</div>
                        <div className="text-right text-slate-700 dark:text-slate-300">{course.quizAttempts}</div>
                        <div className="text-slate-500 dark:text-slate-400">Attendance</div>
                        <div className="text-right text-slate-700 dark:text-slate-300">
                          {course.attendedSessions}/{course.totalSessions}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">Missed</div>
                        <div className="text-right text-slate-700 dark:text-slate-300">{course.missedSessions}</div>
                        <div className="text-slate-500 dark:text-slate-400">Certificate</div>
                        <div className="text-right text-slate-700 dark:text-slate-300">{course.certificateId ? "Yes" : "No"}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "activity" && (
            <div className="admin-surface rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75 p-5">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {data.timeline.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-300">No activity yet.</p>
                ) : (
                  data.timeline.map((event, idx) => (
                    <div key={`${event.eventAt}-${idx}`} className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{event.eventTitle}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{event.eventMeta}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{formatDate(event.eventAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 bg-white/60 dark:bg-slate-800/40">
      <span className="text-slate-600 dark:text-slate-300">{label}</span>
      <span className="font-semibold text-slate-900 dark:text-white">{value}</span>
    </div>
  );
}
