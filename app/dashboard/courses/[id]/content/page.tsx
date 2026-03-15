// app/dashboard/courses/[id]/content/page.tsx
'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, FileText, Code, Play, Video, HelpCircle, MoreVertical } from 'lucide-react';

type Lesson = {
  id: string;
  title: string;
  type: 'text' | 'code_example' | 'live_python' | 'video_embed' | 'quiz' | 'mixed';
  enableLiveEditor: boolean;
  durationMinutes: number;
  isPublished: boolean;
  content?: string;
  codeContent?: string;
  description?: string;
  videoUrl?: string;
};

type Module = {
  id: string;
  title: string;
  description?: string;
  orderNumber: number;
  lessons: Lesson[];
};

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
  });
  const [openModuleMenuId, setOpenModuleMenuId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

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
        const initialExpanded: Record<string, boolean> = {};
        data.modules.slice(0, 2).forEach((m: Module) => {
          initialExpanded[m.id] = true;
        });
        setExpandedModules(initialExpanded);
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
    const segments: { type: 'text' | 'code' | 'video'; value: string }[] = [];
    const regex = /```([\s\S]*?)```|\{\{\s*video\s*:\s*([^}]+)\s*\}\}/gi;
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
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < content.length) {
      segments.push({ type: 'text', value: content.slice(lastIndex) });
    }

    return segments.filter((segment) => segment.value.trim() !== '');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg font-medium text-gray-600 dark:text-gray-300">
          Loading course content...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-red-600 dark:text-red-400 text-center">
          <p className="text-xl font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 lg:px-10 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {courseTitle || 'Course Content'}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage your course content and structure
            </p>
          </div>
          <button 
            onClick={() => openCreateLesson()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Content
          </button>
        </div>

        {/* Lesson Modal */}
        {showLessonModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full mx-4 shadow-xl">
              <form
                onSubmit={handleSaveLesson}
                className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
              >
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {editingLessonId ? 'Edit Lesson' : 'Add New Lesson'}
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Module
                  </label>
                  <select
                    value={lessonForm.moduleId}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, moduleId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                      className="px-2.5 py-1 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Insert Code Block
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Video URL');
                        if (url) appendToLessonContent(`{{video:${url}}}`);
                      }}
                      className="px-2.5 py-1 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      Insert Video
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={lessonForm.content}
                    onChange={(e) => setLessonForm((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Write your lesson content here... Use ``` for code blocks and {{video:URL}} for videos."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Tip: Use triple backticks for code blocks and <code className="px-1">{"{{video:URL}}"}</code> to embed videos inline.
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
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
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
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full mx-4 shadow-xl">
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            {modules.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400 mb-3">No modules yet. Add your first module to get started.</p>
                <button
                  type="button"
                  onClick={openCreateModule}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Module
                </button>
              </div>
            ) : (
              modules.map((module) => (
                <div
                  key={module.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                >
                  {/* Module Header */}
                  <div
                    onClick={() => toggleModule(module.id)}
                    className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors"
                  >
                    <div className="flex items-center flex-1">
                      {expandedModules[module.id] ? (
                        <ChevronDown className="w-5 h-5 text-gray-500 mr-2" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-500 mr-2" />
                      )}
                      <div>
                        <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                          {module.title}
                        </h2>
                        {module.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {module.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="relative flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {module.lessons.length} {module.lessons.length === 1 ? 'lesson' : 'lessons'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setOpenModuleMenuId((prev) => (prev === module.id ? null : module.id))
                        }
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>
                      {openModuleMenuId === module.id && (
                        <div className="absolute right-0 top-10 z-10 w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenModuleMenuId(null);
                              openEditModule(module);
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
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
                            className={`px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center justify-between group cursor-pointer ${
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
                            <div className="flex items-center gap-3 flex-1">
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
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {lesson.durationMinutes} min
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => togglePublishLesson(lesson)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-400"
                              >
                                {lesson.isPublished ? 'Unpublish' : 'Publish'}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditLesson(lesson, module.id)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-400"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-sm text-red-600 dark:text-red-400"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
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
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 min-h-[520px]">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Student Preview</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                This is how the selected lesson will appear to students.
              </p>
              {(() => {
                const selected = findSelectedLesson();
                if (!selected) {
                  return <p className="text-sm text-gray-500 dark:text-gray-400">Select a lesson to preview.</p>;
                }
                const { lesson, module } = selected;
                const segments = parseLessonContent(lesson.content || '');
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
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{lesson.description}</p>
                      )}
                    </div>
                    <div className="space-y-3">
                      {segments.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No lesson content yet.</p>
                      )}
                      {segments.map((seg, idx) => {
                        if (seg.type === 'code') {
                          return (
                            <pre key={idx} className="rounded-lg bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm">
                              <code>{seg.value}</code>
                            </pre>
                          );
                        }
                        if (seg.type === 'video') {
                          const url = seg.value;
                          return (
                            <div key={idx} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Embedded Video</p>
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
                );
              })()}
            </div>
          </div>

          {/* Right Column - Quick Actions & Stats */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={openCreateModule}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                >
                  <Plus className="w-5 h-5 text-blue-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Add Module</span>
                </button>
                <button
                  type="button"
                  onClick={() => openCreateLesson(undefined, 'text')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                >
                  <FileText className="w-5 h-5 text-green-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Add Text Content</span>
                </button>
                <button
                  type="button"
                  onClick={() => openCreateLesson(undefined, 'code_example')}
                  className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center"
                >
                  <Code className="w-5 h-5 text-purple-500 mr-3" />
                  <span className="text-gray-700 dark:text-gray-300">Add Code Example</span>
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
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

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Content Overview</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Review the formats included in each lesson.
              </p>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {modules.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No content yet.</p>
                )}
                {modules.map((module) => (
                  <div key={module.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                      {module.title}
                    </p>
                    {module.lessons.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">No lessons yet.</p>
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


