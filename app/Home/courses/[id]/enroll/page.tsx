'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  CheckCircleIcon,
  CreditCardIcon,
  LockClosedIcon,
  MoonIcon,
  SunIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import HomeUserMenu from '@/components/home-user-menu';

type Course = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  durationWeeks: number;
  teacherName: string;
  price: number;
  students: number;
  enrolled?: boolean;
};

type PaymentMethod = 'card' | 'paypal';

export default function CourseEnrollPage() {
  const params = useParams();
  const courseId = params.id as string;
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { status } = useSession();

  const [mounted, setMounted] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [processing, setProcessing] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    country: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    paypalEmail: '',
    paypalTxnId: '',
  });

  const countries = [
    'Afghanistan',
    'Albania',
    'Algeria',
    'Andorra',
    'Angola',
    'Antigua and Barbuda',
    'Argentina',
    'Armenia',
    'Australia',
    'Austria',
    'Azerbaijan',
    'Bahamas',
    'Bahrain',
    'Bangladesh',
    'Barbados',
    'Belarus',
    'Belgium',
    'Belize',
    'Benin',
    'Bhutan',
    'Bolivia',
    'Bosnia and Herzegovina',
    'Botswana',
    'Brazil',
    'Brunei',
    'Bulgaria',
    'Burkina Faso',
    'Burundi',
    'Cabo Verde',
    'Cambodia',
    'Cameroon',
    'Canada',
    'Central African Republic',
    'Chad',
    'Chile',
    'China',
    'Colombia',
    'Comoros',
    'Congo (Congo-Brazzaville)',
    'Costa Rica',
    "Cote d'Ivoire",
    'Croatia',
    'Cuba',
    'Cyprus',
    'Czechia',
    'Democratic Republic of the Congo',
    'Denmark',
    'Djibouti',
    'Dominica',
    'Dominican Republic',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Equatorial Guinea',
    'Eritrea',
    'Estonia',
    'Eswatini',
    'Ethiopia',
    'Fiji',
    'Finland',
    'France',
    'Gabon',
    'Gambia',
    'Georgia',
    'Germany',
    'Ghana',
    'Greece',
    'Grenada',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Honduras',
    'Hungary',
    'Iceland',
    'India',
    'Indonesia',
    'Iran',
    'Iraq',
    'Ireland',
    'Israel',
    'Italy',
    'Jamaica',
    'Japan',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kiribati',
    'Kuwait',
    'Kyrgyzstan',
    'Laos',
    'Latvia',
    'Lebanon',
    'Lesotho',
    'Liberia',
    'Libya',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Maldives',
    'Mali',
    'Malta',
    'Marshall Islands',
    'Mauritania',
    'Mauritius',
    'Mexico',
    'Micronesia',
    'Moldova',
    'Monaco',
    'Mongolia',
    'Montenegro',
    'Morocco',
    'Mozambique',
    'Myanmar (Burma)',
    'Namibia',
    'Nauru',
    'Nepal',
    'Netherlands',
    'New Zealand',
    'Nicaragua',
    'Niger',
    'Nigeria',
    'North Korea',
    'North Macedonia',
    'Norway',
    'Oman',
    'Pakistan',
    'Palau',
    'Panama',
    'Papua New Guinea',
    'Paraguay',
    'Peru',
    'Philippines',
    'Poland',
    'Portugal',
    'Qatar',
    'Romania',
    'Russia',
    'Rwanda',
    'Saint Kitts and Nevis',
    'Saint Lucia',
    'Saint Vincent and the Grenadines',
    'Samoa',
    'San Marino',
    'Sao Tome and Principe',
    'Saudi Arabia',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Sierra Leone',
    'Singapore',
    'Slovakia',
    'Slovenia',
    'Solomon Islands',
    'Somalia',
    'South Africa',
    'South Korea',
    'South Sudan',
    'Spain',
    'Sri Lanka',
    'Sudan',
    'Suriname',
    'Sweden',
    'Switzerland',
    'Syria',
    'Taiwan',
    'Tajikistan',
    'Tanzania',
    'Thailand',
    'Timor-Leste',
    'Togo',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Turkey',
    'Turkmenistan',
    'Tuvalu',
    'Uganda',
    'Ukraine',
    'United Arab Emirates',
    'United Kingdom',
    'United States',
    'Uruguay',
    'Uzbekistan',
    'Vanuatu',
    'Vatican City',
    'Venezuela',
    'Vietnam',
    'Yemen',
    'Zambia',
    'Zimbabwe',
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${courseId}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to load course');
        }
        setCourse(data.course || null);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    if (courseId) loadCourse();
  }, [courseId]);

  useEffect(() => {
    if (status === 'authenticated' && course?.enrolled) {
      router.replace(`/student/my-courses/${courseId}`);
    }
  }, [status, course?.enrolled, courseId, router]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));
  };

  const isArabic = language === 'ar';
  const isDark = mounted && theme === 'dark';

  const summary = useMemo(() => {
    const price = Number(course?.price || 0);
    return {
      price,
      total: price,
    };
  }, [course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (status !== 'authenticated') {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (method === 'paypal') {
      if (!form.paypalEmail.trim() || !form.paypalTxnId.trim()) {
        setSubmitError(isArabic ? 'يرجى إدخال بيانات بايبال' : 'Please enter PayPal details');
        return;
      }
    }

    try {
      setProcessing(true);
      const last4 = form.cardNumber.replace(/\D/g, '').slice(-4) || null;
      const res = await fetch(`/api/student/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentConfirmed: true,
          method,
          fullName: form.fullName,
          email: form.email,
          country: form.country || null,
          cardLast4: method === 'card' ? last4 : null,
          paypalEmail: method === 'paypal' ? form.paypalEmail.trim() : null,
          paypalTxnId: method === 'paypal' ? form.paypalTxnId.trim() : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to enroll');
      }

      router.push(`/student/my-courses/${courseId}`);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to enroll');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        {isArabic ? 'جاري تحميل صفحة التسجيل...' : 'Loading enrollment...'}
      </div>
    );
  }

  if (errorMsg || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 text-slate-900 dark:bg-slate-950 dark:text-white text-center px-6">
        <p className="text-lg font-semibold mb-2">
          {isArabic ? 'الدورة غير موجودة' : 'Course not found'}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">{errorMsg}</p>
        <Link
          href="/Home/courses"
          className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
        >
          {isArabic ? 'العودة إلى الدورات' : 'Back to Courses'}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-slate-900 dark:text-slate-100" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-no-repeat transition-[filter] duration-500"
        style={{
          backgroundImage: isDark ? "url('/plain2dd.png')" : "url('/plain2.png')",
          backgroundPosition: '50% 50%',
          filter: isDark ? 'brightness(0.85) saturate(1.05)' : 'brightness(1.05) saturate(1.0)',
        }}
      />

      <div
        className={`fixed inset-0 -z-10 transition-opacity duration-500 ${
          isDark ? 'bg-black/25' : 'bg-white/20'
        }`}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <div className="mx-auto max-w-7xl rounded-2xl border border-stone-200/80 dark:border-slate-700/80 bg-stone-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center shrink-0">
              <Image
                src="/alaa.png"
                alt="Aivora Logo"
                width={100}
                height={35}
                className="h-7 w-auto dark:brightness-100 brightness-25"
              />
            </Link>

            <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <SunIcon className="w-5 h-5 text-slate-900 dark:text-white" />
              ) : (
                <MoonIcon className="w-5 h-5 text-slate-900 dark:text-white" />
              )}
            </button>

            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle language"
              title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
            >
              <GlobeAltIcon className="w-5 h-5 text-slate-900 dark:text-white" />
            </button>

            {status === 'authenticated' ? (
              <HomeUserMenu isArabic={isArabic} />
            ) : (
              <Link href="/login">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white">
                  <span className="hidden sm:inline">
                    {isArabic ? 'تسجيل الدخول' : 'Login'}
                  </span>
                </button>
              </Link>
            )}
          </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {isArabic ? 'أكمل عملية التسجيل' : 'Complete Your Enrollment'}
              </h1>
              <p className="text-sm text-slate-200 mt-1">
                {isArabic
                  ? 'يرجى إدخال تفاصيل الفوترة واختيار طريقة الدفع.'
                  : 'Provide billing details and choose your payment method.'}
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isArabic ? 'الاسم الكامل' : 'Full Name'}
                    </label>
                    <input
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      type="text"
                      placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none transition-all focus:ring-2 focus:ring-blue-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {isArabic ? 'البريد الإلكتروني' : 'Email'}
                    </label>
                    <input
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      type="email"
                      placeholder={isArabic ? 'you@example.com' : 'you@example.com'}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none transition-all focus:ring-2 focus:ring-blue-300"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {isArabic ? 'الدولة' : 'Country'}
                  </label>
                    <select
                      value={form.country}
                      onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none transition-all focus:ring-2 focus:ring-blue-300"
                    >
                      <option value="" className="text-slate-900">
                        {isArabic ? 'اختر الدولة' : 'Select a country'}
                      </option>
                      {countries.map((country) => (
                        <option key={country} value={country} className="text-slate-900">
                          {country}
                        </option>
                      ))}
                    </select>
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-white mb-3">
                    {isArabic ? 'طريقة الدفع' : 'Payment Method'}
                  </h2>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {[
                      {
                        value: 'card',
                        label: isArabic ? 'بطاقة' : 'Card',
                        icon: CreditCardIcon,
                      },
                      {
                        value: 'paypal',
                        label: isArabic ? 'بايبال' : 'PayPal',
                        icon: CheckCircleIcon,
                      },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setMethod(opt.value as PaymentMethod)}
                          className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${
                            method === opt.value
                              ? 'border-blue-400 bg-white/10 text-white'
                              : 'border-white/20 bg-white/5 text-slate-200'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {method === 'card' && (
                  <div className="rounded-xl border border-white/20 p-4 bg-white/5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isArabic ? 'رقم البطاقة' : 'Card Number'}
                        </label>
                        <div className="relative">
                        <input
                          value={form.cardNumber}
                          onChange={(e) => setForm({ ...form, cardNumber: e.target.value })}
                          type="text"
                          placeholder={isArabic ? '1234 5678 9012 3456' : '1234 5678 9012 3456'}
                          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 pr-32 text-white placeholder-slate-300 outline-none transition-all focus:ring-2 focus:ring-blue-300"
                          required={method === 'card'}
                        />
                          <div
                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5"
                            aria-hidden="true"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-blue-700 text-[10px] font-bold text-white tracking-wide">
                              VISA
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white tracking-wide">
                              MC
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold text-orange-600 tracking-wide">
                              DISC
                            </span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isArabic ? 'تاريخ الانتهاء' : 'Expiry'}
                        </label>
                        <input
                          value={form.expiry}
                          onChange={(e) => setForm({ ...form, expiry: e.target.value })}
                          type="text"
                          placeholder={isArabic ? 'MM/YY' : 'MM/YY'}
                          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none transition-all focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isArabic ? 'رمز الأمان' : 'CVC'}
                        </label>
                        <input
                          value={form.cvc}
                          onChange={(e) => setForm({ ...form, cvc: e.target.value })}
                          type="text"
                          placeholder={isArabic ? '123' : '123'}
                          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none transition-all focus:ring-2 focus:ring-blue-300"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs text-slate-200">
                      <LockClosedIcon className="w-4 h-4" />
                      {isArabic
                        ? 'تفاصيل الدفع الخاصة بك مشفرة وآمنة.'
                        : 'Your payment details are encrypted and secure.'}
                    </div>
                  </div>
                )}

                {method === 'paypal' && (
                  <div className="rounded-xl border border-white/20 p-4 bg-white/5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isArabic ? 'بريد بايبال' : 'PayPal Email'}
                        </label>
                        <input
                          value={form.paypalEmail}
                          onChange={(e) => setForm({ ...form, paypalEmail: e.target.value })}
                          type="email"
                          placeholder={isArabic ? 'you@paypal.com' : 'you@paypal.com'}
                          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none transition-all focus:ring-2 focus:ring-blue-300"
                          required={method === 'paypal'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {isArabic ? 'رقم عملية بايبال' : 'PayPal Transaction ID'}
                        </label>
                        <input
                          value={form.paypalTxnId}
                          onChange={(e) => setForm({ ...form, paypalTxnId: e.target.value })}
                          type="text"
                          placeholder={isArabic ? 'مثال: 9HX12345AB678901C' : 'Example: 9HX12345AB678901C'}
                          className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none transition-all focus:ring-2 focus:ring-blue-300"
                          required={method === 'paypal'}
                        />
                      </div>
                    </div>
                  </div>
                )}

                  {submitError && (
                    <p className="text-sm text-red-300">{submitError}</p>
                  )}

                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {processing
                    ? (isArabic ? 'جاري المعالجة...' : 'Processing...')
                    : (isArabic
                        ? `ادفع $${summary.total.toFixed(2)} وسجّل`
                        : `Pay $${summary.total.toFixed(2)} & Enroll`)}
                </button>
              </form>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-4 shadow-xl overflow-hidden">
              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden bg-gray-100/20">
                <img
                  src={course.imageUrl || '/default-course.jpg'}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-6 shadow-xl">
              <p className="text-sm font-semibold text-slate-200">
                {isArabic ? 'ملخص الطلب' : 'Order Summary'}
              </p>
              <div className="mt-4">
                <p className="text-sm font-semibold text-white">{course.title}</p>
                <p className="text-xs text-slate-300">
                  {isArabic ? '\u0628\u0648\u0627\u0633\u0637\u0629 ' : 'By '}
                  {course.teacherName}
                </p>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>{isArabic ? 'سعر الدورة' : 'Course price'}</span>
                  <span>${summary.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                  <span>${summary.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-white/15 bg-white/10 p-3 text-xs text-slate-200">
                {isArabic
                  ? 'يمنحك التسجيل وصولًا فوريًا إلى جميع مواد الدورة.'
                  : 'Enrollment gives you instant access to all course materials.'}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
