'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { API_ROUTES } from '@aivora/shared';

type JobPosting = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  otherNotes: string | null;
};

export default function JobOpeningsPage() {
  const { theme } = useTheme();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const bgUrl = useMemo(() => {
    return theme === 'dark' ? "url('/plain2dd.png')" : "url('/plain2.png')";
  }, [theme]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(API_ROUTES.jobPostings, { cache: 'no-store' });
        const data = await res.json();
        if (res.ok) setJobs(Array.isArray(data?.jobs) ? data.jobs : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const selectedJob = useMemo(() => jobs.find((j) => j.id === selectedJobId) || null, [jobs, selectedJobId]);

  const submit = async () => {
    setError('');
    setMessage('');
    if (!selectedJobId || !fullName.trim() || !email.trim() || !cvFile) {
      setError('Please choose a job and complete required fields.');
      return;
    }
    try {
      setSubmitting(true);
      const payload = new FormData();
      payload.append('jobPostingId', selectedJobId);
      payload.append('fullName', fullName.trim());
      payload.append('email', email.trim());
      payload.append('phone', phone.trim());
      payload.append('bio', bio.trim());
      payload.append('cv', cvFile);
      const res = await fetch(API_ROUTES.instructorApplications, { method: 'POST', body: payload });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to submit application');
      setMessage('Application submitted successfully.');
      setFullName('');
      setEmail('');
      setPhone('');
      setBio('');
      setCvFile(null);
      setSelectedJobId('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative text-[13px] sm:text-base text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-no-repeat transition-[filter] duration-500"
        style={{
          backgroundImage: bgUrl,
          backgroundPosition: '50% 50%',
          filter: theme === 'dark' ? 'brightness(0.85) saturate(1.05)' : 'brightness(1.05) saturate(1.0)',
        }}
      />
      <div className={`fixed inset-0 -z-10 transition-opacity duration-500 ${theme === 'dark' ? 'bg-black/25' : 'bg-white/20'}`} />

      <header className="fixed top-0 left-0 right-0 z-50 px-2.5 sm:px-4 pt-8 sm:pt-4">
        <div className="mx-auto max-w-7xl rounded-2xl border border-stone-200/80 dark:border-slate-700/80 bg-stone-50/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-lg px-2.5 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src="/alaa.png"
                alt="Aivora Logo"
                width={100}
                height={35}
                className="h-5 sm:h-7 w-auto dark:brightness-100 brightness-25"
              />
            </Link>
            <Link href="/" className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60">
              Back Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-2.5 py-3 sm:p-6 pt-22 sm:pt-28 md:pt-36 scale-95 sm:scale-100 origin-top">
        <div className="admin-surface rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/85 dark:bg-slate-900/75 p-3 sm:p-6">
          <h1 className="text-xl sm:text-4xl font-black leading-tight">Job Openings</h1>

        {loading ? (
          <p className="mt-6 text-slate-500 dark:text-slate-300">Loading jobs...</p>
        ) : jobs.length === 0 ? (
          <p className="mt-6 text-slate-500 dark:text-slate-300">No open jobs right now.</p>
        ) : (
          <div className="mt-5 sm:mt-6 grid gap-2.5 sm:gap-3">
            {jobs.map((job) => (
              <button
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className={`group w-full text-left rounded-xl border p-3 sm:p-4 cursor-pointer transition-all duration-200 ${
                  selectedJobId === job.id
                    ? 'border-blue-400 bg-blue-50 dark:bg-blue-500/15 shadow-md'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <p className="font-semibold text-base sm:text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  {job.title}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-line">{job.description}</p>
              </button>
            ))}
          </div>
        )}

        {selectedJob && (
          <div className="mt-5 sm:mt-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3 sm:p-4">
            <h2 className="text-xl sm:text-2xl font-bold leading-tight">{selectedJob.title}</h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 whitespace-pre-line">{selectedJob.description}</p>
            <p className="text-xs sm:text-sm mt-3 whitespace-pre-line"><strong>Requirements:</strong>{'\n'}{selectedJob.requirements}</p>
            <p className="text-xs sm:text-sm mt-2 whitespace-pre-line"><strong>Responsibilities:</strong>{'\n'}{selectedJob.responsibilities}</p>
            {selectedJob.otherNotes ? <p className="text-xs sm:text-sm mt-2 whitespace-pre-line"><strong>Other Notes:</strong>{'\n'}{selectedJob.otherNotes}</p> : null}

            <div className="mt-5 grid sm:grid-cols-2 gap-2">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full px-3 py-2.5 text-sm rounded bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full px-3 py-2.5 text-sm rounded bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full px-3 py-2.5 text-sm rounded bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700" />
              <input type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setCvFile(e.target.files?.[0] || null)} className="w-full px-3 py-2.5 text-sm rounded bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700 file:mr-2 file:px-2 file:py-1 file:rounded file:border-0 file:bg-blue-200/80 file:text-blue-950" />
            </div>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Short background (optional)" className="mt-2 w-full px-3 py-2.5 text-sm rounded bg-white dark:bg-slate-900/60 border border-slate-300 dark:border-slate-700" />
            {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
            {message && <p className="mt-2 text-sm text-emerald-300">{message}</p>}
            <button onClick={submit} disabled={submitting} className="mt-3 w-full sm:w-auto px-4 py-2.5 rounded bg-blue-700 hover:bg-blue-600 disabled:opacity-60 text-sm font-semibold">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
