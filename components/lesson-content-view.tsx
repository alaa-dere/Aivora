'use client';

import { ReactNode } from 'react';
import LivePythonEditor from '@/components/live-python-editor';
import LiveJsEditor from '@/components/live-js-editor';
import LiveHtmlPreview from '@/components/live-html-preview';

type LiveEditorSubmission = {
  code: string;
  output: string;
  hasRun: boolean;
  error?: string | null;
};

type LessonContentViewProps = {
  content: string;
  enableLiveEditor?: boolean;
  liveEditorLanguage?: 'python' | 'javascript' | 'html_css';
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

const normalizeFenceText = (content: string) => {
  if (!content) return content;
  // Handle escaped backticks that can come from copied/serialized text.
  return content.replace(/\\`/g, '`');
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

      segments.push({ type: 'code', value: codeValue.trim() });
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

export default function LessonContentView({
  content,
  enableLiveEditor = false,
  liveEditorLanguage = 'python',
  onSubmissionChange,
  starterDisabledMessage = 'Live editor is disabled for this lesson.',
  emptyMessage = 'No lesson content yet.',
}: LessonContentViewProps) {
  const segments = parseLessonContent(content || '');

  if (segments.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {segments.map((seg, idx) => {
        if (seg.type === 'code') {
          return (
            <pre key={idx} className="rounded-lg bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm">
              <code>{seg.value}</code>
            </pre>
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
