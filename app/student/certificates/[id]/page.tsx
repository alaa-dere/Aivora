'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import {
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

const mockCerts: Record<
  string,
  { courseTitle: string; studentName: string; issuedAt: string; certificateNo: string }
> = {
  cert1: {
    courseTitle: 'HTML & CSS',
    studentName: 'Student User',
    issuedAt: '2026-02-10',
    certificateNo: 'AIV-HTML-2026-0210',
  },
  cert2: {
    courseTitle: 'Git Fundamentals',
    studentName: 'Student User',
    issuedAt: '2026-02-15',
    certificateNo: 'AIV-GIT-2026-0215',
  },
};

export default function CertificateViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const cert = useMemo(() => mockCerts[params.id], [params.id]);

  if (!cert) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 text-gray-700 dark:text-gray-200">
        Certificate not found.
      </div>
    );
  }

  const downloadDemo = () => {
    alert('Demo: download PDF later');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>

        <Link
          href="/student/certificates"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          All certificates
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
        {/* Certificate frame */}
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 p-6 md:p-10 bg-gradient-to-b from-blue-50 to-white dark:from-blue-900/10 dark:to-gray-800">
          <div className="flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300">
            <AcademicCapIcon className="w-7 h-7" />
            <p className="text-lg font-semibold">Aivora Certificate</p>
          </div>

          <h1 className="mt-6 text-center text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Certificate of Completion
          </h1>

          <p className="mt-6 text-center text-gray-600 dark:text-gray-300">
            This certifies that
          </p>

          <p className="mt-2 text-center text-2xl font-bold text-blue-700 dark:text-blue-300">
            {cert.studentName}
          </p>

          <p className="mt-6 text-center text-gray-600 dark:text-gray-300">
            has successfully completed the course
          </p>

          <p className="mt-2 text-center text-xl font-semibold text-gray-900 dark:text-white">
            {cert.courseTitle}
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-800 bg-white/70 dark:bg-gray-900/20">
              <p className="text-xs text-gray-500 dark:text-gray-400">Issued</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{cert.issuedAt}</p>
            </div>
            <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-800 bg-white/70 dark:bg-gray-900/20">
              <p className="text-xs text-gray-500 dark:text-gray-400">Certificate No.</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{cert.certificateNo}</p>
            </div>
            <div className="p-3 rounded-xl border border-blue-100 dark:border-blue-800 bg-white/70 dark:bg-gray-900/20">
              <p className="text-xs text-gray-500 dark:text-gray-400">Platform</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Aivora LMS</p>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
            (Demo) Later we will add QR + PDF download & verification.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={downloadDemo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Download (Demo)
          </button>

          <Link
            href="/student/certificates"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
          >
            Back to list
          </Link>
        </div>
      </div>
    </div>
  );
}