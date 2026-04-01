'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

export default function AdminCertificateViewPage() {
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
        const res = await fetch(`/api/admin/certificates/${params.id}`, { cache: 'no-store' });
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
      <div className="min-h-screen bg-slate-100/80 dark:bg-slate-900/60 p-6 text-slate-700 dark:text-slate-200">
        {error}
      </div>
    );
  }

  if (loading || !cert) {
    return (
      <div className="min-h-screen bg-slate-100/80 dark:bg-slate-900/60 p-6 text-slate-700 dark:text-slate-200">
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
    <div className="min-h-screen bg-slate-100/80 dark:bg-slate-900/60 transition-colors duration-300">
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
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back
        </button>

        <Link
          href="/dashboard/certificates"
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          All certificates
        </Link>
      </div>

      <div className="admin-surface bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex justify-center">
          <div className="admin-surface relative inline-block w-full max-w-[920px] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900">
            <img src="/tem.png" alt="" className="block w-full h-auto select-none" />
            <div className="absolute inset-0 z-10 px-[8%] py-[6%]">
              <div className="mt-[12%]">
                <div className="text-center text-[#0b2b5a]">
                  <p className="uppercase tracking-[0.35em] text-[clamp(14px,2.2vw,20px)]">
                    Certificate
                  </p>
                  <p className="mt-1 uppercase tracking-[0.3em] text-[#0b2b5a]/80 text-[clamp(10px,1.2vw,12px)]">
                    Of Appreciation
                  </p>
                </div>

                <p className="mt-[4%] text-center uppercase tracking-[0.3em] text-[#0b2b5a]/80 text-[clamp(9px,1vw,11px)]">
                  This certificate is proudly presented to
                </p>

                <h1 className="mt-[2.5%] text-center font-semibold text-[#0b2b5a] text-[clamp(24px,4vw,36px)]">
                  {cert.studentName}
                </h1>

                <p className="mt-[2.5%] text-center text-[#0b2b5a]/80 text-[clamp(11px,1.4vw,14px)]">
                  for successfully completing
                </p>
                <p className="mt-[1%] text-center font-semibold text-[#0b2b5a] text-[clamp(14px,2.2vw,20px)]">
                  {cert.courseTitle}
                </p>

                <p className="mx-auto mt-[3%] max-w-[60%] text-center text-[#0b2b5a]/75 leading-relaxed text-[clamp(10px,1.2vw,12px)]">
                  This achievement reflects dedication, persistence, and mastery of the required
                  learning outcomes for this course.
                </p>

                <div className="mt-[4%] grid grid-cols-1 gap-4 text-[#0b2b5a]/80 text-[clamp(10px,1.1vw,12px)] md:grid-cols-3">
                  <div />
                  <div />
                  <div className="text-left md:text-right">
                    <div className="flex justify-end">
                      <img
                        src="/alaa.png"
                        alt="Aivora Logo"
                        className="mb-1 h-[clamp(20px,3vw,30px)] w-auto object-contain"
                        style={{
                          filter:
                            'brightness(0) saturate(100%) invert(14%) sepia(21%) saturate(1721%) hue-rotate(183deg) brightness(95%) contrast(98%)',
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-end">
                      <div className="h-px w-32 bg-[#0b2b5a]/60" />
                    </div>
                    <span>Issuer Date: {formatDate(cert.issuedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="certificate-actions mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Download (PDF)
          </button>

          <Link
            href="/dashboard/certificates"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors"
          >
            Back to list
          </Link>
        </div>
      </div>
    </div>
  );
}
