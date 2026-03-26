DESCRIBE Lesson;// app/dashboard/courses/[id]/content/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function CourseContentManagement() {
  const params = useParams();
  const courseId = params.id as string;

  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId) return;

    async function loadContent() {
      try {
        setLoading(true);
        const res = await fetch(`/api/courses/${courseId}/content`);
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        setModules(data.modules || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'فشل جلب المحتوى');
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [courseId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">جاري تحميل محتوى الكورس...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        خطأ: {error}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">إدارة محتوى الكورس</h1>
        <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + إضافة وحدة جديدة
        </button>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          لا توجد وحدات (modules) بعد.<br />
          اضغط على الزر أعلاه لإضافة أول وحدة.
        </div>
      ) : (
        <div className="space-y-6">
          {modules.map((mod) => (
            <div 
              key={mod.id}
              className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm"
            >
              <div className="px-5 py-4 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg">{mod.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    الترتيب: {mod.orderNumber} • دروس: {mod.lessons?.length || 0}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button className="text-sm px-3 py-1.5 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                    تعديل
                  </button>
                  <button className="text-sm px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded hover:bg-blue-100">
                    + درس جديد
                  </button>
                </div>
              </div>

              {/* قائمة الدروس */}
              {mod.lessons?.length > 0 && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {mod.lessons.map((lesson: any) => (
                    <div 
                      key={lesson.id}
                      className="px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-900/50 flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{lesson.title}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700">
                          {lesson.type}
                        </span>
                        {lesson.enableLiveEditor && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
                            Live
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button className="text-sm text-blue-600 hover:underline">تعديل</button>
                        <button className="text-sm text-red-600 hover:underline">حذف</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}