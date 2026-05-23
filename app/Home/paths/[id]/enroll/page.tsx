'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { CreditCardIcon, CheckCircleIcon, GlobeAltIcon, LockClosedIcon, MoonIcon, SunIcon } from '@heroicons/react/24/outline';
import HomeUserMenu from '@/components/home-user-menu';

type PaymentMethod = 'card' | 'paypal';

type LearningPathItem = {
  id: string;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  price?: number;
  estimatedHours?: number;
  estimatedWeeks?: number;
  coursesCount?: number;
  enrolled?: boolean;
};

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia',
  'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia', 'Cameroon',
  'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Congo-Brazzaville)', 'Costa Rica',
  "Cote d'Ivoire", 'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica',
  'Dominican Republic', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji',
  'Finland', 'France', 'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
  'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica',
  'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
  'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
  'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
  'Mozambique', 'Myanmar (Burma)', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria',
  'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru',
  'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia',
  'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia',
  'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania',
  'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda',
  'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
  'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe',
];

export default function PathEnrollPage() {
  const params = useParams();
  const pathId = params.id as string;
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const { theme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [pathData, setPathData] = useState<LearningPathItem | null>(null);
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

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setErrorMsg('');

        const [pathsRes, studentPathsRes] = await Promise.all([
          fetch('/api/paths', { cache: 'no-store' }),
          status === 'authenticated' ? fetch('/api/student/paths', { cache: 'no-store' }) : Promise.resolve(null),
        ]);

        const pathsData = await pathsRes.json();
        if (!pathsRes.ok) throw new Error(pathsData?.message || 'Failed to load path');

        const allPaths = Array.isArray(pathsData?.paths) ? (pathsData.paths as LearningPathItem[]) : [];
        const selected = allPaths.find((p) => String(p.id) === String(pathId));
        if (!selected) throw new Error('Path not found');

        let enrolled = false;
        if (studentPathsRes) {
          const studentData = await studentPathsRes.json();
          const studentPaths = Array.isArray(studentData?.paths) ? (studentData.paths as LearningPathItem[]) : [];
          enrolled = studentPaths.some((p) => String(p.id) === String(pathId) && Boolean(p.enrolled));
        }

        setPathData({ ...selected, enrolled });
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load path');
      } finally {
        setLoading(false);
      }
    };

    if (pathId) load();
  }, [pathId, status]);

  const isArabic = language === 'ar';
  const isDark = mounted && theme === 'dark';
  const total = useMemo(() => Number(pathData?.price || 0), [pathData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (status !== 'authenticated') {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!form.fullName.trim() || !form.email.trim()) {
      setSubmitError(isArabic ? 'الرجاء إدخال الاسم والبريد الإلكتروني' : 'Please enter full name and email');
      return;
    }
    if (method === 'card' && !form.cardNumber.replace(/\D/g, '').slice(-4)) {
      setSubmitError(isArabic ? 'الرجاء إدخال رقم بطاقة صحيح' : 'Please enter a valid card number');
      return;
    }
    if (method === 'paypal' && (!form.paypalEmail.trim() || !form.paypalTxnId.trim())) {
      setSubmitError(isArabic ? 'الرجاء إدخال بيانات بايبال' : 'Please enter PayPal details');
      return;
    }

    try {
      setProcessing(true);
      const res = await fetch(`/api/student/paths/${pathId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentConfirmed: true,
          method,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          country: form.country.trim() || null,
          cardLast4: method === 'card' ? form.cardNumber.replace(/\D/g, '').slice(-4) : null,
          paypalEmail: method === 'paypal' ? form.paypalEmail.trim() : null,
          paypalTxnId: method === 'paypal' ? form.paypalTxnId.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to enroll in path');
      router.push('/Home#paths');
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to enroll in path');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">{isArabic ? 'جاري التحميل...' : 'Loading...'}</div>;
  }

  if (errorMsg || !pathData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-6 text-center">
        <p className="text-xl font-bold">{isArabic ? 'المسار غير متاح' : 'Path not available'}</p>
        <p className="mt-2 text-sm text-slate-200">{errorMsg}</p>
        <Link href="/Home" className="mt-5 rounded-xl bg-blue-700 px-5 py-2.5 font-semibold hover:bg-blue-600">
          {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
      </div>
    );
  }

  if (pathData.enrolled) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white px-6 text-center">
        <p className="text-xl font-bold">{isArabic ? 'أنت مسجل في هذا المسار' : 'You are already enrolled in this path'}</p>
        <Link href="/Home#paths" className="mt-5 rounded-xl bg-emerald-700 px-5 py-2.5 font-semibold hover:bg-emerald-600">
          {isArabic ? 'العودة للمسارات' : 'Back to Paths'}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative text-slate-900 dark:text-slate-100" dir={isArabic ? 'rtl' : 'ltr'}>
      <div
        className="fixed inset-0 -z-10 bg-cover bg-no-repeat"
        style={{
          backgroundImage: isDark ? "url('/plain2dd.png')" : "url('/plain2.png')",
          backgroundPosition: '50% 50%',
          filter: isDark ? 'brightness(0.85) saturate(1.05)' : 'brightness(1.05) saturate(1.0)',
        }}
      />
      <div className={`fixed inset-0 -z-10 ${isDark ? 'bg-black/25' : 'bg-white/20'}`} />

      <header className="sticky top-0 z-50 px-3 sm:px-4 pt-9 sm:pt-4">
        <div className="mx-auto max-w-7xl rounded-2xl border border-stone-200/80 dark:border-slate-700/80 bg-stone-50/85 dark:bg-slate-900/85 backdrop-blur-xl shadow-lg px-3 sm:px-6 py-2.5 sm:py-3">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Link href="/" className="flex items-center shrink-0">
              <Image src="/alaa.png" alt="Aivora Logo" width={100} height={35} className="h-6 sm:h-7 w-auto dark:brightness-100 brightness-25" />
            </Link>
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-1.5 sm:p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800">
                {theme === 'dark' ? <SunIcon className="w-4 h-4 sm:w-5 sm:h-5" /> : <MoonIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button onClick={() => setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'))} className="p-1.5 sm:p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800">
                <GlobeAltIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              {status === 'authenticated' ? <HomeUserMenu isArabic={isArabic} /> : <Link href="/login" className="text-sm font-medium">{isArabic ? 'تسجيل الدخول' : 'Login'}</Link>}
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-5 py-6 sm:py-8">
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="order-2 lg:order-1 lg:col-span-2 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-4 sm:p-6 shadow-xl">
            <h1 className="text-2xl font-bold text-white">{isArabic ? 'دفع وتسجيل المسار' : 'Path Payment & Enrollment'}</h1>
            <p className="mt-1 text-sm text-slate-200">{isArabic ? 'اختر طريقة الدفع وأكمل التسجيل في المسار.' : 'Choose payment method and complete your path enrollment.'}</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{isArabic ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} placeholder={isArabic ? 'أدخل اسمك الكامل' : 'Enter your full name'} className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none focus:ring-2 focus:ring-blue-300" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{isArabic ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="you@example.com" className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none focus:ring-2 focus:ring-blue-300" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{isArabic ? 'الدولة' : 'Country'}</label>
                <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-blue-300">
                  <option value="" className="text-slate-900">{isArabic ? 'اختر الدولة' : 'Select a country'}</option>
                  {countries.map((country) => (
                    <option key={country} value={country} className="text-slate-900">{country}</option>
                  ))}
                </select>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white mb-3">{isArabic ? 'طريقة الدفع' : 'Payment Method'}</h2>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setMethod('card')} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${method === 'card' ? 'border-blue-400 bg-white/10 text-white' : 'border-white/20 bg-white/5 text-slate-200'}`}>
                    <CreditCardIcon className="w-5 h-5" /> {isArabic ? 'بطاقة' : 'Card'}
                  </button>
                  <button type="button" onClick={() => setMethod('paypal')} className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${method === 'paypal' ? 'border-blue-400 bg-white/10 text-white' : 'border-white/20 bg-white/5 text-slate-200'}`}>
                    <CheckCircleIcon className="w-5 h-5" /> PayPal
                  </button>
                </div>
              </div>

              {method === 'card' ? (
                <div className="rounded-xl border border-white/20 p-4 bg-white/5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{isArabic ? 'رقم البطاقة' : 'Card Number'}</label>
                      <div className="relative">
                        <input value={form.cardNumber} onChange={(e) => setForm({ ...form, cardNumber: e.target.value })} placeholder="1234 5678 9012 3456" className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 pr-32 text-white placeholder-slate-300 outline-none focus:ring-2 focus:ring-blue-300" required />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5" aria-hidden="true">
                          <span className="px-1.5 py-0.5 rounded bg-blue-700 text-[10px] font-bold text-white tracking-wide">VISA</span>
                          <span className="px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white tracking-wide">MC</span>
                          <span className="px-1.5 py-0.5 rounded bg-white text-[10px] font-bold text-orange-600 tracking-wide">DISC</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{isArabic ? 'تاريخ الانتهاء' : 'Expiry'}</label>
                      <input value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} placeholder="MM/YY" className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{isArabic ? 'رمز الأمان' : 'CVC'}</label>
                      <input value={form.cvc} onChange={(e) => setForm({ ...form, cvc: e.target.value })} placeholder="123" className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none focus:ring-2 focus:ring-blue-300" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-200">
                    <LockClosedIcon className="w-4 h-4" />
                    {isArabic ? 'تفاصيل الدفع الخاصة بك مشفرة وآمنة.' : 'Your payment details are encrypted and secure.'}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-white/20 p-4 bg-white/5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{isArabic ? 'بريد بايبال' : 'PayPal Email'}</label>
                      <input value={form.paypalEmail} onChange={(e) => setForm({ ...form, paypalEmail: e.target.value })} type="email" placeholder="you@paypal.com" className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none focus:ring-2 focus:ring-blue-300" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{isArabic ? 'رقم عملية بايبال' : 'PayPal Transaction ID'}</label>
                      <input value={form.paypalTxnId} onChange={(e) => setForm({ ...form, paypalTxnId: e.target.value })} placeholder="Example: 9HX12345AB678901C" className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-300 outline-none focus:ring-2 focus:ring-blue-300" required />
                    </div>
                  </div>
                </div>
              )}

              {submitError && <p className="text-sm text-red-300">{submitError}</p>}

              <button type="submit" disabled={processing} className="inline-flex items-center justify-center px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-60">
                {processing ? (isArabic ? 'جاري المعالجة...' : 'Processing...') : (isArabic ? `ادفع $${total.toFixed(2)} وسجّل` : `Pay $${total.toFixed(2)} & Enroll`)}
              </button>
            </form>
          </div>

          <aside className="order-1 lg:order-2 space-y-4">
            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-4 shadow-xl">
              <div className="w-full aspect-[16/10] rounded-xl overflow-hidden bg-gray-100/20">
                <img src={pathData.imageUrl || '/default-course.jpg'} alt={pathData.title} className="w-full h-full object-cover" />
              </div>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg p-4 sm:p-6 shadow-xl">
              <p className="text-sm font-semibold text-slate-200">{isArabic ? 'ملخص الطلب' : 'Order Summary'}</p>
              <p className="mt-3 text-white font-semibold">{pathData.title}</p>
              <div className="mt-4 space-y-2 text-sm text-slate-200">
                <div className="flex items-center justify-between">
                  <span>{isArabic ? 'عدد الدورات' : 'Courses count'}</span>
                  <span>{Number(pathData.coursesCount || 0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{isArabic ? 'الأسابيع التقديرية' : 'Estimated weeks'}</span>
                  <span>{Number((pathData.estimatedWeeks ?? pathData.estimatedHours) || 0)}</span>
                </div>
                <div className="flex items-center justify-between font-semibold text-white">
                  <span>{isArabic ? 'الإجمالي' : 'Total'}</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

