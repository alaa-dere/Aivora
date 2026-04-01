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
    <div className="min-h-screen bg-slate-100/80 dark:bg-slate-900/60 p-4 md:p-6 transition-colors duration-300">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          All Certificates
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review issued certificates, linked students, and course details.
        </p>
      </div>

      <div className="admin-surface rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur shadow-md overflow-hidden">
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

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-100/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300">
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
          </>
        )}
      </div>
    </div>
  );
}
