'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function TeacherCertificateViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [cert, setCert] = useState<{
    courseTitle: string;
    studentName: string;
    issuedAt: string;
    certificateNo: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        setError('');
        const res = await fetch(`/api/teacher/certificates/${params.id}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || 'Failed to load certificate');
        }
        if (mounted) {
          setCert(data.certificate);
        }
      } catch (err: unknown) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load certificate');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (!loading && error) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900/60 p-6 text-slate-700 dark:text-slate-200">
        {error}
      </div>
    );
  }

  if (loading || !cert) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900/60 p-6 text-slate-700 dark:text-slate-200">
        Loading certificate...
      </div>
    );
  }

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60 transition-colors duration-300 p-3 sm:p-4 md:p-6">
      <style jsx global>{`
        @media print {
          .certificate-actions {
            display: none;
          }
          body {
            background: white !important;
          }
        }
      `}</style>
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>

        <Link
          href="/teacher/certificates"
          className="text-xs sm:text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          All certificates
        </Link>
      </div>

      <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-6">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-400" />
        <div className="flex justify-center">
          <div className="admin-surface relative inline-block w-full max-w-[920px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900">
            <img src="/tem.png" alt="" className="block w-full h-auto select-none" />
            <div className="absolute inset-0 z-10 px-[8%] py-[6%]">
              <div className="mt-[12%]">
                <div className="text-center text-[#0b2b5a]">
                  <p className="uppercase tracking-[0.24em] sm:tracking-[0.35em] text-[clamp(8px,1.55vw,20px)]">
                    Certificate
                  </p>
                  <p className="mt-1 uppercase tracking-[0.18em] sm:tracking-[0.3em] text-[#0b2b5a]/80 text-[clamp(6px,0.82vw,12px)]">
                    Of Appreciation
                  </p>
                </div>

                <p className="mt-[4%] text-center uppercase tracking-[0.18em] sm:tracking-[0.3em] text-[#0b2b5a]/80 text-[clamp(6px,0.8vw,11px)]">
                  This certificate is proudly presented to
                </p>

                <h1 className="mt-[2.5%] text-center font-semibold text-[#0b2b5a] text-[clamp(13px,2.7vw,36px)]">
                  {cert.studentName}
                </h1>

                <p className="mt-[2.5%] text-center text-[#0b2b5a]/80 text-[clamp(7px,1vw,14px)]">
                  for successfully completing
                </p>
                <p className="mt-[1%] text-center font-semibold text-[#0b2b5a] text-[clamp(8px,1.45vw,20px)]">
                  {cert.courseTitle}
                </p>

                <p className="mx-auto mt-[3%] max-w-[60%] text-center text-[#0b2b5a]/75 leading-relaxed text-[clamp(6px,0.85vw,12px)]">
                  This achievement reflects dedication, persistence, and mastery of the required
                  learning outcomes for this course.
                </p>

                <div className="absolute right-[8%] bottom-[10%] z-20 text-right text-[#0b2b5a]/85">
                  <div className="flex justify-end">
                    <img
                      src="/alaa.png"
                      alt="Aivora Logo"
                      className="mb-0.5 h-[clamp(13px,2.2vw,20px)] w-auto object-contain"
                      style={{
                        filter:
                          'brightness(0) saturate(100%) invert(14%) sepia(21%) saturate(1721%) hue-rotate(183deg) brightness(95%) contrast(98%)',
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-end">
                    <div className="h-px w-[66px] sm:w-24 bg-[#0b2b5a]/60" />
                  </div>
                  <span className="block mt-0.5 text-[clamp(5px,0.7vw,10px)]">
                    Issuer Date: {formatDate(cert.issuedAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="certificate-actions mt-4 sm:mt-6 grid grid-cols-2 sm:flex gap-2 sm:gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            Download (PDF)
          </button>

          <Link
            href="/teacher/certificates"
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-medium hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
          >
            Back to list
          </Link>
        </div>
      </div>
    </div>
  );
}
