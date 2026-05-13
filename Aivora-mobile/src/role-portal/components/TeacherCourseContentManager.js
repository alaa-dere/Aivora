import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { portalStyles } from '../styles';

const INLINE_LINK_PATTERN = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s]+)/gi;
const PREVIEW_HIDDEN_LINE_PATTERNS = [
  /^type\s*:/i,
  /^lesson\s*type\s*:/i,
  /^live\s*editor\s*:/i,
  /^live\s*compiler\s*:/i,
  /^enable\s*live\s*editor\s*:/i,
  /^live\s*editor\s*language\s*:/i,
  /^code\s*content\s*:/i,
];

const parseBooleanLike = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return null;
  if (['true', 'yes', 'on', 'enabled', '1'].includes(normalized)) return true;
  if (['false', 'no', 'off', 'disabled', '0'].includes(normalized)) return false;
  return null;
};

const normalizePreviewLine = (lineText) =>
  String(lineText || '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/[*_~`]/g, '')
    .trim();

const parseLessonPreviewMeta = (rawContent) => {
  const lines = String(rawContent || '').replace(/\r\n/g, '\n').split('\n');
  let enableLiveEditor = null;
  let liveEditorLanguage = '';
  let codeContent = '';

  for (let index = 0; index < lines.length; index += 1) {
    const line = normalizePreviewLine(lines[index]);
    if (!line) continue;
    const liveCompilerMatch = line.match(/^live\s*compiler\s*:\s*(.+)$/i);
    if (liveCompilerMatch?.[1]) {
      const parsed = parseBooleanLike(liveCompilerMatch[1]);
      if (parsed !== null) enableLiveEditor = parsed;
      continue;
    }
    const liveEditorMatch = line.match(/^(?:live\s*editor|enable\s*live\s*editor)\s*:\s*(.+)$/i);
    if (liveEditorMatch?.[1]) {
      const parsed = parseBooleanLike(liveEditorMatch[1]);
      if (parsed !== null) enableLiveEditor = parsed;
      continue;
    }
    const languageMatch = line.match(/^live\s*editor\s*language\s*:\s*(.+)$/i);
    if (languageMatch?.[1]) {
      liveEditorLanguage = String(languageMatch[1]).trim().toLowerCase();
      continue;
    }
    const codeContentMatch = line.match(/^code\s*content\s*:\s*(.*)$/i);
    if (codeContentMatch) {
      codeContent = String(codeContentMatch[1] || '').trim();
    }
  }

  return { enableLiveEditor, liveEditorLanguage, codeContent };
};

const isVideoLink = (url) => {
  const value = String(url || '').toLowerCase().trim();
  if (!value) return false;
  return (
    value.includes('youtube.com') ||
    value.includes('youtu.be') ||
    value.includes('vimeo.com') ||
    value.endsWith('.mp4') ||
    value.endsWith('.webm') ||
    value.endsWith('.m3u8')
  );
};

const getYouTubeVideoId = (url) => {
  const value = String(url || '').trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{6,})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/,
  ];
  for (let i = 0; i < patterns.length; i += 1) {
    const match = value.match(patterns[i]);
    if (match?.[1]) return match[1];
  }
  return '';
};

const toContentBlocks = (rawContent) => {
  const text = String(rawContent || '').replace(/\r\n/g, '\n').trim();
  if (!text) return [];
  const lines = text.split('\n');
  const blocks = [];
  const SPECIAL_TOKEN_REGEX =
    /\{\{\s*video\s*:\s*([^}]+)\s*\}\}|\{\{\s*starter\s*:\s*([\s\S]*?)\}\}|\{\{\s*(?:answer|expected)\s*:\s*([\s\S]*?)\}\}/gi;
  let paragraphLines = [];
  let insideCodeFence = false;
  let codeFenceLines = [];

  const flushParagraph = () => {
    if (!paragraphLines.length) return;
    blocks.push({ type: 'paragraph', text: paragraphLines.join('\n').trim() });
    paragraphLines = [];
  };

  const extractVideoUrlFromLine = (lineText) => {
    const lineValue = String(lineText || '').trim();
    if (!lineValue) return '';
    const markdownLinkMatch = lineValue.match(/^\[[^\]]+\]\((https?:\/\/[^\s)]+)\)$/i);
    if (markdownLinkMatch?.[1] && isVideoLink(markdownLinkMatch[1])) return markdownLinkMatch[1];
    if (/^https?:\/\/\S+$/i.test(lineValue) && isVideoLink(lineValue)) return lineValue;
    return '';
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = String(lines[index] || '');
    const trimmed = line.trim();
    if (!insideCodeFence && /^```/.test(trimmed) && trimmed.length > 6 && trimmed.lastIndexOf('```') > 0) {
      const firstFenceIndex = trimmed.indexOf('```');
      const lastFenceIndex = trimmed.lastIndexOf('```');
      if (lastFenceIndex > firstFenceIndex) {
        let inlineCode = trimmed.slice(firstFenceIndex + 3, lastFenceIndex).trim();
        if (inlineCode.toLowerCase().startsWith('code')) inlineCode = inlineCode.replace(/^code\s*/i, '');
        flushParagraph();
        if (inlineCode) blocks.push({ type: 'code', text: inlineCode });
        continue;
      }
    }
    if (/^```/.test(trimmed)) {
      flushParagraph();
      insideCodeFence = !insideCodeFence;
      if (!insideCodeFence) {
        const codeValue = codeFenceLines.join('\n').trimEnd();
        if (codeValue) blocks.push({ type: 'code', text: codeValue });
        codeFenceLines = [];
      }
      continue;
    }
    if (insideCodeFence) {
      codeFenceLines.push(line);
      continue;
    }
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    const codeContentMatch = normalizePreviewLine(trimmed).match(/^code\s*content\s*:\s*(.*)$/i);
    if (codeContentMatch) {
      flushParagraph();
      const collected = [];
      const inlineCode = String(codeContentMatch[1] || '').trim();
      if (inlineCode) collected.push(inlineCode);
      let nextIndex = index + 1;
      while (nextIndex < lines.length) {
        const nextRaw = String(lines[nextIndex] || '');
        const nextTrimmed = nextRaw.trim();
        const nextNormalized = normalizePreviewLine(nextTrimmed);
        if (/^```/.test(nextTrimmed)) break;
        if (
          PREVIEW_HIDDEN_LINE_PATTERNS.some((pattern) => pattern.test(nextNormalized)) &&
          !/^code\s*content\s*:/i.test(nextNormalized)
        ) {
          break;
        }
        collected.push(nextRaw.trimEnd());
        nextIndex += 1;
      }
      const codeValue = collected.join('\n').trimEnd();
      if (codeValue) blocks.push({ type: 'code', text: codeValue });
      index = Math.max(nextIndex - 1, index);
      continue;
    }

    if (PREVIEW_HIDDEN_LINE_PATTERNS.some((pattern) => pattern.test(normalizePreviewLine(trimmed)))) continue;

    if (/^\{\{/.test(trimmed)) {
      // Keep content order stable: text before token should render before token block.
      flushParagraph();
      const collectedLines = [];
      let endIndex = index;
      let closed = false;
      for (let cursor = index; cursor < lines.length; cursor += 1) {
        const rawLine = String(lines[cursor] || '');
        collectedLines.push(rawLine);
        endIndex = cursor;
        if (rawLine.includes('}}')) {
          closed = true;
          break;
        }
      }
      const tokenSource = closed ? collectedLines.join('\n') : String(trimmed);
      SPECIAL_TOKEN_REGEX.lastIndex = 0;
      let matched = false;
      let match;
      while ((match = SPECIAL_TOKEN_REGEX.exec(tokenSource)) !== null) {
        matched = true;
        if (match[1] !== undefined) {
          const videoUrl = String(match[1] || '').trim();
          if (videoUrl) blocks.push({ type: 'video', url: videoUrl });
        } else if (match[2] !== undefined) {
          const starterCode = String(match[2] || '').trim();
          if (starterCode) blocks.push({ type: 'starter', text: starterCode });
        }
      }
      if (matched) {
        index = Math.max(endIndex, index);
        continue;
      }
    }

    const inlineVideoUrl = extractVideoUrlFromLine(trimmed);
    if (inlineVideoUrl) {
      flushParagraph();
      blocks.push({ type: 'video', url: inlineVideoUrl });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      blocks.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      continue;
    }

    paragraphLines.push(line);
  }

  flushParagraph();
  return blocks;
};

const extractInlineSegments = (text) => {
  const source = String(text || '');
  const segments = [];
  let match;
  let lastIndex = 0;
  INLINE_LINK_PATTERN.lastIndex = 0;
  while ((match = INLINE_LINK_PATTERN.exec(source)) !== null) {
    if (match.index > lastIndex) segments.push({ type: 'text', value: source.slice(lastIndex, match.index) });
    if (match[3]) segments.push({ type: 'link', label: match[2], url: match[3] });
    else segments.push({ type: 'link', label: match[4], url: match[4] });
    lastIndex = INLINE_LINK_PATTERN.lastIndex;
  }
  if (lastIndex < source.length) segments.push({ type: 'text', value: source.slice(lastIndex) });
  return segments;
};

const splitSimpleArgs = (source) => String(source || '').split(',').map((item) => item.trim()).filter(Boolean);
const parseSimplePythonLiteral = (expr, vars) => {
  const value = String(expr || '').trim();
  const stringMatch = value.match(/^(['"])([\s\S]*)\1$/);
  if (stringMatch) return String(stringMatch[2] || '').replace(/\\n/g, '\n');
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (Object.prototype.hasOwnProperty.call(vars, value)) return vars[value];
  return value;
};

const runSimplePythonPreview = (code) => {
  const lines = String(code || '').replace(/\r\n/g, '\n').split('\n');
  const vars = {};
  const output = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = String(lines[i] || '').trim();
    if (!line || line.startsWith('#')) continue;
    const assignmentMatch = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      vars[assignmentMatch[1]] = parseSimplePythonLiteral(assignmentMatch[2], vars);
      continue;
    }
    const printMatch = line.match(/^print\s*\(([\s\S]*)\)\s*$/);
    if (printMatch) {
      const args = splitSimpleArgs(printMatch[1]);
      output.push(args.map((arg) => String(parseSimplePythonLiteral(arg, vars))).join(' '));
      continue;
    }
    throw new Error(`Unsupported statement on line ${i + 1}.`);
  }
  return output.join('\n') || 'Done';
};

const runSimpleJavaScriptPreview = (code) => {
  const logs = [];
  const consoleProxy = { log: (...args) => logs.push(args.map(String).join(' ')) };
  const fn = new Function('console', String(code || ''));
  fn(consoleProxy);
  return logs.join('\n') || 'Done';
};

let OptionalWebView = null;
try {
  OptionalWebView = require('react-native-webview')?.WebView || null;
} catch {
  OptionalWebView = null;
}

const getLiveEditorTitle = (language) => {
  const lang = String(language || 'python').toLowerCase();
  if (lang === 'javascript') return 'Live JavaScript Editor';
  if (lang === 'html_css') return 'Live HTML/CSS Preview';
  return 'Live Python Editor';
};

const buildHtmlPreviewDocument = (code) => `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><style>body{font-family:Arial,sans-serif;padding:12px;}</style></head><body>${String(code || '')}</body></html>`;

export default function TeacherCourseContentManager({ apiFetch, theme, courseId, onBack = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [courseTitle, setCourseTitle] = useState('Course Content');
  const [modules, setModules] = useState([]);
  const [expandedModuleIds, setExpandedModuleIds] = useState({});
  const [contentViewMode, setContentViewMode] = useState('preview');
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [previewLiveEditorByLesson, setPreviewLiveEditorByLesson] = useState({});
  const lastContentAutoRefreshAtRef = useRef(0);

  const [moduleFormOpen, setModuleFormOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState('');
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleDescription, setModuleDescription] = useState('');

  const [lessonFormOpen, setLessonFormOpen] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState('');
  const [lessonModuleId, setLessonModuleId] = useState('');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [lessonDurationMinutes, setLessonDurationMinutes] = useState('0');
  const [lessonIsPublished, setLessonIsPublished] = useState(false);
  const [lessonEnableLiveEditor, setLessonEnableLiveEditor] = useState(false);
  const [lessonLiveEditorLanguage, setLessonLiveEditorLanguage] = useState('python');

  const fetchContent = useCallback(async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(`/api/courses/${encodeURIComponent(String(courseId))}/content`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to load content');
      const list = Array.isArray(payload?.modules) ? payload.modules : [];
      setModules(list);
      setCourseTitle(String(payload?.course?.title || 'Course Content'));
      setExpandedModuleIds((prev) => {
        const next = {};
        list.forEach((m, i) => {
          const id = String(m?.id || '');
          if (!id) return;
          next[id] = Object.prototype.hasOwnProperty.call(prev, id) ? Boolean(prev[id]) : i === 0;
        });
        return next;
      });
    } catch (err) {
      setError(err?.message || 'Failed to load content');
      setModules([]);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, courseId]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const autoRefreshCourseContentIfNeeded = () => {
    if (!courseId || loading) return;
    const now = Date.now();
    if (now - Number(lastContentAutoRefreshAtRef.current || 0) < 2500) return;
    lastContentAutoRefreshAtRef.current = now;
    fetchContent();
  };

  useEffect(() => {
    const allLessons = modules.flatMap((m) => (Array.isArray(m?.lessons) ? m.lessons : []));
    if (allLessons.length === 0) return setSelectedLessonId('');
    if (!allLessons.some((l) => String(l?.id || '') === String(selectedLessonId || ''))) {
      setSelectedLessonId(String(allLessons[0]?.id || ''));
    }
  }, [modules, selectedLessonId]);

  const openExternalUrl = async (url) => {
    const target = String(url || '').trim();
    if (!target) return;
    try {
      const supported = await Linking.canOpenURL(target);
      if (!supported) throw new Error('Unsupported URL');
      await Linking.openURL(target);
    } catch {
      setError('Failed to open link.');
    }
  };

  const inferLessonType = (rawContent) => {
    const content = String(rawContent || '');
    const hasText = Boolean(content.trim());
    const hasCode = /```/.test(content) || /code\s*content\s*:/i.test(content);
    const hasVideo = /\{\{\s*video\s*:/i.test(content);
    if ((hasText && hasCode) || (hasVideo && (hasText || hasCode))) return 'mixed';
    if (hasVideo) return 'video_embed';
    if (hasCode && !hasText) return 'code_example';
    return 'text';
  };

  const openCreateModule = () => {
    setEditingModuleId('');
    setModuleTitle('');
    setModuleDescription('');
    setModuleFormOpen(true);
  };
  const closeModuleForm = () => setModuleFormOpen(false);
  const openEditModule = (m) => {
    setEditingModuleId(String(m?.id || ''));
    setModuleTitle(String(m?.title || ''));
    setModuleDescription(String(m?.description || ''));
    setModuleFormOpen(true);
  };

  const saveModule = async () => {
    const title = String(moduleTitle || '').trim();
    if (!title) return setError('Module title is required.');
    try {
      setSaving(true);
      setError('');
      const isEdit = Boolean(editingModuleId);
      const endpoint = isEdit ? `/api/modules/${encodeURIComponent(editingModuleId)}` : `/api/courses/${encodeURIComponent(String(courseId))}/modules`;
      const res = await apiFetch(endpoint, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ title, description: String(moduleDescription || '').trim() || null }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to save module');
      closeModuleForm();
      await fetchContent();
    } catch (err) {
      setError(err?.message || 'Failed to save module');
    } finally {
      setSaving(false);
    }
  };

  const deleteModule = async (moduleItem) => {
    Alert.alert('Delete module', `Delete "${moduleItem?.title || 'this module'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            setError('');
            const res = await apiFetch(`/api/modules/${encodeURIComponent(String(moduleItem?.id || ''))}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.message || 'Failed to delete module');
            await fetchContent();
          } catch (err) {
            setError(err?.message || 'Failed to delete module');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const openCreateLesson = (moduleId, type = '') => {
    setEditingLessonId('');
    setLessonModuleId(String(moduleId || ''));
    setLessonTitle('');
    setLessonDescription('');
    setLessonContent(type === 'code_example' ? '```code\n\n```' : type === 'video_embed' ? '{{video:URL}}' : '');
    setLessonDurationMinutes('0');
    setLessonIsPublished(false);
    setLessonEnableLiveEditor(false);
    setLessonLiveEditorLanguage('python');
    setLessonFormOpen(true);
  };

  const openEditLesson = (moduleId, lesson) => {
    const contentFallbackParts = [];
    if (!lesson?.content && lesson?.codeContent) contentFallbackParts.push(`\`\`\`code\n${lesson.codeContent}\n\`\`\``);
    if (!lesson?.content && lesson?.videoUrl) contentFallbackParts.push(`{{video:${lesson.videoUrl}}}`);
    setEditingLessonId(String(lesson?.id || ''));
    setLessonModuleId(String(moduleId || ''));
    setLessonTitle(String(lesson?.title || ''));
    setLessonDescription(String(lesson?.description || ''));
    setLessonContent(String(lesson?.content || contentFallbackParts.join('\n\n')));
    setLessonDurationMinutes(String(Number(lesson?.durationMinutes || 0)));
    setLessonIsPublished(Boolean(lesson?.isPublished));
    setLessonEnableLiveEditor(Boolean(lesson?.enableLiveEditor));
    setLessonLiveEditorLanguage(String(lesson?.liveEditorLanguage || 'python'));
    setLessonFormOpen(true);
  };

  const saveLesson = async () => {
    const title = String(lessonTitle || '').trim();
    if (!title || !lessonModuleId) return setError('Lesson title and module are required.');
    try {
      setSaving(true);
      setError('');
      const isEdit = Boolean(editingLessonId);
      const endpoint = isEdit ? `/api/lessons/${encodeURIComponent(editingLessonId)}` : `/api/modules/${encodeURIComponent(lessonModuleId)}/lessons`;
      const body = {
        title,
        description: String(lessonDescription || '').trim() || null,
        content: String(lessonContent || ''),
        durationMinutes: Number(lessonDurationMinutes || 0),
        isPublished: Boolean(lessonIsPublished),
        type: inferLessonType(lessonContent),
        enableLiveEditor: Boolean(lessonEnableLiveEditor),
        liveEditorLanguage: String(lessonLiveEditorLanguage || 'python'),
      };
      const res = await apiFetch(endpoint, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to save lesson');
      setLessonFormOpen(false);
      await fetchContent();
    } catch (err) {
      setError(err?.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const deleteLesson = async (lesson) => {
    Alert.alert('Delete lesson', `Delete "${lesson?.title || 'this lesson'}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            setSaving(true);
            setError('');
            const res = await apiFetch(`/api/lessons/${encodeURIComponent(String(lesson?.id || ''))}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include' });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload?.message || 'Failed to delete lesson');
            await fetchContent();
          } catch (err) {
            setError(err?.message || 'Failed to delete lesson');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const togglePublishLesson = async (lesson) => {
    try {
      setSaving(true);
      setError('');
      const lessonId = String(lesson?.id || '');
      if (!lessonId) return;
      const res = await apiFetch(`/api/lessons/${encodeURIComponent(lessonId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPublished: !Boolean(lesson?.isPublished) }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.message || 'Failed to update lesson');
      await fetchContent();
    } catch (err) {
      setError(err?.message || 'Failed to update lesson');
    } finally {
      setSaving(false);
    }
  };

  const updatePreviewLiveEditor = (lessonId, patch) => {
    const key = String(lessonId || '');
    if (!key) return;
    setPreviewLiveEditorByLesson((prev) => ({ ...prev, [key]: { ...(prev[key] || {}), ...patch } }));
  };
  const runLessonPreviewEditor = (lessonId, language, starterCode = '') => {
    const key = String(lessonId || '');
    if (!key) return;
    const current = previewLiveEditorByLesson[key] || {};
    const code = String(current.code ?? starterCode);
    try {
      const normalizedLanguage = String(language || '').toLowerCase();
      if (normalizedLanguage === 'javascript') {
        const output = runSimpleJavaScriptPreview(code);
        updatePreviewLiveEditor(key, { output, error: '', hasRun: true });
      } else if (normalizedLanguage === 'html_css') {
        updatePreviewLiveEditor(key, { output: 'Preview updated.', error: '', hasRun: true });
      } else {
        const output = runSimplePythonPreview(code);
        updatePreviewLiveEditor(key, { output, error: '', hasRun: true });
      }
    } catch (err) {
      updatePreviewLiveEditor(key, { output: '', error: err?.message || 'Failed to run code.', hasRun: true });
    }
  };

  const allLessons = useMemo(
    () => modules.flatMap((m) => (Array.isArray(m?.lessons) ? m.lessons : []).map((l) => ({ ...l, moduleTitle: m?.title }))),
    [modules]
  );
  const activeLesson = allLessons.find((l) => String(l?.id || '') === String(selectedLessonId || '')) || allLessons[0] || null;

  const renderInlineText = (value, style, keyPrefix) => {
    const segments = extractInlineSegments(value);
    return (
      <Text style={style}>
        {segments.map((segment, index) =>
          segment.type === 'link' ? (
            <Text key={`${keyPrefix}-link-${index}`} style={[style, { color: '#2563eb', textDecorationLine: 'underline' }]} onPress={() => openExternalUrl(segment.url)}>
              {segment.label}
            </Text>
          ) : (
            <Text key={`${keyPrefix}-text-${index}`} style={style}>
              {segment.value}
            </Text>
          )
        )}
      </Text>
    );
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>{courseTitle}</Text>
          <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>Course content page (mobile)</Text>
        </View>
      </View>
      <View style={portalStyles.actionRow}>
        <Pressable onPress={onBack} style={portalStyles.secondaryBtn}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textPrimary} />
        </Pressable>
        <Pressable
          onPress={() => {
            setContentViewMode('preview');
            autoRefreshCourseContentIfNeeded();
          }}
          style={[portalStyles.secondaryBtn, contentViewMode === 'preview' && portalStyles.financeFilterActive]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="eye-outline" size={14} color={theme.textPrimary} />
            <Text style={portalStyles.secondaryBtnText}>Student Preview</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={() => {
            setContentViewMode('manage');
            autoRefreshCourseContentIfNeeded();
          }}
          style={[portalStyles.secondaryBtn, contentViewMode === 'manage' && portalStyles.financeFilterActive]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="cog-outline" size={14} color={theme.textPrimary} />
            <Text style={portalStyles.secondaryBtnText}>Manage</Text>
          </View>
        </Pressable>
        <Pressable onPress={openCreateModule} style={portalStyles.chatSendBtn}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="folder-plus-outline" size={14} color="#ffffff" />
            <Text style={portalStyles.chatSendText}>Add Module</Text>
          </View>
        </Pressable>
      </View>
      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {(loading || saving) ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

      {contentViewMode === 'preview' ? (
        <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>Student Preview</Text>
          {allLessons.length === 0 ? <Text style={portalStyles.empty}>No lessons found.</Text> : null}
          {allLessons.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4, paddingRight: 12 }}>
                {allLessons.map((lesson, index) => (
                  <Pressable key={lesson?.id || `preview-${index}`} onPress={() => setSelectedLessonId(String(lesson?.id || ''))} style={[portalStyles.secondaryBtn, String(lesson?.id || '') === String(activeLesson?.id || '') && portalStyles.financeFilterActive]}>
                    <Text style={portalStyles.secondaryBtnText}>{lesson?.title || `Lesson ${index + 1}`}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          ) : null}

          {activeLesson ? (
            <View style={[portalStyles.listCard, { backgroundColor: theme.pageBg, borderColor: theme.cardBorder }]}>
              <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{activeLesson?.title || 'Untitled lesson'}</Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Module: {activeLesson?.moduleTitle || '-'}</Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Duration: {Number(activeLesson?.durationMinutes || 0)} min</Text>
              {String(activeLesson?.description || '').trim() ? renderInlineText(String(activeLesson.description), [portalStyles.listItemMeta, { color: theme.textMuted }], 'desc') : null}

              {(() => {
                const lessonContentText = String(activeLesson?.content || '');
                const lessonBlocks = toContentBlocks(lessonContentText || activeLesson?.codeContent || '');
                const lessonPreviewMeta = parseLessonPreviewMeta(lessonContentText);
                const starterTokenMatch = String(lessonContentText || '').match(/\{\{\s*starter\s*:\s*([\s\S]*?)\}\}/i);
                const starterTokenCode = String(starterTokenMatch?.[1] || '').trim();
                const fallbackCodeContent = String(starterTokenCode || lessonPreviewMeta.codeContent || activeLesson?.codeContent || '').trim();
                const effectiveLiveEditorEnabled = typeof lessonPreviewMeta.enableLiveEditor === 'boolean' ? lessonPreviewMeta.enableLiveEditor : Boolean(activeLesson?.enableLiveEditor);
                const effectiveLiveEditorLanguage = String(lessonPreviewMeta.liveEditorLanguage || activeLesson?.liveEditorLanguage || 'python').toLowerCase();
                const isHtmlPreviewLanguage = effectiveLiveEditorLanguage === 'html_css';
                const liveEditorTitle = getLiveEditorTitle(effectiveLiveEditorLanguage);
                const lessonPreviewKey = String(activeLesson?.id || '');
                const liveEditorState = previewLiveEditorByLesson[lessonPreviewKey] || {};
                const liveEditorCode = String(liveEditorState.code ?? fallbackCodeContent);
                const liveEditorOutput = String(liveEditorState.output || '');
                const liveEditorError = String(liveEditorState.error || '');
                const safeLessonBlocks = Array.isArray(lessonBlocks) ? lessonBlocks : [];
                const starterBlocks = (Array.isArray(lessonBlocks) ? lessonBlocks : []).filter(
                  (block) => block?.type === 'starter'
                );
                const hasStarterBlock = starterBlocks.length > 0;
                const standaloneVideoUrl = String(activeLesson?.videoUrl || '').trim();
                const hasStandaloneVideoInBlocks = safeLessonBlocks.some((block) => block?.type === 'video' && String(block?.url || '') === standaloneVideoUrl);
                const shouldShowTopLevelLiveEditor = effectiveLiveEditorEnabled && !hasStarterBlock && Boolean(fallbackCodeContent);

                return (
                  <View style={{ gap: 8, marginTop: 8 }}>
                    {safeLessonBlocks.map((block, blockIndex) => {
                      if (block.type === 'video') {
                        const youtubeId = getYouTubeVideoId(block.url);
                        const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '';
                        return (
                          <Pressable key={`video-${blockIndex}`} onPress={() => openExternalUrl(block.url)} style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                            {thumbnailUrl ? <Image source={{ uri: thumbnailUrl }} style={{ width: '100%', height: 140, borderRadius: 8 }} resizeMode="cover" /> : null}
                            <Text style={[portalStyles.listItemMeta, { color: '#2563eb', textDecorationLine: 'underline' }]}>{block.url}</Text>
                          </Pressable>
                        );
                      }
                      if (block.type === 'heading') {
                        const headingSize = block.level <= 1 ? 22 : block.level === 2 ? 20 : block.level === 3 ? 18 : 16;
                        return (
                          <View key={`heading-${blockIndex}`} style={{ marginTop: block.level <= 2 ? 8 : 4 }}>
                            {renderInlineText(
                              block.text,
                              [portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '800', fontSize: headingSize }],
                              `heading-${blockIndex}`
                            )}
                          </View>
                        );
                      }
                      if (block.type === 'code') {
                        return (
                          <ScrollView key={`code-${blockIndex}`} horizontal style={{ borderRadius: 8, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#020617' : '#0f172a' }} contentContainerStyle={{ padding: 10, minWidth: '100%' }}>
                            <Text selectable style={{ color: '#e2e8f0', fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) }}>{block.text}</Text>
                          </ScrollView>
                        );
                      }
                      if (block.type === 'starter') {
                        const starterCode = String(block.text || '').trim();
                        const starterEditorCode = String(liveEditorState.code ?? starterCode);
                        return (
                          <View key={`starter-${blockIndex}`} style={[portalStyles.listCard, { backgroundColor: theme.pageBg, borderColor: theme.cardBorder, padding: 10, gap: 6 }]}>
                            {!effectiveLiveEditorEnabled ? (
                              <>
                                <Text style={[portalStyles.listItemMeta, { color: '#b45309', fontWeight: '700' }]}>Live editor is disabled for this lesson.</Text>
                                <ScrollView horizontal nestedScrollEnabled style={{ borderRadius: 8, borderWidth: 1, borderColor: theme.cardBorder, backgroundColor: theme.isDark ? '#020617' : '#0f172a', maxHeight: 240 }} contentContainerStyle={{ padding: 10, minWidth: '100%' }} showsHorizontalScrollIndicator>
                                  <Text selectable style={{ color: '#e2e8f0', fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }), lineHeight: 20, fontSize: 13 }}>{starterCode}</Text>
                                </ScrollView>
                              </>
                            ) : (
                              <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted, textTransform: 'uppercase' }]}>{liveEditorTitle}</Text>
                                  {!isHtmlPreviewLanguage ? (
                                    <Pressable style={[portalStyles.secondaryBtn, { paddingVertical: 6, paddingHorizontal: 14 }]} onPress={() => runLessonPreviewEditor(lessonPreviewKey, effectiveLiveEditorLanguage, starterCode)}>
                                      <Text style={portalStyles.secondaryBtnText}>Run</Text>
                                    </Pressable>
                                  ) : null}
                                </View>
                                <TextInput
                                  multiline
                                  value={starterEditorCode}
                                  onChangeText={(text) => updatePreviewLiveEditor(lessonPreviewKey, { code: text, hasRun: false, error: '' })}
                                  placeholder="Write Python code..."
                                  placeholderTextColor="#94a3b8"
                                  style={[portalStyles.input, { minHeight: 130, textAlignVertical: 'top', color: theme.textPrimary, backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc', borderColor: theme.cardBorder }]}
                                />
                              </>
                            )}
                          </View>
                        );
                      }
                      return <View key={`p-${blockIndex}`}>{renderInlineText(String(block.text || ''), [portalStyles.listItemMeta, { color: theme.textPrimary }], `block-${blockIndex}`)}</View>;
                    })}

                    {standaloneVideoUrl && isVideoLink(standaloneVideoUrl) && !hasStandaloneVideoInBlocks ? (
                      <Pressable onPress={() => openExternalUrl(standaloneVideoUrl)} style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                        <Text style={[portalStyles.listItemMeta, { color: '#2563eb', textDecorationLine: 'underline' }]}>{standaloneVideoUrl}</Text>
                      </Pressable>
                    ) : null}

                    {shouldShowTopLevelLiveEditor ? (
                      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{liveEditorTitle}</Text>
                          {!isHtmlPreviewLanguage ? <Pressable style={portalStyles.secondaryBtn} onPress={() => runLessonPreviewEditor(lessonPreviewKey, effectiveLiveEditorLanguage, fallbackCodeContent)}><Text style={portalStyles.secondaryBtnText}>Run</Text></Pressable> : null}
                        </View>
                        <TextInput multiline value={liveEditorCode} onChangeText={(text) => updatePreviewLiveEditor(lessonPreviewKey, { code: text, hasRun: false, error: '' })} style={[portalStyles.input, { minHeight: 130 }]} />
                        {isHtmlPreviewLanguage ? (
                          OptionalWebView ? <OptionalWebView source={{ html: buildHtmlPreviewDocument(liveEditorCode) }} style={{ height: 220, backgroundColor: '#fff' }} /> : <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Install `react-native-webview` to enable rendered HTML preview on mobile.</Text>
                        ) : (
                          <Text style={[portalStyles.listItemMeta, { color: liveEditorError ? '#b91c1c' : theme.textPrimary }]}>{liveEditorError || liveEditorOutput || 'No output yet.'}</Text>
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })()}
            </View>
          ) : null}
        </View>
      ) : (
        <ScrollView
          nestedScrollEnabled
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {modules.map((moduleItem, moduleIndex) => {
            const moduleId = String(moduleItem?.id || '');
            const expanded = Boolean(expandedModuleIds[moduleId]);
            const lessons = Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : [];
            return (
              <View key={moduleId || `module-${moduleIndex}`} style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
                <Pressable onPress={() => setExpandedModuleIds((prev) => ({ ...prev, [moduleId]: !Boolean(prev[moduleId]) }))} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{moduleItem?.title || 'Untitled module'}</Text>
                  <MaterialCommunityIcons
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.textMuted}
                  />
                </Pressable>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Module ID: {moduleItem?.id || '-'} | Order: {Number(moduleItem?.orderNumber || moduleIndex + 1)} | Lessons: {lessons.length}
                </Text>
                {moduleItem?.description ? (
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{moduleItem.description}</Text>
                ) : null}
                <View style={[portalStyles.actionRow, { flexWrap: 'wrap', alignItems: 'flex-start' }]}>
                    <Pressable onPress={() => openCreateLesson(moduleId, 'text')} style={[portalStyles.secondaryBtn, { marginRight: 8, marginBottom: 8 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="text-box-outline" size={14} color={theme.textPrimary} />
                        <Text style={portalStyles.secondaryBtnText}>Add Text Lesson</Text>
                      </View>
                    </Pressable>
                    <Pressable onPress={() => openCreateLesson(moduleId, 'code_example')} style={[portalStyles.secondaryBtn, { marginRight: 8, marginBottom: 8 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="code-tags" size={14} color={theme.textPrimary} />
                        <Text style={portalStyles.secondaryBtnText}>Add Code Lesson</Text>
                      </View>
                    </Pressable>
                    <Pressable onPress={() => openCreateLesson(moduleId, 'video_embed')} style={[portalStyles.secondaryBtn, { marginRight: 8, marginBottom: 8 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <MaterialCommunityIcons name="video-outline" size={14} color={theme.textPrimary} />
                        <Text style={portalStyles.secondaryBtnText}>Add Video Lesson</Text>
                      </View>
                    </Pressable>
                </View>
                <View style={portalStyles.actionRow}>
                  <Pressable onPress={() => openEditModule(moduleItem)} style={portalStyles.secondaryBtn}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="pencil-outline" size={14} color={theme.textPrimary} />
                      <Text style={portalStyles.secondaryBtnText}>Edit Module</Text>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => deleteModule(moduleItem)} style={portalStyles.secondaryBtn}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="delete-outline" size={14} color="#b91c1c" />
                      <Text style={[portalStyles.secondaryBtnText, { color: '#b91c1c' }]}>Delete Module</Text>
                    </View>
                  </Pressable>
                </View>
                {expanded ? (
                  lessons.length > 0 ? (
                    lessons.map((lesson, lessonIndex) => (
                      <View key={String(lesson?.id || `${moduleId}-lesson-${lessonIndex}`)} style={portalStyles.listItem}>
                        <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{lesson?.title || 'Untitled lesson'}</Text>
                        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                          Lesson ID: {lesson?.id || '-'} | Order: {Number(lesson?.orderNumber || lessonIndex + 1)} | Type: {lesson?.type || 'text'}
                        </Text>
                        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                          Duration: {Number(lesson?.durationMinutes || 0)} min | Published: {lesson?.isPublished ? 'Yes' : 'No'}
                        </Text>
                        <View style={portalStyles.actionRow}>
                          <Pressable onPress={() => openEditLesson(moduleId, lesson)} style={portalStyles.secondaryBtn}><Text style={portalStyles.secondaryBtnText}>Edit Lesson</Text></Pressable>
                          <Pressable onPress={() => togglePublishLesson(lesson)} style={portalStyles.secondaryBtn}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <MaterialCommunityIcons name={lesson?.isPublished ? 'eye-off-outline' : 'eye-check-outline'} size={14} color={theme.textPrimary} />
                              <Text style={portalStyles.secondaryBtnText}>{lesson?.isPublished ? 'Unpublish' : 'Publish'}</Text>
                            </View>
                          </Pressable>
                          <Pressable onPress={() => deleteLesson(lesson)} style={portalStyles.secondaryBtn}><Text style={[portalStyles.secondaryBtnText, { color: '#b91c1c' }]}>Delete Lesson</Text></Pressable>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted, marginTop: 8 }]}>No lessons yet.</Text>
                  )
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      )}

      {moduleFormOpen ? (
        <View style={portalStyles.menuOverlay}>
          <Pressable style={portalStyles.menuOverlayTouch} onPress={closeModuleForm} />
          <View style={portalStyles.menuDrawer}>
            <ScrollView contentContainerStyle={portalStyles.menuDrawerContent}>
              <Text style={portalStyles.modalSheetTitle}>{editingModuleId ? 'Edit Module' : 'Create Module'}</Text>
              <TextInput value={moduleTitle} onChangeText={setModuleTitle} placeholder="Module title" placeholderTextColor="#94a3b8" style={portalStyles.input} />
              <TextInput value={moduleDescription} onChangeText={setModuleDescription} placeholder="Module description" placeholderTextColor="#94a3b8" style={[portalStyles.input, { minHeight: 90 }]} multiline />
              <View style={portalStyles.actionRow}>
                <Pressable onPress={closeModuleForm} style={portalStyles.secondaryBtn}><Text style={portalStyles.secondaryBtnText}>Cancel</Text></Pressable>
                <Pressable onPress={saveModule} disabled={saving} style={portalStyles.secondaryBtn}><Text style={portalStyles.secondaryBtnText}>{saving ? 'Saving...' : 'Save Module'}</Text></Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : null}

      {lessonFormOpen ? (
        <View style={portalStyles.menuOverlay}>
          <Pressable style={portalStyles.menuOverlayTouch} onPress={() => setLessonFormOpen(false)} />
          <View style={portalStyles.menuDrawer}>
            <ScrollView contentContainerStyle={portalStyles.menuDrawerContent}>
              <Text style={portalStyles.modalSheetTitle}>{editingLessonId ? 'Edit Lesson' : 'Create Lesson'}</Text>
              <TextInput value={lessonTitle} onChangeText={setLessonTitle} placeholder="Lesson title" placeholderTextColor="#94a3b8" style={portalStyles.input} />
              <TextInput value={lessonDescription} onChangeText={setLessonDescription} placeholder="Lesson description" placeholderTextColor="#94a3b8" style={portalStyles.input} />
              <TextInput value={lessonDurationMinutes} onChangeText={setLessonDurationMinutes} placeholder="Duration minutes" placeholderTextColor="#94a3b8" keyboardType="numeric" style={portalStyles.input} />
              <Pressable onPress={() => setLessonIsPublished((v) => !v)} style={portalStyles.secondaryBtn}><Text style={portalStyles.secondaryBtnText}>Published: {lessonIsPublished ? 'Yes' : 'No'}</Text></Pressable>
              <Pressable onPress={() => setLessonEnableLiveEditor((v) => !v)} style={portalStyles.secondaryBtn}><Text style={portalStyles.secondaryBtnText}>Live Editor: {lessonEnableLiveEditor ? 'Enabled' : 'Disabled'}</Text></Pressable>
              {lessonEnableLiveEditor ? (
                <View style={portalStyles.actionRow}>
                  {[
                    { value: 'python', label: 'Python' },
                    { value: 'javascript', label: 'JavaScript' },
                    { value: 'html_css', label: 'HTML/CSS' },
                  ].map((option) => {
                    const selected = lessonLiveEditorLanguage === option.value;
                    return (
                      <Pressable
                        key={option.value}
                        onPress={() => setLessonLiveEditorLanguage(option.value)}
                        style={[portalStyles.secondaryBtn, selected && portalStyles.financeFilterActive]}
                      >
                        <Text style={portalStyles.secondaryBtnText}>{option.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
              <View style={portalStyles.actionRow}>
                <Pressable style={portalStyles.secondaryBtn} onPress={() => setLessonContent((prev) => (prev ? `${prev}\n\n\`\`\`code\n\n\`\`\`` : '```code\n\n```'))}>
                  <Text style={portalStyles.secondaryBtnText}>Insert Code</Text>
                </Pressable>
                <Pressable style={portalStyles.secondaryBtn} onPress={() => setLessonContent((prev) => (prev ? `${prev}\n\n{{video:URL}}` : '{{video:URL}}'))}>
                  <Text style={portalStyles.secondaryBtnText}>Insert Video</Text>
                </Pressable>
                <Pressable style={portalStyles.secondaryBtn} onPress={() => setLessonContent((prev) => (prev ? `${prev}\n\n{{starter:\nprint(\"\")\n}}` : '{{starter:\nprint(\"\")\n}}'))}>
                  <Text style={portalStyles.secondaryBtnText}>Insert Starter</Text>
                </Pressable>
                <Pressable style={portalStyles.secondaryBtn} onPress={() => setLessonContent((prev) => (prev ? `${prev}\n\n{{answer:\n\n}}` : '{{answer:\n\n}}'))}>
                  <Text style={portalStyles.secondaryBtnText}>Insert Answer</Text>
                </Pressable>
              </View>
              <TextInput value={lessonContent} onChangeText={setLessonContent} placeholder="Lesson content" placeholderTextColor="#94a3b8" style={[portalStyles.input, { minHeight: 140 }]} multiline />
              <View style={portalStyles.actionRow}>
                <Pressable onPress={() => setLessonFormOpen(false)} style={portalStyles.secondaryBtn}><Text style={portalStyles.secondaryBtnText}>Cancel</Text></Pressable>
                <Pressable onPress={saveLesson} disabled={saving} style={portalStyles.secondaryBtn}><Text style={portalStyles.secondaryBtnText}>{saving ? 'Saving...' : 'Save Lesson'}</Text></Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      ) : null}
    </View>
  );
}
