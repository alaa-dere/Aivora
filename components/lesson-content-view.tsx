'use client';

import { ReactNode, useState } from 'react';
import LivePythonEditor from '@/components/live-python-editor';
import LiveJsEditor from '@/components/live-js-editor';
import LiveHtmlPreview from '@/components/live-html-preview';
import LiveSqlEditor from '@/components/live-sql-editor';
import LiveCEditor from '@/components/live-c-editor';

type LiveEditorSubmission = {
  code: string;
  output: string;
  hasRun: boolean;
  error?: string | null;
};

type LessonContentViewProps = {
  content: string;
  quizQuestions?: any[];
  enableLiveEditor?: boolean;
  liveEditorLanguage?: 'python' | 'javascript' | 'html_css' | 'sql' | 'c';
  onSubmissionChange?: (submission: LiveEditorSubmission) => void;
  starterDisabledMessage?: string;
  emptyMessage?: string;
};

type SegmentType = 'text' | 'code' | 'video' | 'starter' | 'answer';

type Segment = {
  type: SegmentType;
  value: string;
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
        <h4 key={`h4-${i}`} className="text-base font-semibold text-gray-800 dark:text-gray-100 mt-3 mb-2">
          {inlineMarkdownToNodes(trimmed.slice(5))}
        </h4>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('### ')) {
      nodes.push(
        <h3 key={`h3-${i}`} className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-3 mb-2">
          {inlineMarkdownToNodes(trimmed.slice(4))}
        </h3>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('## ')) {
      nodes.push(
        <h2 key={`h2-${i}`} className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-4 mb-2">
          {inlineMarkdownToNodes(trimmed.slice(3))}
        </h2>
      );
      i += 1;
      continue;
    }

    if (trimmed.startsWith('# ')) {
      nodes.push(
        <h1 key={`h1-${i}`} className="text-2xl font-bold text-gray-900 dark:text-white mt-4 mb-2">
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

const normalizeFenceText = (content: string) => {
  if (!content) return content;
  let normalized = content;
  // Handle escaped backticks/newlines/tabs that can come from serialized content.
  normalized = normalized.replace(/\\`/g, '`').replace(/\\n/g, '\n').replace(/\\t/g, '  ');

  // Normalize malformed headings like "# # Title" or "# # # Subtitle".
  normalized = normalized
    .replace(/(^|\n)\s*#\s+#\s+#\s+#\s+/g, '$1#### ')
    .replace(/(^|\n)\s*#\s+#\s+#\s+/g, '$1### ')
    .replace(/(^|\n)\s*#\s+#\s+/g, '$1## ');

  // If a heading appears inline after paragraph text, force it to a new block.
  normalized = normalized
    .replace(/([^\n])\s+#\s+#\s+#\s+#\s+/g, '$1\n\n#### ')
    .replace(/([^\n])\s+#\s+#\s+#\s+/g, '$1\n\n### ')
    .replace(/([^\n])\s+#\s+#\s+/g, '$1\n\n## ');

  // Force a real paragraph break after common section headings when AI returns
  // heading + body in the same line.
  normalized = normalized
    .replace(/(#{1,4}\s*What is[^\n#]*?)(\s+)(?=[A-Z0-9])/g, '$1\n\n')
    .replace(/(#{1,4}\s*Why it matters[^\n#]*?)(\s+)(?=[A-Z0-9])/g, '$1\n\n');

  // Keep spacing consistent around headings.
  normalized = normalized
    .replace(/([^\n])\n(#{1,4}\s)/g, '$1\n\n$2')
    // Ensure list markers are on their own lines so they render as lists.
    .replace(/([^\n])\s+(-\s+)/g, '$1\n\n$2')
    .replace(/([^\n])\s+(\d+\.\s+)/g, '$1\n\n$2')
    .replace(/\n\s*(-\s+)/g, '\n$1')
    .replace(/\n\s*(\d+\.\s+)/g, '\n$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return normalized;
};

const normalizeStarterFormatting = (value: string) => {
  if (!value) return value;
  // Only normalize escaped Windows newlines token to real newlines.
  // Do NOT convert generic "\\n" because it may be part of C/JS string literals
  // (e.g. printf("hello\\n")), and converting it breaks compilable code.
  return value.replace(/\\r\\n/g, '\n');
};

const fixCode = (raw: string) =>
  String(raw || '')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '  ')
    .replace(/;(\s*)(?=[^\s])/g, ';\n')
    .replace(/(#[^\n]+)\n([^\n])/g, '$1\n\n$2')
    .replace(/(\/\/[^\n]+)\n([^\n])/g, '$1\n\n$2')
    .replace(/(\/\*[^*]*\*\/)\n([^\n])/g, '$1\n\n$2')
    .trim();

const formatCodeForDisplay = (raw: string) => {
  const input = fixCode(raw);
  if (!input) return input;
  if (input.includes('\n')) {
    return input
      .split('\n')
      .flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed.startsWith('#')) return [line];
        const noHash = trimmed.replace(/^#+\s*/, '');
        const splitMatch = noHash.match(/\s+([a-zA-Z_][a-zA-Z0-9_]*\s*=.+)$/);
        if (!splitMatch || !splitMatch[1]) return [line];
        const code = splitMatch[1].trim();
        const commentText = noHash.slice(0, noHash.lastIndexOf(code)).trim();
        if (!commentText || !code) return [line];
        return [`# ${commentText}`, code];
      })
      .join('\n');
  }

  // Heuristics for AI-compressed one-line snippets.
  let out = input
    .replace(/\s+(#)/g, '\n$1')
    .replace(/\s+(\/\/)/g, '\n$1')
    .replace(/;\s*/g, ';\n')
    .replace(/\s+\b(def|function|class|if|for|while|try|except|return|const|let|var)\b/g, '\n$1');

  // Python: move inline comment above statement when they are on one line.
  const pyInline = out.match(/^([^#'"]+?)\s+(#.+)$/);
  if (pyInline && pyInline[1]?.trim() && pyInline[2]?.trim()) {
    out = `${pyInline[2].trim()}\n${pyInline[1].trim()}`;
  }

  return out
    .replace(/(#[^\n]+)\n([^\n])/g, '$1\n\n$2')
    .replace(/(\/\/[^\n]+)\n([^\n])/g, '$1\n\n$2')
    .replace(/(\/\*[^*]*\*\/)\n([^\n])/g, '$1\n\n$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const parseLessonContent = (content: string) => {
  const source = normalizeFenceText(content || '');
  const segments: Segment[] = [];
  const tokenRegex = /```|\{\{\s*video\s*:|\{\{\s*starter\s*:|\{\{\s*(?:answer|expected)\s*:/gi;
  let cursor = 0;

  while (cursor < source.length) {
    tokenRegex.lastIndex = cursor;
    const match = tokenRegex.exec(source);
    if (!match) {
      segments.push({ type: 'text', value: source.slice(cursor) });
      break;
    }

    const tokenStart = match.index;
    const token = match[0];
    if (tokenStart > cursor) {
      segments.push({ type: 'text', value: source.slice(cursor, tokenStart) });
    }

    if (token === '```') {
      const codeStart = tokenRegex.lastIndex;
      let codeEnd = source.indexOf('```', codeStart);
      let advanceBy = 3;

      // If closing fence is missing, stop at end-of-line so one bad fence does not swallow following text.
      if (codeEnd === -1) {
        const lineEnd = source.indexOf('\n', codeStart);
        codeEnd = lineEnd === -1 ? source.length : lineEnd;
        advanceBy = lineEnd === -1 ? 0 : 1;
      }

      let codeValue = source.slice(codeStart, codeEnd);
      const newLineMatch = codeValue.match(/\r?\n/);
      if (newLineMatch && newLineMatch.index !== undefined) {
        const firstLine = codeValue.slice(0, newLineMatch.index).trim();
        if (/^[a-zA-Z0-9_+-]+$/.test(firstLine)) {
          codeValue = codeValue.slice(newLineMatch.index + newLineMatch[0].length);
        }
      }

      segments.push({ type: 'code', value: formatCodeForDisplay(codeValue.trim()) });
      cursor = codeEnd + advanceBy;
      continue;
    }

    const valueStart = tokenRegex.lastIndex;
    const valueEnd = source.indexOf('}}', valueStart);
    if (valueEnd === -1) {
      segments.push({ type: 'text', value: source.slice(tokenStart) });
      break;
    }

    const value = source.slice(valueStart, valueEnd).trim();
    const normalizedToken = token.toLowerCase();
    if (normalizedToken.includes('video')) {
      segments.push({ type: 'video', value });
    } else if (normalizedToken.includes('starter')) {
      segments.push({ type: 'starter', value: formatCodeForDisplay(normalizeStarterFormatting(value)) });
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

export default function LessonContentView({
  content,
  enableLiveEditor = false,
  liveEditorLanguage = 'python',
  onSubmissionChange,
  starterDisabledMessage = 'Live editor is disabled for this lesson.',
  emptyMessage = 'No lesson content yet.',
  quizQuestions = [],
}: LessonContentViewProps) {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const segments = parseLessonContent(content || '');

  const copyCode = async (value: string, index: number) => {
    const text = value || '';
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedCodeIndex(index);
      setTimeout(() => {
        setCopiedCodeIndex((current) => (current === index ? null : current));
      }, 1400);
    } catch {
      setCopiedCodeIndex(null);
    }
  };

  if (segments.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return (
            <div key={idx} className="relative">
              <button
                type="button"
                onClick={() => copyCode(seg.value, idx)}
                className="absolute top-2 right-2 z-10 rounded-md border border-gray-600 bg-gray-800/90 px-2 py-1 text-[11px] font-medium text-gray-100 hover:bg-gray-700"
              >
                {copiedCodeIndex === idx ? 'Copied' : 'Copy'}
              </button>
              <pre className="rounded-lg bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm">
                <code>{seg.value}</code>
              </pre>
            </div>
          );
        }
        if (seg.type === 'starter') {
          if (!enableLiveEditor) {
            return (
              <div key={idx} className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-700 dark:text-amber-200">
                {starterDisabledMessage}
              </div>
            );
          }
          if (liveEditorLanguage === 'javascript') {
            return <LiveJsEditor key={idx} initialCode={seg.value} onSubmissionChange={onSubmissionChange} />;
          }
          if (liveEditorLanguage === 'html_css') {
            return <LiveHtmlPreview key={idx} initialCode={seg.value} onSubmissionChange={onSubmissionChange} />;
          }
          if (liveEditorLanguage === 'sql') {
            return <LiveSqlEditor key={idx} initialCode={seg.value} onSubmissionChange={onSubmissionChange} />;
          }
          if (liveEditorLanguage === 'c') {
            return <LiveCEditor key={idx} initialCode={seg.value} onSubmissionChange={onSubmissionChange} />;
          }
          return <LivePythonEditor key={idx} initialCode={seg.value} onSubmissionChange={onSubmissionChange} />;
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
        return <div key={idx}>{renderMarkdownText(seg.value)}</div>;
      })}
    </div>
  );
}


