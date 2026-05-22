'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { ArrowLeftIcon, GlobeAltIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
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
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
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

  const isArabic = language === 'ar';

  const bgUrl = useMemo(
    () => (theme === 'dark' ? "url('/plain2dd.png')" : "url('/plain2.png')"),
    [theme]
  );

  const t = {
    pageLabel: isArabic ? 'اكتشف أيفورا' : 'Discover Aivora',
    pageTitleA: isArabic ? 'الفرص' : 'Job',
    pageTitleB: isArabic ? 'الوظيفية' : 'Openings',
    pageDesc: isArabic
      ? 'استكشف الوظائف المتاحة حالياً وقدّم على الفرصة المناسبة لخبرتك.'
      : 'Explore current roles and apply to the opportunity that fits your expertise.',

    home: isArabic ? 'الرئيسية' : 'Home',
    loading: isArabic ? 'جاري تحميل الوظائف...' : 'Loading jobs...',
    noJobs: isArabic ? 'لا توجد وظائف مفتوحة حالياً.' : 'No open jobs right now.',

    requirements: isArabic ? 'المتطلبات:' : 'Requirements:',
    responsibilities: isArabic ? 'المسؤوليات:' : 'Responsibilities:',
    otherNotes: isArabic ? 'ملاحظات إضافية:' : 'Other Notes:',

    fullName: isArabic ? 'الاسم الكامل' : 'Full Name',
    email: isArabic ? 'البريد الإلكتروني' : 'Email',
    phone: isArabic ? 'رقم الهاتف (اختياري)' : 'Phone (optional)',
    bio: isArabic ? 'نبذة قصيرة (اختياري)' : 'Short background (optional)',

    submit: isArabic ? 'إرسال الطلب' : 'Submit Application',
    submitting: isArabic ? 'جارٍ الإرسال...' : 'Submitting...',

    fillRequired: isArabic
      ? 'يرجى اختيار وظيفة وإكمال الحقول المطلوبة.'
      : 'Please choose a job and complete required fields.',
    submitSuccess: isArabic ? 'تم إرسال الطلب بنجاح.' : 'Application submitted successfully.',
    submitFail: isArabic ? 'فشل إرسال الطلب' : 'Failed to submit application',

    toggleTheme: isArabic ? 'تبديل الوضع' : 'Toggle theme',
    switchToEnglish: 'Switch to English',
    switchToArabic: 'التبديل إلى العربية',
  };

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

  const selectedJob = useMemo(() => jobs.find((job) => job.id === selectedJobId) || null, [jobs, selectedJobId]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));

  const submit = async () => {
    setError('');
    setMessage('');

    if (!selectedJobId || !fullName.trim() || !email.trim() || !cvFile) {
      setError(t.fillRequired);
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

      const res = await fetch(API_ROUTES.instructorApplications, {
        method: 'POST',
        body: payload,
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data?.message || t.submitFail);

      setMessage(t.submitSuccess);
      setFullName('');
      setEmail('');
      setPhone('');
      setBio('');
      setCvFile(null);
      setSelectedJobId('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.submitFail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      dir={isArabic ? 'rtl' : 'ltr'}
      className="min-h-screen relative text-[13px] sm:text-base text-slate-900 dark:text-slate-100 transition-colors duration-300"
    >
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

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                <span>{t.home}</span>
              </Link>

              <button
                onClick={toggleLanguage}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle language"
                title={isArabic ? t.switchToEnglish : t.switchToArabic}
              >
                <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 dark:text-white" />
              </button>

              <button
                onClick={toggleTheme}
                className="p-1.5 sm:p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
                title={t.toggleTheme}
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 dark:text-white" />
                ) : (
                  <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-900 dark:text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-24 md:pt-32 pb-10">
        <section className="px-5 sm:px-6 lg:px-8">
          <div className={`max-w-7xl mx-auto ${isArabic ? 'text-right' : 'text-left'}`}>
            <p className="text-blue-300 text-xs sm:text-sm tracking-[0.25em] uppercase mb-2 sm:mb-3">{t.pageLabel}</p>
            <h1 className="text-2xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white">
              {t.pageTitleA} <span className="text-blue-300">{t.pageTitleB}</span>
            </h1>
            <p className="mt-3 text-slate-200 max-w-2xl text-sm sm:text-base">{t.pageDesc}</p>

            {loading ? (
              <p className="mt-6 text-white/85">{t.loading}</p>
            ) : jobs.length === 0 ? (
              <p className="mt-6 text-white/85">{t.noJobs}</p>
            ) : (
              <div className="mt-5 sm:mt-6 grid gap-2.5 sm:gap-3">
                {jobs.map((job) => (
                  <button
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`group w-full text-left rounded-xl border p-3 sm:p-4 cursor-pointer transition-all duration-200 ${
                      selectedJobId === job.id
                        ? 'border-blue-400 bg-blue-500/15 shadow-md backdrop-blur-md'
                        : 'border-slate-200/70 dark:border-slate-700/80 bg-white/10 dark:bg-slate-900/25 backdrop-blur-md hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-500/10 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <p className="font-semibold text-base sm:text-lg text-white">{job.title}</p>
                    <p className="text-xs sm:text-sm text-white/90 mt-1 whitespace-pre-line">{job.description}</p>
                  </button>
                ))}
              </div>
            )}

            {selectedJob && (
              <div className="mt-5 sm:mt-6 rounded-2xl border border-white/25 bg-white/10 backdrop-blur-md p-3 sm:p-4 text-white">
                <h2 className="text-xl sm:text-2xl font-bold leading-tight text-white">{selectedJob.title}</h2>
                <p className="text-sm sm:text-base text-white/90 mt-2 whitespace-pre-line">{selectedJob.description}</p>
                <p className="text-xs sm:text-sm mt-3 whitespace-pre-line text-white/90">
                  <strong className="text-white">{t.requirements}</strong>
                  {'\n'}
                  {selectedJob.requirements}
                </p>
                <p className="text-xs sm:text-sm mt-2 whitespace-pre-line text-white/90">
                  <strong className="text-white">{t.responsibilities}</strong>
                  {'\n'}
                  {selectedJob.responsibilities}
                </p>
                {selectedJob.otherNotes ? (
                  <p className="text-xs sm:text-sm mt-2 whitespace-pre-line text-white/90">
                    <strong className="text-white">{t.otherNotes}</strong>
                    {'\n'}
                    {selectedJob.otherNotes}
                  </p>
                ) : null}

                <div className="mt-5 grid sm:grid-cols-2 gap-2">
                  <input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t.fullName}
                    className="w-full px-3 py-2.5 text-sm rounded-xl bg-white/10 border border-white/25 text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                  />
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.email}
                    type="email"
                    className="w-full px-3 py-2.5 text-sm rounded-xl bg-white/10 border border-white/25 text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={t.phone}
                    className="w-full px-3 py-2.5 text-sm rounded-xl bg-white/10 border border-white/25 text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                  />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                    className="w-full px-3 py-2.5 text-sm rounded-xl bg-white/10 border border-white/25 text-white file:mr-2 file:px-2.5 file:py-1.5 file:rounded-lg file:border file:border-white/25 file:bg-white/15 file:text-white focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                  />
                </div>

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  placeholder={t.bio}
                  className="mt-2 w-full px-3 py-2.5 text-sm rounded-xl bg-white/10 border border-white/25 text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-blue-300/50"
                />

                {error && <p className="mt-2 text-sm text-red-200">{error}</p>}
                {message && <p className="mt-2 text-sm text-emerald-200">{message}</p>}

                <button
                  onClick={submit}
                  disabled={submitting}
                  className="mt-3 w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-600 disabled:opacity-60 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-all duration-300 hover:-translate-y-1"
                >
                  {submitting ? t.submitting : t.submit}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
