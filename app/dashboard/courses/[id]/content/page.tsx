// app/dashboard/courses/[id]/content/page.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, FileText, Code, Play, Video, HelpCircle, MoreVertical, X } from 'lucide-react';
import LivePythonEditor from '@/components/live-python-editor';
import LiveJsEditor from '@/components/live-js-editor';
import LiveHtmlPreview from '@/components/live-html-preview';
import LessonContentView from '@/components/lesson-content-view';

type Lesson = {
  id: string;
  title: string;
  type: 'text' | 'code_example' | 'live_python' | 'video_embed' | 'quiz' | 'mixed';
  enableLiveEditor: boolean;
  liveEditorLanguage?: 'python' | 'javascript' | 'html_css' | 'sql' | 'c';
  durationMinutes: number;
  isPublished: boolean;
  content?: string;
  codeContent?: string;
  description?: string;
  videoUrl?: string;
  quizQuestions?: Array<{
    id?: string;
    questionType: 'multiple_choice' | 'written' | 'true_false';
    questionText: string;
    options?: string[];
    correctOptionIndex?: number;
    writtenAnswer?: string;
  }>;
};

type Module = {
  id: string;
  title: string;
  description?: string;
  orderNumber: number;
  lessons: Lesson[];
};

const fixContent = (raw: string) =>
  raw
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ')
    .replace(/(#[^\n]+)\n([^\n])/g, '$1\n\n$2')
    .replace(/(\/\/[^\n]+)\n([^\n])/g, '$1\n\n$2')
    .replace(/(\/\*[^*]*\*\/)\n([^\n])/g, '$1\n\n$2')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(.)(\n?)(#{1,4} )/g, '$1\n\n$3')
    .replace(/(#{1,4} [^\n]+)\n([^\n])/g, '$1\n\n$2')

    .trim();

export default function CourseContentPage() {
  const params = useParams();
  const courseId = params.id as string;

  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [lessonForm, setLessonForm] = useState({
    moduleId: '',
    title: '',
    description: '',
    content: '',
    durationMinutes: '0',
    isPublished: false,
    type: 'text' as Lesson['type'],
    enableLiveEditor: false,
    liveEditorLanguage: 'python' as NonNullable<Lesson['liveEditorLanguage']>,
  });
  const [openModuleMenuId, setOpenModuleMenuId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [aiOutlinePrompt, setAiOutlinePrompt] = useState('');
  const [aiGeneratingOutline, setAiGeneratingOutline] = useState(false);
  const [aiGeneratingDetails, setAiGeneratingDetails] = useState(false);
  const [aiRegeneratingLessons, setAiRegeneratingLessons] = useState(false);
  const [aiOutlineDraft, setAiOutlineDraft] = useState<any[] | null>(null);
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([]);
  const [regenLessonStatus, setRegenLessonStatus] = useState<Record<string, 'idle' | 'generating' | 'done' | 'error'>>({});

  const fetchContent = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/courses/${courseId}/content`, {
        cache: 'no-store',
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to load course content');
      }

      setModules(data.modules || []);
      setCourseTitle(data.course?.title || '');

      if (Array.isArray(data.modules) && data.modules.length > 0) {
        setExpandedModules((prev) => {
          const next: Record<string, boolean> = {};
          data.modules.forEach((m: Module) => {
            next[m.id] = Boolean(prev[m.id]);
          });
          return next;
        });
        const allLessons = data.modules.flatMap((m: Module) => m.lessons || []);
        const stillExists =
          selectedLessonId && allLessons.some((lesson: Lesson) => lesson.id === selectedLessonId);
        const fallbackLesson = allLessons[0];
        setSelectedLessonId(stillExists ? selectedLessonId : fallbackLesson?.id || null);
      } else {
        setExpandedModules({});
        setSelectedLessonId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchContent();
    }
  }, [courseId]);

  useEffect(() => {
    if (!courseId || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(`course-content-expanded:${courseId}`);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      if (parsed && typeof parsed === 'object') {
        setExpandedModules(parsed);
      }
    } catch {
      // ignore invalid saved state
    }
  }, [courseId]);

  useEffect(() => {
    if (!courseId || typeof window === 'undefined') return;
    window.localStorage.setItem(
      `course-content-expanded:${courseId}`,
      JSON.stringify(expandedModules)
    );
  }, [courseId, expandedModules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const getLessonIcon = (type: string, enableLiveEditor: boolean) => {
    if (enableLiveEditor) return <Play className="w-4 h-4 text-green-500" />;
    
    switch(type) {
      case 'text':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'code_example':
        return <Code className="w-4 h-4 text-purple-500" />;
      case 'video_embed':
        return <Video className="w-4 h-4 text-red-500" />;
      case 'quiz':
        return <HelpCircle className="w-4 h-4 text-orange-500" />;
      case 'mixed':
        return <FileText className="w-4 h-4 text-slate-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'text': return 'Text Content';
      case 'code_example': return 'Code Example';
      case 'live_python': return 'Live Python';
      case 'video_embed': return 'Video';
      case 'quiz': return 'Quiz';
      case 'mixed': return 'Mixed Content';
      default: return type;
    }
  };

  const resetModuleForm = () => {
    setModuleForm({ title: '', description: '' });
    setEditingModuleId(null);
  };

  const resetLessonForm = () => {
    setLessonForm({
      moduleId: '',
      title: '',
      description: '',
      content: '',
      durationMinutes: '0',
      isPublished: false,
      type: 'text',
      enableLiveEditor: false,
      liveEditorLanguage: 'python',
    });
    setEditingLessonId(null);
  };

  const openCreateModule = () => {
    resetModuleForm();
    setShowModuleModal(true);
  };

  const openEditModule = (module: Module) => {
    setEditingModuleId(module.id);
    setModuleForm({
      title: module.title,
      description: module.description || '',
    });
    setShowModuleModal(true);
  };

  const openCreateLesson = (moduleId?: string, type?: Lesson['type']) => {
    resetLessonForm();
    setLessonForm((prev) => ({
      ...prev,
      moduleId: moduleId || modules[0]?.id || prev.moduleId,
      type: type || prev.type,
    }));
    if (type === 'code_example') {
      appendToLessonContent('```code\n\n```');
    }
    if (type === 'video_embed') {
      appendToLessonContent('{{video:URL}}');
    }
    setShowLessonModal(true);
  };

  const openEditLesson = (lesson: Lesson, moduleId: string) => {
    const contentFallbackParts: string[] = [];
    if (!lesson.content && lesson.codeContent) {
      contentFallbackParts.push(`\`\`\`code\n${lesson.codeContent}\n\`\`\``);
    }
    if (!lesson.content && lesson.videoUrl) {
      contentFallbackParts.push(`{{video:${lesson.videoUrl}}}`);
    }

    setEditingLessonId(lesson.id);
    setLessonForm({
      moduleId,
      title: lesson.title,
      description: lesson.description || '',
      content: lesson.content || contentFallbackParts.join('\n\n'),
      durationMinutes: String(lesson.durationMinutes || 0),
      isPublished: Boolean(lesson.isPublished),
      type: lesson.type,
      enableLiveEditor: Boolean(lesson.enableLiveEditor),
      liveEditorLanguage: lesson.liveEditorLanguage || 'python',
    });
    setShowLessonModal(true);
  };

  const handleSaveModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const title = moduleForm.title.trim();
    if (!title) {
      setError('Module title is required');
      return;
    }

    try {
      if (editingModuleId) {
        const res = await fetch(`/api/modules/${editingModuleId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: moduleForm.description.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update module');
      } else {
        const res = await fetch(`/api/courses/${courseId}/modules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: moduleForm.description.trim() || null,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create module');
      }

      setShowModuleModal(false);
      resetModuleForm();
      await fetchContent();
    } catch (err: any) {
      setError(err.message || 'Failed to save module');
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm('Delete this module and all its lessons?')) return;
    setError(null);

    try {
      const res = await fetch(`/api/modules/${moduleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete module');
      await fetchContent();
    } catch (err: any) {
      setError(err.message || 'Failed to delete module');
    }
  };

  const inferLessonType = (textContent: string) => {
    const hasText = Boolean(textContent.trim());
    const hasCode = /```/.test(textContent);
    const hasVideo = /\{\{\s*video\s*:/i.test(textContent);

    if ((hasText && hasCode) || (hasVideo && (hasText || hasCode))) return 'mixed';
    if (hasVideo) return 'video_embed';
    if (hasCode && !hasText) return 'code_example';
    return 'text';
  };

  const appendToLessonContent = (snippet: string) => {
    setLessonForm((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${snippet}` : snippet,
    }));
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!lessonForm.moduleId) {
      setError('Please select a module');
      return;
    }

    const title = lessonForm.title.trim();
    if (!title) {
      setError('Lesson title is required');
      return;
    }

    const computedType = inferLessonType(lessonForm.content || '');

    try {
      if (editingLessonId) {
        const res = await fetch(`/api/lessons/${editingLessonId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: lessonForm.description.trim() || null,
            content: lessonForm.content || null,
            durationMinutes: Number(lessonForm.durationMinutes || 0),
            isPublished: lessonForm.isPublished,
            type: computedType,
            enableLiveEditor: lessonForm.enableLiveEditor,
            liveEditorLanguage: lessonForm.liveEditorLanguage,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to update lesson');
      } else {
        const res = await fetch(`/api/modules/${lessonForm.moduleId}/lessons`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: lessonForm.description.trim() || null,
            content: lessonForm.content || null,
            durationMinutes: Number(lessonForm.durationMinutes || 0),
            isPublished: lessonForm.isPublished,
            type: computedType,
            enableLiveEditor: lessonForm.enableLiveEditor,
            liveEditorLanguage: lessonForm.liveEditorLanguage,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to create lesson');
      }

      setShowLessonModal(false);
      resetLessonForm();
      await fetchContent();
    } catch (err: any) {
      setError(err.message || 'Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm('Delete this lesson?')) return;
    setError(null);

    try {
      const res = await fetch(`/api/lessons/${lessonId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete lesson');
      await fetchContent();
    } catch (err: any) {
      setError(err.message || 'Failed to delete lesson');
    }
  };

  const togglePublishLesson = async (lesson: Lesson) => {
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${lesson.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !lesson.isPublished }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update lesson');
      await fetchContent();
    } catch (err: any) {
      setError(err.message || 'Failed to update lesson');
    }
  };

  const getLessonFormats = (lesson: Lesson) => {
    const formats: string[] = [];
    const content = lesson.content || '';
    if (content.trim()) formats.push('Text');
    if (/```/.test(content)) formats.push('Code');
    if (/\{\{\s*video\s*:/i.test(content) || (lesson.videoUrl && lesson.videoUrl.trim())) formats.push('Video');
    if (lesson.codeContent && lesson.codeContent.trim() && !formats.includes('Code')) formats.push('Code');
    if (formats.length === 0) formats.push('Empty');
    return formats;
  };

  const findSelectedLesson = () => {
    for (const module of modules) {
      for (const lesson of module.lessons) {
        if (lesson.id === selectedLessonId) {
          return { lesson, module };
        }
      }
    }
    return null;
  };

  const parseLessonContent = (content: string) => {
    const segments: { type: 'text' | 'code' | 'video' | 'starter'; value: string }[] = [];
    const tokenRegex = /```|\{\{\s*video\s*:|\{\{\s*starter\s*:/gi;
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
      if (token.toLowerCase().includes('video')) {
        segments.push({ type: 'video', value });
      } else {
        segments.push({ type: 'starter', value });
      }
      cursor = valueEnd + 2;
    }

    return segments.filter((segment) => segment.value.trim() !== '');
  };

  const generateOutlineWithAi = async () => {
    const prompt = aiOutlinePrompt.trim();
    if (!prompt) {
      setError('Please write a short course idea first');
      return;
    }
    try {
      setAiGeneratingOutline(true);
      setError(null);
      const res = await fetch(`/api/courses/${courseId}/ai-outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, phase: 1, mode: 'outline_only' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate outline');
      setAiOutlineDraft(Array.isArray(data.outline) ? data.outline : null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate outline');
    } finally {
      setAiGeneratingOutline(false);
    }
  };

  const generateDetailsWithAi = async () => {
    const prompt =
      aiOutlinePrompt.trim() ||
      aiOutlineDraft?.map((m: any) => m.title).join(', ') ||
      'Programming course';

    if (!aiOutlineDraft || aiOutlineDraft.length === 0) {
      setError('Generate outline first (Phase 1)');
      return;
    }
    try {
      setAiGeneratingDetails(true);
      setError(null);
      const res = await fetch(`/api/courses/${courseId}/ai-outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          phase: 2,
          mode: 'details',
          outline: aiOutlineDraft,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate lesson details');
      await fetchContent();
      setAiOutlineDraft(null);
      setSelectedLessonIds([]);
    } catch (err: any) {
      setError(err.message || 'Failed to generate lesson details');
    } finally {
      setAiGeneratingDetails(false);
    }
  };

  const regenerateSelectedLessons = async () => {
    const prompt = aiOutlinePrompt.trim();
    if (!prompt) {
      setError('Please write a short course idea first');
      return;
    }
    if (selectedLessonIds.length === 0) {
      setError('Select at least one lesson to regenerate');
      return;
    }
    try {
      setAiRegeneratingLessons(true);
      setError(null);
      const res = await fetch(`/api/courses/${courseId}/ai-outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'regenerate_lessons',
          prompt,
          lessonIds: selectedLessonIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to regenerate selected lessons');
      await fetchContent();
      setSelectedLessonIds([]);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate selected lessons');
    } finally {
      setAiRegeneratingLessons(false);
    }
  };
  const regenerateSingleLesson = async (lessonId: string) => {
    const prompt =
      aiOutlinePrompt.trim() ||
      aiOutlineDraft?.map((m: any) => m.title).join(', ') ||
      modules.map((m) => m.title).join(', ') ||
      'Programming course';
    setRegenLessonStatus((prev) => ({ ...prev, [lessonId]: 'generating' }));
    try {
      const res = await fetch(`/api/courses/${courseId}/ai-outline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'regenerate_lessons', prompt, lessonIds: [lessonId] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      await fetchContent();
      setRegenLessonStatus((prev) => ({ ...prev, [lessonId]: 'done' }));
      setTimeout(() => setRegenLessonStatus((prev) => ({ ...prev, [lessonId]: 'idle' })), 3000);
    } catch {
      setRegenLessonStatus((prev) => ({ ...prev, [lessonId]: 'error' }));
      setTimeout(() => setRegenLessonStatus((prev) => ({ ...prev, [lessonId]: 'idle' })), 4000);
    }
  };

  const togglePublishModule = async (module: Module) => {
    if (!module.lessons || module.lessons.length === 0) {
      setError('This chapter has no lessons to publish');
      return;
    }

    const areAllPublished = module.lessons.every((lesson) => lesson.isPublished);
    setError(null);
    try {
      const res = await fetch(`/api/modules/${module.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !areAllPublished }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update chapter publish status');
      await fetchContent();
    } catch (err: any) {
      setError(err.message || 'Failed to update chapter publish status');
    }
  };

  const toggleSelectLesson = (lessonId: string) => {
    setSelectedLessonIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  const renderTextWithLinks = (text: string) => {
    const parts: Array<{ type: 'text' | 'link' | 'code'; value: string; href?: string }> = [];
    const tokenRegex = /`([^`\n]+)`|\[([^\]]+)\]\((https?:\/\/[^)]+)\)|(https?:\/\/[^\s)]+)/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
      }
      if (match[1] !== undefined) {
        parts.push({ type: 'code', value: match[1] });
      } else if (match[2] && match[3]) {
        parts.push({ type: 'link', value: match[2], href: match[3] });
      } else if (match[4]) {
        parts.push({ type: 'link', value: match[4], href: match[4] });
      }
      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({ type: 'text', value: text.slice(lastIndex) });
    }

    return parts.map((part, idx) => {
      if (part.type === 'code') {
        return (
          <code
            key={`code-${idx}`}
            className="rounded bg-gray-200 dark:bg-gray-700 px-1 py-0.5 text-[0.92em]"
          >
            {part.value}
          </code>
        );
      }
      if (part.type === 'link' && part.href) {
        return (
          <a
            key={`link-${idx}`}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 underline hover:text-blue-700 dark:hover:text-blue-300"
          >
            {part.value}
          </a>
        );
      }
      return <span key={`text-${idx}`}>{part.value}</span>;
    });
  };

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={`spacer-${idx}`} className="h-3" />;
      }

      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={`h3-${idx}`} className="text-lg font-semibold text-gray-900 dark:text-white">
            {renderTextWithLinks(trimmed.replace(/^###\s+/, ''))}
          </h3>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={`h2-${idx}`} className="text-xl font-semibold text-gray-900 dark:text-white">
            {renderTextWithLinks(trimmed.replace(/^##\s+/, ''))}
          </h2>
        );
      }
      if (trimmed.startsWith('# ')) {
        return (
          <h1 key={`h1-${idx}`} className="text-2xl font-bold text-gray-900 dark:text-white">
            {renderTextWithLinks(trimmed.replace(/^#\s+/, ''))}
          </h1>
        );
      }

      return (
        <p key={`p-${idx}`} className="text-sm leading-6 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
          {renderTextWithLinks(line)}
        </p>
      );
    });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900/60">
        <div className="text-lg font-medium text-slate-600 dark:text-slate-300">
          Loading course content...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900/60">
        <div className="text-red-600 dark:text-red-400 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900/60">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {courseTitle || 'Course Content'}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage your course content and structure
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-4 admin-surface bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Quick Actions
            </h3>
            <span className="text-[10px] text-slate-400">Build faster</span>
          </div>

          <div className="mb-3 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
            <input
              type="text"
              value={aiOutlinePrompt}
              onChange={(e) => setAiOutlinePrompt(e.target.value)}
              placeholder="Example: Beginner Node.js backend course with projects"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              type="button"
              onClick={generateOutlineWithAi}
              disabled={aiGeneratingOutline}
              className="rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-100 dark:bg-sky-900/40 px-3 py-2 text-sm font-semibold text-sky-700 dark:text-sky-200 hover:bg-sky-200 dark:hover:bg-sky-900/60 disabled:opacity-60"
            >
              {aiGeneratingOutline ? 'Generating...' : 'Generate Outline (Phase 1)'}
            </button>
          </div>
          {!aiOutlineDraft && (
  <p className="mb-2 text-xs text-slate-400">
    Generate an outline first, then you can build the full course.
  </p>
)}
          {aiOutlineDraft && aiOutlineDraft.length > 0 && (
  <div className="mb-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-3">
    <div className="flex items-center justify-between mb-2">
      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
        Outline Preview — edit before generating
      </p>
      <span className="text-[10px] text-slate-400">
        {aiOutlineDraft.length} modules · {aiOutlineDraft.reduce((a: number, m: any) => a + (m.lessons?.length || 0), 0)} lessons
      </span>
    </div>
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {aiOutlineDraft.map((mod: any, mIdx: number) => (
        <div key={mIdx} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700/60">
            <span className="text-[10px] text-slate-400 min-w-[20px]">M{mIdx + 1}</span>
            <input
              value={mod.title || ''}
              onChange={(e) => {
                const next = [...aiOutlineDraft];
                next[mIdx] = { ...next[mIdx], title: e.target.value };
                setAiOutlineDraft(next);
              }}
              className="flex-1 text-sm font-semibold bg-transparent border-none outline-none text-slate-800 dark:text-slate-100"
              placeholder="Module title"
            />
            <button
              type="button"
              onClick={() => setAiOutlineDraft(aiOutlineDraft.filter((_: any, i: number) => i !== mIdx))}
              className="text-[10px] text-red-400 hover:text-red-600 px-1"
            >✕</button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {(mod.lessons || []).map((lesson: any, lIdx: number) => (
              <div key={lIdx} className="flex items-center gap-2 px-3 py-1.5">
                <span className="text-[10px] text-slate-400 min-w-[20px]">L{lIdx + 1}</span>
                <input
                  value={lesson.title || ''}
                  onChange={(e) => {
                    const next = [...aiOutlineDraft];
                    const lessons = [...(next[mIdx].lessons || [])];
                    lessons[lIdx] = { ...lessons[lIdx], title: e.target.value };
                    next[mIdx] = { ...next[mIdx], lessons };
                    setAiOutlineDraft(next);
                  }}
                  className="flex-1 text-xs font-medium bg-transparent border-none outline-none text-slate-700 dark:text-slate-200"
                  placeholder="Lesson title"
                />
                <input
                  value={lesson.objective || ''}
                  onChange={(e) => {
                    const next = [...aiOutlineDraft];
                    const lessons = [...(next[mIdx].lessons || [])];
                    lessons[lIdx] = { ...lessons[lIdx], objective: e.target.value };
                    next[mIdx] = { ...next[mIdx], lessons };
                    setAiOutlineDraft(next);
                  }}
                  className="flex-1 text-xs bg-transparent border-none outline-none text-slate-400"
                  placeholder="Objective"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = [...aiOutlineDraft];
                    next[mIdx] = { ...next[mIdx], lessons: (next[mIdx].lessons || []).filter((_: any, i: number) => i !== lIdx) };
                    setAiOutlineDraft(next);
                  }}
                  className="text-[10px] text-red-400 hover:text-red-600 px-1"
                >✕</button>
              </div>
            ))}
            <div className="px-3 py-1">
              <button
                type="button"
                onClick={() => {
                  const next = [...aiOutlineDraft];
                  next[mIdx] = { ...next[mIdx], lessons: [...(next[mIdx].lessons || []), { title: 'New Lesson', objective: '' }] };
                  setAiOutlineDraft(next);
                }}
                className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline"
              >+ Add lesson</button>
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setAiOutlineDraft([...aiOutlineDraft, { title: 'New Module', description: '', lessons: [{ title: 'Lesson 1', objective: '' }] }])}
        className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline mt-1"
      >+ Add module</button>
    </div>
    <div className="mt-3 flex justify-end">
      <button
        type="button"
        onClick={generateDetailsWithAi}
        disabled={aiGeneratingDetails}
        className="rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-100 dark:bg-emerald-900/40 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-200 hover:bg-emerald-200 disabled:opacity-60"
      >
        {aiGeneratingDetails ? 'Generating details...' : 'Build course from this outline →'}
      </button>
    </div>
  </div>
)}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              {
                icon: Plus,
                title: "Add Chapter",
                desc: "Create a new module for this course",
                onClick: () => openCreateModule(),
              },
              {
                icon: FileText,
                title: "Add Text Lesson",
                desc: "Write a reading lesson",
                onClick: () => openCreateLesson(undefined, "text"),
              },
              {
                icon: Code,
                title: "Add Code Example",
                desc: "Include a code sample lesson",
                onClick: () => openCreateLesson(undefined, "code_example"),
              },
              {
                icon: Video,
                title: "Add Video Lesson",
                desc: "Embed a video lesson",
                onClick: () => openCreateLesson(undefined, "video_embed"),
              },
            ].map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="
                  group flex flex-col items-start text-left p-3
                  bg-blue-50 text-blue-700
                  rounded-xl border border-blue-200
                  hover:bg-blue-100
                  transition-all duration-200
                "
              >
                <div className="h-8 w-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center shadow-sm mb-2 group-hover:border-blue-200">
                  <action.icon className="w-4 h-4 text-blue-600" />
                </div>
                <p className="font-semibold text-[11px]">
                  {action.title}
                </p>
                <p className="text-[10px] text-blue-600/80 mt-0.5">
                  {action.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Lesson Modal */}
        {showLessonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="admin-surface w-full max-w-5xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="px-6 py-4 bg-blue-950 dark:bg-gray-950 text-white flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}
                </h2>
                <button
                  onClick={() => setShowLessonModal(false)}
                  className="text-white hover:text-gray-200 transition"
                  type="button"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form
                onSubmit={handleSaveLesson}
                className="p-6 space-y-4 max-h-[90vh] overflow-y-auto"
              >

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Module
                  </label>
                  <select
                    value={lessonForm.moduleId}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, moduleId: e.target.value }))}
                    className="admin-surface w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="">Select module...</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg border border-blue-100 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-700 dark:text-blue-200">
                  Add text freely, insert code blocks anywhere, and embed videos inline using <code className="px-1">{"{{video:URL}}"}</code>.
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lesson Title
                  </label>
                  <input
                    type="text"
                    value={lessonForm.title}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., What are Variables?"
                    className="admin-surface w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lesson Description
                  </label>
                  <input
                    type="text"
                    value={lessonForm.description}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Short summary of the lesson"
                    className="admin-surface w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lesson Content (Markdown)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => appendToLessonContent('```code\\n\\n```')}
                      className="px-2.5 py-1 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Insert Code Block
                    </button>
                    <button
                      type="button"
                      onClick={() => appendToLessonContent('{{starter:\n\n}}')}
                      className="px-2.5 py-1 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Insert Starter Code
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Video URL');
                        if (url) appendToLessonContent(`{{video:${url}}}`);
                      }}
                      className="px-2.5 py-1 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Insert Video
                    </button>
                    <button
                      type="button"
                      onClick={() => appendToLessonContent('{{answer:\n\n}}')}
                      className="px-2.5 py-1 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-slate-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Insert Expected Answer
                    </button>
                  </div>
                  <textarea
                    rows={14}
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your lesson content here... Use ``` for code blocks and {{video:URL}} for videos."
                    className="admin-surface w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Tip: Use triple backticks for code blocks, <code className="px-1">{"{{video:URL}}"}</code> for videos,
                    <code className="px-1">{"{{starter: ... }}"}</code> for the live editor starter code,
                    <code className="px-1">{"{{answer: ... }}"}</code> for the expected live-editor result, and regular links like
                    <code className="px-1">[Title](https://example.com)</code> or <code className="px-1">https://example.com</code>.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={lessonForm.durationMinutes}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                      className="admin-surface w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={lessonForm.isPublished}
                      onChange={(e) => setLessonForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Publish immediately</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={lessonForm.enableLiveEditor}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, enableLiveEditor: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Enable live editor</span>
                </div>

                {lessonForm.enableLiveEditor && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Live Editor Language
                    </label>
                    <select
                      value={lessonForm.liveEditorLanguage}
                      onChange={(e) =>
                        setLessonForm((prev) => ({
                          ...prev,
                          liveEditorLanguage: e.target.value as NonNullable<Lesson['liveEditorLanguage']>,
                        }))
                      }
                      className="admin-surface w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="python">Python (Replit / OneCompiler)</option>
                      <option value="javascript">JavaScript / Node.js (Replit / StackBlitz)</option>
                      <option value="html_css">HTML/CSS (CodePen / StackBlitz)</option>
                      <option value="sql">SQL (Query Practice)</option>
                      <option value="c">C (Practice Mode)</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowLessonModal(false);
                      resetLessonForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium bg-blue-950 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {editingLessonId ? 'Save Changes' : 'Add Lesson'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Module Modal */}
        {showModuleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="admin-surface bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl max-w-md w-full mx-4 shadow-xl">
              <form onSubmit={handleSaveModule} className="p-6 space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingModuleId ? 'Edit Module' : 'Add New Module'}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Module Title
                  </label>
                  <input
                    type="text"
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="admin-surface w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="admin-surface w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModuleModal(false);
                      resetModuleForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    {editingModuleId ? 'Save Changes' : 'Add Module'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Modules List */}
          <div className="lg:col-span-3 space-y-4">
            <button
              type="button"
              onClick={openCreateModule}
              className="admin-surface w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur px-4 py-3 text-sm font-semibold text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Chapter
            </button>
            {modules.length === 0 ? (
              <div className="admin-surface text-center py-16 bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-700">
                <p className="text-slate-500 dark:text-slate-400">No modules yet.</p>
              </div>
            ) : (
              modules.map((module) => (
                <div
                  key={module.id}
                  className="admin-surface bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden"
                >
                  {/* Module Header */}
                  <div
                    onClick={() => toggleModule(module.id)}
                    className="px-6 py-4 bg-white dark:bg-slate-900/60 border-b border-gray-200 dark:border-gray-700 flex flex-col gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="flex items-start">
                      {expandedModules[module.id] ? (
                        <ChevronDown className="w-5 h-5 text-gray-500 mr-2 mt-1" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500 mr-2 mt-1" />
                      )}
                      <div>
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {module.title}
                        </h2>
                        {module.description && (
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                            {module.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative flex items-center gap-3 self-end">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          module.lessons.length > 0 && module.lessons.every((lesson) => lesson.isPublished)
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}
                      >
                        {module.lessons.length > 0 && module.lessons.every((lesson) => lesson.isPublished)
                          ? 'Chapter Published'
                          : 'Chapter Draft'}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">
                        {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenModuleMenuId((prev) => (prev === module.id ? null : module.id));
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      {openModuleMenuId === module.id && (
                        <div
                          className="admin-surface absolute right-0 top-10 z-10 w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenModuleMenuId(null);
                              togglePublishModule(module);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                          >
                            {module.lessons.length > 0 && module.lessons.every((lesson) => lesson.isPublished)
                              ? 'Unpublish Chapter'
                              : 'Publish Chapter'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenModuleMenuId(null);
                              openEditModule(module);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-slate-700 dark:text-slate-200"
                          >
                            Edit Module
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenModuleMenuId(null);
                              handleDeleteModule(module.id);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                          >
                            Delete Module
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Lessons List */}
                  {expandedModules[module.id] && (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {module.lessons.length > 0 ? (
                        module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 group cursor-pointer ${
                              selectedLessonId === lesson.id ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''
                            }`}
                            onClick={() => setSelectedLessonId(lesson.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setSelectedLessonId(lesson.id);
                              }
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selectedLessonIds.includes(lesson.id)}
                                onClick={(e) => e.stopPropagation()}
                                onChange={() => toggleSelectLesson(lesson.id)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                                aria-label={`Select lesson ${lesson.title}`}
                              />
                              {getLessonIcon(lesson.type, lesson.enableLiveEditor)}
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {lesson.title}
                                </span>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                                    {getTypeLabel(lesson.type)}
                                  </span>
                                  {!lesson.isPublished && (
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300">
                                      Draft
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-500 dark:text-slate-400">
                                    {lesson.durationMinutes} min
                                  </span>
                                </div>
                              </div>
                            </div>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => togglePublishLesson(lesson)}
                                className="px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                {lesson.isPublished ? 'Unpublish' : 'Publish'}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditLesson(lesson, module.id)}
                                className="px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-700 text-[11px] text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => regenerateSingleLesson(lesson.id)}
                                disabled={regenLessonStatus[lesson.id] === 'generating'}
                                className={`px-2 py-0.5 rounded-md border text-[11px] transition-colors ${
                                  regenLessonStatus[lesson.id] === 'done'
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                                    : regenLessonStatus[lesson.id] === 'error'
                                    ? 'border-red-300 bg-red-50 text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300'
                                    : regenLessonStatus[lesson.id] === 'generating'
                                    ? 'border-amber-300 bg-amber-50 text-amber-700 opacity-70'
                                    : 'border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-900/30'
                                }`}
                              >
                                {regenLessonStatus[lesson.id] === 'generating'
                                  ? '↻ Regenerating...'
                                  : regenLessonStatus[lesson.id] === 'done'
                                  ? '✓ Done'
                                  : regenLessonStatus[lesson.id] === 'error'
                                  ? '✗ Failed'
                                  : '↻ Regen'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="px-2 py-0.5 rounded-md border border-red-200 dark:border-red-800 text-[11px] text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                          No lessons in this module yet.
                          <button
                            type="button"
                            onClick={() => openCreateLesson(module.id)}
                            className="ml-2 text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Add your first lesson
                          </button>
                        </div>
                      )}
                      
                      {/* Add Lesson Button */}
                      <div className="px-6 py-3 bg-gray-50/50 dark:bg-gray-900/50">
                        <button
                          type="button"
                          onClick={() => openCreateLesson(module.id)}
                          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center"
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          Add Lesson
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Middle Column - Student Preview */}
          <div className="lg:col-span-6 space-y-4">
            <div className="admin-surface bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-700 p-6 min-h-[520px]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Student Preview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                This is how the selected lesson will appear to students.
              </p>
              {(() => {
                const selected = findSelectedLesson();
                if (!selected) {
                  return <p className="text-sm text-slate-500 dark:text-slate-400">Select a lesson to preview.</p>;
                }
                const { lesson, module } = selected;
                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Course</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">{courseTitle}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Chapter</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{module.title}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wide text-gray-400">Lesson</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</p>
                      {lesson.description && (
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                          {lesson.description}
                        </p>
                      )}
                    </div>
                    <LessonContentView
                      key={lesson.id}
                      content={fixContent(lesson.content ?? '')}
                      quizQuestions={lesson.quizQuestions || []}
                      enableLiveEditor={lesson.enableLiveEditor}
                      liveEditorLanguage={lesson.liveEditorLanguage || 'python'}
                      starterDisabledMessage="Starter code found, but Live Editor is disabled for this lesson."
                    />
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Right Column - Stats */}
          <div className="lg:col-span-3 space-y-6">
            <div className="admin-surface bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Course Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Modules</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{modules.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Total Lessons</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {modules.reduce((acc, m) => acc + m.lessons.length, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Published</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {modules.reduce((acc, m) => acc + m.lessons.filter(l => l.isPublished).length, 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Drafts</span>
                  <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                    {modules.reduce((acc, m) => acc + m.lessons.filter(l => !l.isPublished).length, 0)}
                  </span>
                </div>
              </div>
            </div>

            <div className="admin-surface bg-white/80 dark:bg-slate-900/70 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Content Overview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Review the formats included in each lesson.
              </p>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {modules.length === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400">No content yet.</p>
                )}
                {modules.map((module) => (
                  <div key={module.id} className="border border-slate-200/70 dark:border-slate-800 rounded-lg p-3">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {module.title}
                    </p>
                    {module.lessons.length === 0 ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No lessons yet.</p>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {module.lessons.map((lesson) => (
                          <div key={lesson.id} className="flex items-center justify-between gap-3">
                            <span className="text-xs text-gray-700 dark:text-gray-300">
                              {lesson.title}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {getLessonFormats(lesson).map((fmt) => (
                                <span
                                  key={`${lesson.id}-${fmt}`}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                    fmt === 'Text'
                                      ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                      : fmt === 'Code'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800'
                                      : fmt === 'Video'
                                      ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                                      : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                                  }`}
                                >
                                  {fmt}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



