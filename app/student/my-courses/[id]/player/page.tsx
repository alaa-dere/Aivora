'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import LivePythonEditor from '@/components/live-python-editor';
import LiveJsEditor from '@/components/live-js-editor';
import LiveHtmlPreview from '@/components/live-html-preview';
import LessonContentView from '@/components/lesson-content-view';

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

type LiveEditorSubmission = {
  code: string;
  output: string;
  hasRun: boolean;
  error?: string | null;
};

const inlineMarkdownToNodes = (text: string): ReactNode[] => {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={`code-${idx}`}
          className="rounded bg-gray-200 dark:bg-gray-700 px-1 py-0.5 text-[0.92em]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={`strong-${idx}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={`em-${idx}`}>{part.slice(1, -1)}</em>;
    }
    return <span key={`text-${idx}`}>{part}</span>;
  });
};

const renderMarkdownText = (text: string) => {
  const lines = text.split(/\r?\n/);
  const nodes: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (trimmed.startsWith('#### ')) {
      nodes.push(
        <h4 key={`h4-${i}`} className="text-base font-semibold text-gray-800 dark:text-gray-100 mt-3">
          {inlineMarkdownToNodes(trimmed.slice(5))}
        </h4>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      nodes.push(
        <h3 key={`h3-${i}`} className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-3">
          {inlineMarkdownToNodes(trimmed.slice(4))}
        </h3>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      nodes.push(
        <h2 key={`h2-${i}`} className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4">
          {inlineMarkdownToNodes(trimmed.slice(3))}
        </h2>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      nodes.push(
        <h1 key={`h1-${i}`} className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
          {inlineMarkdownToNodes(trimmed.slice(2))}
        </h1>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('> ')) {
      nodes.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-blue-300 dark:border-blue-700 pl-3 italic text-gray-700 dark:text-gray-200"
        >
          {inlineMarkdownToNodes(trimmed.slice(2))}
        </blockquote>
      );
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^[-*]\s+/, '');
        items.push(<li key={`ul-${i}`}>{inlineMarkdownToNodes(itemText)}</li>);
        i += 1;
      }
      nodes.push(
        <ul key={`ul-wrap-${i}`} className="list-disc pl-5 space-y-1 text-gray-700 dark:text-gray-200">
          {items}
        </ul>
      );
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, '');
        items.push(<li key={`ol-${i}`}>{inlineMarkdownToNodes(itemText)}</li>);
        i += 1;
      }
      nodes.push(
        <ol key={`ol-wrap-${i}`} className="list-decimal pl-5 space-y-1 text-gray-700 dark:text-gray-200">
          {items}
        </ol>
      );
      continue;
    }

    nodes.push(
      <p key={`p-${i}`} className="text-sm leading-6 text-gray-700 dark:text-gray-200 whitespace-pre-wrap">
        {inlineMarkdownToNodes(line)}
      </p>
    );
    i += 1;
  }

  return <div className="space-y-2">{nodes}</div>;
};

export default function CoursePlayerPage() {
  const params = useParams<{ id: string }>();
  const lessonStorageKey = `aivora:last-lesson:${params.id}`;
  const searchParams = useSearchParams();
  const router = useRouter();
  const requestedLessonId = searchParams.get('lesson');
  const [modules, setModules] = useState<Module[]>([]);
  const [lastActiveLessonId, setLastActiveLessonId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lessonInlineError, setLessonInlineError] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [showCertPrompt, setShowCertPrompt] = useState(false);
  const [liveSubmissionByLesson, setLiveSubmissionByLesson] = useState<
    Record<string, LiveEditorSubmission>
  >({});

  const handleLiveSubmissionChange = useCallback(
    (submission: LiveEditorSubmission) => {
      if (!selectedLessonId) return;
      setLiveSubmissionByLesson((prev) => {
        const existing = prev[selectedLessonId];
        if (
          existing &&
          existing.code === submission.code &&
          existing.output === submission.output &&
          existing.hasRun === submission.hasRun &&
          (existing.error || null) === (submission.error || null)
        ) {
          return prev;
        }
        return {
          ...prev,
          [selectedLessonId]: submission,
        };
      });
    },
    [selectedLessonId]
  );

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
        setLastActiveLessonId(String(data.course?.lastActiveLessonId || ''));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) loadContent();
  }, [params.id]);

  useEffect(() => {
    if (allLessons.length === 0) return;
    const requested = allLessons.find((l) => l.id === requestedLessonId);
    const nextRequired = allLessons.find((l) => l.unlocked && !l.completed);
    const firstUnlocked = allLessons.find((l) => l.unlocked);
    if (requested && requested.unlocked) {
      setSelectedLessonId(requested.id);
    } else if (nextRequired) {
      setSelectedLessonId(nextRequired.id);
    } else {
      const remembered = allLessons.find((l) => l.id === lastActiveLessonId && l.unlocked);
      setSelectedLessonId(remembered?.id || firstUnlocked?.id || null);
    }
  }, [allLessons, requestedLessonId, lastActiveLessonId]);

  useEffect(() => {
    if (!selectedLessonId) return;
    setLessonInlineError(null);
    try {
      localStorage.setItem(lessonStorageKey, selectedLessonId);
    } catch {
      // ignore storage errors
    }
  }, [selectedLessonId, lessonStorageKey]);

  const selectedLesson = allLessons.find((l) => l.id === selectedLessonId) || null;
  const selectedModule = useMemo(
    () => modules.find((m) => m.lessons.some((l) => l.id === selectedLessonId)) || null,
    [modules, selectedLessonId]
  );
  const selectedModuleId = selectedModule?.id || '';
  const lessonsInSelectedModule = selectedModule?.lessons || [];
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
    const segments: { type: 'text' | 'code' | 'video' | 'starter' | 'answer'; value: string }[] = [];
    const tokenRegex = /```|\{\{\s*video\s*:|\{\{\s*starter\s*:|\{\{\s*(?:answer|expected)\s*:/gi;
    let cursor = 0;

    while (cursor < content.length) {
      tokenRegex.lastIndex = cursor;
      const match = tokenRegex.exec(content);
      if (!match) {
        segments.push({ type: 'text', value: content.slice(cursor) });
        break;
      }

      const tokenStart = match.index;
      const token = match[0];
      if (tokenStart > cursor) {
        segments.push({ type: 'text', value: content.slice(cursor, tokenStart) });
      }

      if (token === '```') {
        const codeStart = tokenRegex.lastIndex;
        const codeEnd = content.indexOf('```', codeStart);
        if (codeEnd === -1) {
          segments.push({ type: 'text', value: content.slice(tokenStart) });
          break;
        }

        let codeValue = content.slice(codeStart, codeEnd);
        const newLineMatch = codeValue.match(/\r?\n/);
        if (newLineMatch && newLineMatch.index !== undefined) {
          const firstLine = codeValue.slice(0, newLineMatch.index).trim();
          if (/^[a-zA-Z0-9_+-]+$/.test(firstLine)) {
            codeValue = codeValue.slice(newLineMatch.index + newLineMatch[0].length);
          }
        }

        segments.push({ type: 'code', value: codeValue.trim() });
        cursor = codeEnd + 3;
        continue;
      }

      const valueStart = tokenRegex.lastIndex;
      const valueEnd = content.indexOf('}}', valueStart);
      if (valueEnd === -1) {
        segments.push({ type: 'text', value: content.slice(tokenStart) });
        break;
      }

      const value = content.slice(valueStart, valueEnd).trim();
      const normalizedToken = token.toLowerCase();
      if (normalizedToken.includes('video')) {
        segments.push({ type: 'video', value });
      } else if (normalizedToken.includes('starter')) {
        segments.push({ type: 'starter', value });
      } else {
        segments.push({ type: 'answer', value });
      }
      cursor = valueEnd + 2;
    }

    return segments.filter((segment) => segment.value.trim() !== '' && segment.type !== 'answer');
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
    setLessonInlineError(null);
    try {
      const liveSubmission = selectedLesson.enableLiveEditor
        ? liveSubmissionByLesson[selectedLesson.id] || null
        : null;
      const res = await fetch(`/api/student/my-courses/${params.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: selectedLesson.id,
          liveEditorSubmission: liveSubmission,
        }),
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update progress';
      if (
        message.includes('This live-compiler lesson does not have an expected answer yet') ||
        message.includes('Ask your teacher to add {{answer:')
      ) {
        setLessonInlineError(
          'This live-compiler lesson is not fully configured yet. Your teacher needs to add an expected answer first.'
        );
      } else {
        setLessonInlineError(message);
      }
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      {loading ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading content...</p>
      ) : error ? (
        <p className="text-sm text-red-500">{error}</p>
      ) : (
        <>
          <div className="mb-4">
            <div className="mx-auto max-w-7xl rounded-2xl border border-stone-200/80 dark:border-slate-700/80 bg-stone-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg px-3 sm:px-4 py-2 overflow-visible">
            <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 lg:gap-4 min-h-[58px]">
              <div>
                <Link
                  href="/student/my-courses"
                  className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ArrowLeftIcon className="w-4 h-4" /> Back to My Courses
                </Link>
              </div>

              <div className="min-w-0 flex items-center justify-center overflow-x-auto overflow-y-visible py-2 lg:py-1">
              <div className="relative flex items-center gap-2 md:gap-2.5 px-2">
              {allLessons.slice(0, 14).map((lesson, idx) => {
                const done = lesson.completed;
                const active = lesson.id === selectedLessonId;
                return (
                  <button
                    key={`nav-dot-${lesson.id}`}
                    type="button"
                    onClick={() => lesson.unlocked && setSelectedLessonId(lesson.id)}
                    disabled={!lesson.unlocked}
                    className={`relative z-10 h-3 w-3 rounded-full shrink-0 transition-all duration-300 ${
                      active
                        ? 'scale-110 shadow-[0_0_14px_rgba(96,165,250,0.85)]'
                        : done
                        ? 'shadow-[0_0_8px_rgba(96,165,250,0.3)]'
                        : ''
                    } ${lesson.unlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                    title={`Lesson ${idx + 1}: ${lesson.title}`}
                  >
                    <span
                      className={`absolute inset-0 rounded-full ring-1 ${
                        active
                          ? 'ring-blue-300 bg-blue-100/90 dark:bg-blue-900/90'
                          : done
                          ? 'ring-blue-300/80 bg-blue-50/90 dark:bg-blue-900/70'
                          : 'ring-blue-300/60 bg-white/90 dark:bg-blue-950/60'
                      }`}
                    />
                    <span
                      className={`absolute inset-[1px] rounded-full ${
                        active
                          ? 'bg-blue-500'
                          : done
                          ? 'bg-blue-400/90'
                          : 'bg-blue-200/80 dark:bg-blue-800/80'
                      }`}
                    />
                    <span
                      className={`absolute inset-[3px] rounded-full ${
                        active ? 'bg-white/90' : 'bg-white/70 dark:bg-blue-100/60'
                      }`}
                    />
                  </button>
                );
              })}
              </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 justify-start lg:justify-end">
                <select
                  value={selectedModuleId}
                  onChange={(e) => {
                    const nextModule = modules.find((m) => m.id === e.target.value);
                    if (!nextModule) return;
                    const firstUnlockedLesson = nextModule.lessons.find((l) => l.unlocked);
                    const firstLesson = nextModule.lessons[0];
                    const target = firstUnlockedLesson || firstLesson;
                    if (target) setSelectedLessonId(target.id);
                  }}
                  className="portal-surface w-56 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {modules.map((m, idx) => (
                    <option key={m.id} value={m.id}>
                      {`CH${idx + 1}: ${m.title}`}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedLessonId || ''}
                  onChange={(e) => setSelectedLessonId(e.target.value)}
                  className="portal-surface w-56 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {lessonsInSelectedModule.map((lesson, idx) => (
                    <option key={lesson.id} value={lesson.id} disabled={!lesson.unlocked}>
                      {`L${idx + 1}: ${lesson.title}${lesson.unlocked ? '' : ' (Locked)'}`}
                    </option>
                  ))}
                </select>

              </div>
            </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Follow the lesson content, mark progress, and move to the next step.
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
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

            <div className="portal-surface bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
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

          <div className="portal-surface lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-800 p-5">
            <div className="flex items-center justify-end mb-3">
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
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lesson</p>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                  {selectedLesson.title}
                </h2>

                <LessonContentView
                  content={selectedLesson.content || ''}
                  enableLiveEditor={selectedLesson.enableLiveEditor}
                  liveEditorLanguage={selectedLesson.liveEditorLanguage || 'python'}
                  onSubmissionChange={handleLiveSubmissionChange}
                  starterDisabledMessage="Live editor is disabled for this lesson."
                />
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
            {lessonInlineError && (
              <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-sm text-amber-700 dark:text-amber-200">
                {lessonInlineError}
              </div>
            )}
          </div>

          </div>
        </>
      )}

      {showCertPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="portal-surface w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
              You completed all lessons
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              You must pass the quiz with at least 60% to unlock your certificate.
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



