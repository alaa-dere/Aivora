'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type CertificateItem = {
  id: string;
  certificateNo: string;
  issuedAt: string;
  student: { id: string; name: string; email: string };
  course: { id: string; title: string };
};

export default function TeacherCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/teacher/certificates', { cache: 'no-store' });
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Course Certificates
      </h1>

      <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Loading certificates...</p>
        ) : error ? (
          <p className="p-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : certificates.length === 0 ? (
          <p className="p-4 text-sm text-gray-500 dark:text-gray-400">No certificates found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="text-left px-4 py-3">Certificate No</th>
                  <th className="text-left px-4 py-3">Student</th>
                  <th className="text-left px-4 py-3">Course</th>
                  <th className="text-left px-4 py-3">Issued</th>
                  <th className="text-left px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((cert) => (
                  <tr key={cert.id} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-100">{cert.certificateNo}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      <div>{cert.student.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{cert.student.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">{cert.course.title}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-200">
                      {new Date(cert.issuedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/teacher/certificates/${cert.id}`}
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
