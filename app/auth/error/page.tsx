'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-red-600 mb-4">خطأ في المصادقة</h1>
        <p className="text-gray-700 mb-4">
          {error === 'OAuthSignin' && 'حدث خطأ في بدء عملية تسجيل الدخول'}
          {error === 'OAuthCallback' && 'حدث خطأ في معالجة رد OAuth'}
          {error === 'OAuthCreateAccount' && 'تعذر إنشاء حساب جديد'}
          {error === 'EmailCreateAccount' && 'تعذر إنشاء حساب بالبريد الإلكتروني'}
          {error === 'Callback' && 'خطأ في التوجيه بعد تسجيل الدخول'}
          {error === 'AccessDenied' && 'تم رفض الوصول'}
          {!error && 'حدث خطأ غير معروف'}
        </p>
        <Link 
          href="/login"
          className="block text-center bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          العودة لتسجيل الدخول
        </Link>
      </div>
    </div>
  );
}
