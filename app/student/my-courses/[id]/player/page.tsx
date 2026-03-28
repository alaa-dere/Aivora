'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import LivePythonEditor from '@/components/live-python-editor';
import LiveJsEditor from '@/components/live-js-editor';
import LiveHtmlPreview from '@/components/live-html-preview';

type Lesson = {
  id: string;
  title: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  durationMinutes: number;
  completed: boolean;
  unlocked: boolean;
  enableLiveEditor: boolean;
  liveEditorLanguage?: 'python' | 'javascript' | 'html_css';
};

type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export default function CoursePlayerPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedLessonId = searchParams.get('lesson');
  const [modules, setModules] = useState<Module[]>([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [showCertPrompt, setShowCertPrompt] = useState(false);

  const allLessons = useMemo(
    () => modules.flatMap((m) => m.lessons),
    [modules]
  );

  useEffect(() => {
    const loadContent = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/student/my-courses/${params.id}/content`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load content');
        setModules(data.modules || []);
        setCourseTitle(data.course?.title || '');
      } catch (err: any) {
        setError(err.message || 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadContent();
  }, [params.id]);

  useEffect(() => {
    if (allLessons.length === 0) return;
    const requested = allLessons.find((l) => l.id === requestedLessonId);
    const firstUnlocked = allLessons.find((l) => l.unlocked);
    if (requested && requested.unlocked) {
      setSelectedLessonId(requested.id);
    } else {
      setSelectedLessonId(firstUnlocked?.id || null);
    }
  }, [allLessons, requestedLessonId]);

  const selectedLesson = allLessons.find((l) => l.id === selectedLessonId) || null;
  const selectedIndex = allLessons.findIndex((l) => l.id === selectedLessonId);
  const prevLesson = selectedIndex > 0 ? allLessons[selectedIndex - 1] : null;
  const nextLesson = selectedIndex >= 0 && selectedIndex < allLessons.length - 1 ? allLessons[selectedIndex + 1] : null;

  useEffect(() => {
    if (!selectedLessonId || !params.id) return;
    const startLesson = async () => {
      try {
        await fetch(`/api/student/my-courses/${params.id}/progress`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: selectedLessonId, event: 'start' }),
        });
      } catch {
        // best-effort tracking; ignore
      }
    };

    startLesson();
  }, [params.id, selectedLessonId]);

  const parseLessonContent = (content: string) => {
    const segments: { type: 'text' | 'code' | 'video' | 'starter'; value: string }[] = [];
    const regex = /```([\s\S]*?)```|\{\{\s*video\s*:\s*([^}]+)\s*\}\}|\{\{\s*starter\s*:\s*([\s\S]*?)\}\}/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        segments.push({ type: 'text', value: content.slice(lastIndex, match.index) });
      }
      if (match[1] !== undefined) {
        segments.push({ type: 'code', value: match[1].trim() });
      } else if (match[2] !== undefined) {
        segments.push({ type: 'video', value: match[2].trim() });
      } else if (match[3] !== undefined) {
        segments.push({ type: 'starter', value: match[3].trim() });
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      segments.push({ type: 'text', value: content.slice(lastIndex) });
    }
    return segments.filter((segment) => segment.value.trim() !== '');
  };

  const normalizeVideoUrl = (rawUrl: string) => {
    try {
      const url = new URL(rawUrl);
      if (url.hostname.includes('youtube.com')) {
        const vid = url.searchParams.get('v');
        if (vid) return `https://www.youtube.com/embed/${vid}`;
        if (url.pathname.startsWith('/embed/')) return rawUrl;
      }
      if (url.hostname === 'youtu.be') {
        const vid = url.pathname.replace('/', '').trim();
        if (vid) return `https://www.youtube.com/embed/${vid}`;
      }
      if (url.hostname.includes('vimeo.com')) {
        const parts = url.pathname.split('/').filter(Boolean);
        const vid = parts[parts.length - 1];
        if (vid && /^[0-9]+$/.test(vid)) {
          return `https://player.vimeo.com/video/${vid}`;
        }
      }
      return rawUrl;
    } catch {
      return rawUrl;
    }
  };

  const markLessonComplete = async () => {
    if (!selectedLesson) return;
    setMarking(true);
    try {
      const res = await fetch(`/api/student/my-courses/${params.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: selectedLesson.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update progress');
      if (data?.needsCertificateChoice) {
        setShowCertPrompt(true);
      }
      const contentRes = await fetch(`/api/student/my-courses/${params.id}/content`, { cache: 'no-store' });
      const contentData = await contentRes.json();
      if (contentRes.ok) {
        setModules(contentData.modules || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update progress');
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="mb-4">
        <Link
          href="/student/my-courses"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to My Courses
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading content...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
            <div className="flex items-center justify-between mb-3">
              <h1 className="text-xl font-bold text-gray-800 dark:text-white">
                {courseTitle || 'Course Player'}
              </h1>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                {allLessons.length > 0
                  ? `${Math.round(
                      (allLessons.filter((lesson) => lesson.completed).length / allLessons.length) * 100
                    )}% complete`
                  : '0% complete'}
              </span>
            </div>

            {selectedLesson ? (
              <div className="rounded-xl border border-blue-100 dark:border-blue-800 p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  Lesson: <span className="text-gray-700 dark:text-gray-200">{selectedLesson.title}</span>
                </p>

                <div className="space-y-4">
                  {parseLessonContent(selectedLesson.content || '').map((seg, idx) => {
                    if (seg.type === 'code') {
                      return (
                        <pre key={idx} className="rounded-lg bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm">
                          <code>{seg.value}</code>
                        </pre>
                      );
                    }
                    if (seg.type === 'starter') {
                      if (!selectedLesson.enableLiveEditor) {
                        return (
                          <div key={idx} className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-200">
                            Live editor is disabled for this lesson.
                          </div>
                        );
                      }
                      if (selectedLesson.liveEditorLanguage === 'javascript') {
                        return <LiveJsEditor key={idx} initialCode={seg.value} />;
                      }
                      if (selectedLesson.liveEditorLanguage === 'html_css') {
                        return <LiveHtmlPreview key={idx} initialCode={seg.value} />;
                      }
                      return <LivePythonEditor key={idx} initialCode={seg.value} />;
                    }
                    if (seg.type === 'video') {
                      const url = normalizeVideoUrl(seg.value);
                      return (
                        <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                          <div className="aspect-video w-full overflow-hidden rounded-lg bg-black/80">
                            <iframe
                              src={url}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              title="Lesson video"
                            />
                          </div>
                        </div>
                      );
                    }
                    return (
                      <p key={idx} className="text-sm leading-6 text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
                        {seg.value}
                      </p>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No lesson available.</p>
            )}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={markLessonComplete}
                disabled={!selectedLesson || selectedLesson.completed || marking}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {selectedLesson?.completed ? 'Completed' : marking ? 'Saving...' : 'Mark lesson as completed'}
              </button>

              <button
                onClick={() => prevLesson && setSelectedLessonId(prevLesson.id)}
                disabled={!prevLesson}
                className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50/40 dark:hover:bg-blue-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <button
                onClick={() => nextLesson && nextLesson.unlocked && setSelectedLessonId(nextLesson.id)}
                disabled={!nextLesson || !nextLesson.unlocked}
                className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50/40 dark:hover:bg-blue-900/10 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
              <h2 className="font-semibold text-gray-800 dark:text-white mb-3">Lessons</h2>
              <div className="space-y-2">
                {allLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => lesson.unlocked && setSelectedLessonId(lesson.id)}
                    disabled={!lesson.unlocked}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      lesson.unlocked
                        ? 'border-blue-100 dark:border-blue-800 hover:bg-blue-50/40 dark:hover:bg-blue-900/10'
                        : 'border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-800 dark:text-white">{lesson.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {lesson.completed ? 'Completed' : lesson.unlocked ? 'Unlocked' : 'Locked'}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
              <div className="flex items-center gap-2 mb-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-800 dark:text-white">AI Assistant</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Chatbot coming soon. This space will host the AI helper.
              </p>
              <div className="rounded-lg border border-blue-100 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/20 p-3 text-xs text-blue-700 dark:text-blue-200">
                Ask questions about the lesson, get hints, and review explanations.
              </div>
            </div>
          </div>
        </div>
      )}

      {showCertPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              You completed all lessons
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              You must complete the quiz to unlock your certificate.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setShowCertPrompt(false);
                  router.push(`/student/my-courses/${params.id}/quizzes`);
                }}
                className="px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-medium hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
              >
                Take Quiz Now
              </button>

              <button
                onClick={() => {
                  setShowCertPrompt(false);
                  router.push('/student/certificate-quizzes');
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
