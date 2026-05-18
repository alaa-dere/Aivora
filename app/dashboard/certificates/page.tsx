'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type CertificateItem = {
  id: string;
  certificateNo: string;
  issuedAt: string;
  student: { id: string; name: string; email: string };
  course: { id: string; title: string };
  teacher: { id: string; name: string };
};

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/certificates', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load certificates');
        }
        setCertificates(data.certificates || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load certificates');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 p-3 sm:p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          All Certificates
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review issued certificates, linked students, and course details.
        </p>
      </div>

      <div className="admin-surface relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75 backdrop-blur shadow-md overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400" />
        {loading ? (
          <p className="p-4 text-sm text-slate-500 dark:text-slate-400">Loading certificates...</p>
        ) : error ? (
          <p className="p-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : certificates.length === 0 ? (
          <p className="p-4 text-sm text-slate-500 dark:text-slate-400">No certificates found.</p>
        ) : (
          <>
            <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Certificates List{' '}
                <span className="text-gray-400 font-normal">({certificates.length})</span>
              </p>
            </div>

            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="text-left px-4 py-3">Student</th>
                    <th className="text-left px-4 py-3">Course</th>
                    <th className="text-left px-4 py-3">Teacher</th>
                    <th className="text-left px-4 py-3">Issued</th>
                    <th className="text-left px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {certificates.map((cert) => (
                    <tr key={cert.id} className="border-t border-slate-200/70 dark:border-slate-800">
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        <div>{cert.student.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{cert.student.email}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{cert.course.title}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{cert.teacher.name}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                        {new Date(cert.issuedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/certificates/${cert.id}`}
                          className="inline-flex items-center justify-center px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden p-2.5 space-y-2.5">
              {certificates.map((cert) => (
                <div
                  key={`mobile-${cert.id}`}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 p-3"
                >
                  <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{cert.student.name}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 break-words">{cert.student.email}</p>

                  <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
                    <div className="text-slate-500 dark:text-slate-400">Course</div>
                    <div className="text-right text-slate-700 dark:text-slate-300">{cert.course.title}</div>
                    <div className="text-slate-500 dark:text-slate-400">Teacher</div>
                    <div className="text-right text-slate-700 dark:text-slate-300">{cert.teacher.name}</div>
                    <div className="text-slate-500 dark:text-slate-400">Issued</div>
                    <div className="text-right text-slate-700 dark:text-slate-300">
                      {new Date(cert.issuedAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="mt-3">
                    <Link
                      href={`/dashboard/certificates/${cert.id}`}
                      className="inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-[10px] hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors font-medium"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
