'use client';

import Link from 'next/link';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
} from '@heroicons/react/24/outline';

type CertificateItem = {
  id: string;
  courseTitle: string;
  issuedAt: string;
  status: 'ready' | 'locked';
  progress?: number; // for locked
};

const certificates: CertificateItem[] = [
  { id: 'cert1', courseTitle: 'HTML & CSS', issuedAt: '2026-02-10', status: 'ready' },
  { id: 'cert2', courseTitle: 'Git Fundamentals', issuedAt: '2026-02-15', status: 'ready' },
  { id: 'cert3', courseTitle: 'React Basics', issuedAt: '-', status: 'locked', progress: 72 },
];

export default function CertificatesPage() {
  const ready = certificates.filter((c) => c.status === 'ready');
  const locked = certificates.filter((c) => c.status === 'locked');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Certificates
        </h1>
      </div>

      {/* Ready */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <CheckBadgeIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Ready</h2>
        </div>

        {ready.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No certificates ready yet.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ready.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-blue-100 dark:border-blue-800 p-4 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">{c.courseTitle}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Issued: {c.issuedAt}
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    Ready
                  </span>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/student/certificates/${c.id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View certificate <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Locked */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Locked</h2>

        {locked.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No locked certificates.</p>
        ) : (
          <div className="space-y-3">
            {locked.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-blue-100 dark:border-blue-800 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{c.courseTitle}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Complete the course to unlock this certificate.
                    </p>
                  </div>

                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    Locked
                  </span>
                </div>

                {typeof c.progress === 'number' && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{c.progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
                      <div className="h-full bg-blue-600 dark:bg-blue-400" style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}