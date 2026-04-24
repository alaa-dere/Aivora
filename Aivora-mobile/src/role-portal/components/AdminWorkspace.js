import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MOBILE_TABS } from '../config/mobile-tabs';
import { ROLE_FEATURES } from '../config/role-features';
import { portalStyles } from '../styles';
import { getActiveApiBaseUrl } from '../../services/api-client';
import { downloadCertificatePdfNative } from '../../services/certificate-download';
import AdminDashboardView from './AdminDashboardView';
import CertificatePreviewCard from './CertificatePreviewCard';
import RevenueAreaChart from './RevenueAreaChart';

const getThemeColors = (mode) => {
  const isDark = mode === 'dark';
  return {
    isDark,
    pageBg: isDark ? '#0b1220' : '#f1f5f9',
    topBg: isDark ? '#111827' : '#ffffff',
    border: isDark ? '#243041' : '#dbe4ef',
    cardBg: isDark ? '#111827' : '#ffffff',
    cardBorder: isDark ? '#243041' : '#e2e8f0',
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    iconBg: isDark ? '#1f2937' : '#e2e8f0',
    navBg: isDark ? '#111827' : '#ffffff',
    navBorder: isDark ? '#243041' : '#dbe4ef',
  };
};

const FEATURE_ICON_MAP = {
  'admin-stats': 'chart-bar',
  'admin-recent-activity': 'history',
  'admin-revenue-trend': 'chart-line',
  'admin-courses': 'book-open-page-variant',
  'admin-teachers': 'account-tie',
  'admin-students': 'account-school',
  'admin-categories': 'shape',
  'admin-paths': 'map-marker-path',
  'admin-certificates': 'certificate',
  'admin-notifications': 'bell',
  'admin-messages': 'message-text',
  'admin-transactions': 'cash-multiple',
  'admin-reports': 'file-chart',
};

function SectionCard({ title, children, theme }) {
  return (
    <View style={[portalStyles.adminSection, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
      <Text style={[portalStyles.adminSectionTitle, { color: theme.textPrimary }]}>{title}</Text>
      {children}
    </View>
  );
}

const formatValue = (value) => {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toFixed(2);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  const text = String(value).trim();
  return text || 'N/A';
};

const prettifyKey = (key) =>
  String(key || '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (char) => char.toUpperCase());

const buildExtraRows = (item) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
  const rows = [];

  Object.entries(item).forEach(([key, value]) => {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.entries(value).forEach(([nestedKey, nestedValue]) => {
        if (nestedValue === null || nestedValue === undefined || typeof nestedValue === 'object') return;
        rows.push({
          label: `${prettifyKey(key)} ${prettifyKey(nestedKey)}`,
          value: formatValue(nestedValue),
        });
      });
      return;
    }
    if (value === null || value === undefined || typeof value === 'object') return;
    rows.push({ label: prettifyKey(key), value: formatValue(value) });
  });

  return rows;
};

const getFirstSentence = (message) => {
  const text = String(message || '').trim();
  if (!text) return '';
  const sentenceMatch = text.match(/^.*?[.!?؟](?:\s|$)/);
  if (sentenceMatch) return sentenceMatch[0].trim();
  const firstLine = text.split('\n').find((line) => String(line || '').trim());
  return firstLine ? firstLine.trim() : text;
};

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
const getPreviewHiddenLinePatterns = () =>
  Array.isArray(PREVIEW_HIDDEN_LINE_PATTERNS) ? PREVIEW_HIDDEN_LINE_PATTERNS : [];

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
      const collected = [];
      const inlineCode = String(codeContentMatch[1] || '').trim();
      if (inlineCode) collected.push(inlineCode);
      for (let nextIndex = index + 1; nextIndex < lines.length; nextIndex += 1) {
        const nextRaw = String(lines[nextIndex] || '');
        const nextNormalized = normalizePreviewLine(nextRaw);
        if (
          getPreviewHiddenLinePatterns().some((pattern) => pattern.test(nextNormalized)) &&
          !/^code\s*content\s*:/i.test(nextNormalized)
        ) {
          break;
        }
        collected.push(nextRaw);
      }
      codeContent = collected.join('\n').trim();
    }
  }

  return {
    enableLiveEditor,
    liveEditorLanguage,
    codeContent,
  };
};

const extractInlineSegments = (text) => {
  const source = String(text || '');
  const segments = [];
  let match;
  let lastIndex = 0;

  INLINE_LINK_PATTERN.lastIndex = 0;
  while ((match = INLINE_LINK_PATTERN.exec(source)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: source.slice(lastIndex, match.index) });
    }
    if (match[3]) {
      segments.push({ type: 'link', label: match[2], url: match[3] });
    } else {
      segments.push({ type: 'link', label: match[4], url: match[4] });
    }
    lastIndex = INLINE_LINK_PATTERN.lastIndex;
  }
  if (lastIndex < source.length) {
    segments.push({ type: 'text', value: source.slice(lastIndex) });
  }
  return segments;
};

const toContentBlocks = (rawContent) => {
  const text = String(rawContent || '').replace(/\r\n/g, '\n').trim();
  if (!text) return [];

  const lines = text.split('\n');
  const blocks = [];
  let paragraphLines = [];
  let listMode = '';
  let listItems = [];
  let insideCodeFence = false;
  let codeFenceLines = [];
  const SPECIAL_TOKEN_REGEX =
    /\{\{\s*video\s*:\s*([^}]+)\s*\}\}|\{\{\s*starter\s*:\s*([\s\S]*?)\}\}|\{\{\s*(?:answer|expected)\s*:\s*([\s\S]*?)\}\}/gi;

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push({ type: 'paragraph', text: paragraphLines.join('\n').trim() });
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0 || !listMode) return;
    blocks.push({ type: 'list', mode: listMode, items: listItems });
    listItems = [];
    listMode = '';
  };

  const shouldHidePreviewLine = (lineText) => {
    const base = normalizePreviewLine(lineText);
    if (!base) return false;
    return getPreviewHiddenLinePatterns().some((pattern) => pattern.test(base));
  };

  const extractVideoUrlFromLine = (lineText) => {
    const line = String(lineText || '').trim();
    if (!line) return '';
    const markdownLinkMatch = line.match(/^\[[^\]]+\]\((https?:\/\/[^\s)]+)\)$/i);
    if (markdownLinkMatch?.[1] && isVideoLink(markdownLinkMatch[1])) return markdownLinkMatch[1];
    if (/^https?:\/\/\S+$/i.test(line) && isVideoLink(line)) return line;
    return '';
  };

  const pushParsedCodeFenceContent = (codeText) => {
    const source = String(codeText || '');
    if (!source.trim()) return;
    SPECIAL_TOKEN_REGEX.lastIndex = 0;
    if (!SPECIAL_TOKEN_REGEX.test(source)) {
      blocks.push({ type: 'code', text: source.trimEnd() });
      return;
    }

    SPECIAL_TOKEN_REGEX.lastIndex = 0;
    let lastIndex = 0;
    let match;

    while ((match = SPECIAL_TOKEN_REGEX.exec(source)) !== null) {
      if (match.index > lastIndex) {
        const chunk = source.slice(lastIndex, match.index).trim();
        if (chunk) blocks.push({ type: 'code', text: chunk });
      }

      if (match[1] !== undefined) {
        const videoUrl = String(match[1] || '').trim();
        if (videoUrl) blocks.push({ type: 'video', url: videoUrl });
      } else if (match[2] !== undefined) {
        const starterCode = String(match[2] || '').trim();
        if (starterCode) blocks.push({ type: 'starter', text: starterCode });
      }
      // answer/expected blocks are intentionally hidden in student preview.
      lastIndex = SPECIAL_TOKEN_REGEX.lastIndex;
    }

    if (lastIndex < source.length) {
      const tail = source.slice(lastIndex).trim();
      if (tail) blocks.push({ type: 'code', text: tail });
    }
  };

  const consumeSpecialTokenBlock = (startIndex) => {
    const collectedLines = [];
    let endIndex = startIndex;
    let closed = false;

    for (let cursor = startIndex; cursor < lines.length; cursor += 1) {
      const rawLine = String(lines[cursor] || '');
      collectedLines.push(rawLine);
      endIndex = cursor;
      if (rawLine.includes('}}')) {
        closed = true;
        break;
      }
    }

    if (!closed) return { consumed: false, endIndex: startIndex };

    const tokenSource = collectedLines.join('\n');
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
      // answer/expected blocks are intentionally hidden in student preview.
    }

    return { consumed: matched, endIndex };
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const value = String(line || '').trimEnd();
    const trimmed = value.trim();
    if (!insideCodeFence && /^```/.test(trimmed) && trimmed.length > 6 && trimmed.lastIndexOf('```') > 0) {
      const firstFenceIndex = trimmed.indexOf('```');
      const lastFenceIndex = trimmed.lastIndexOf('```');
      if (lastFenceIndex > firstFenceIndex) {
        const inlineCode = trimmed.slice(firstFenceIndex + 3, lastFenceIndex).trim();
        if (inlineCode) {
          flushParagraph();
          flushList();
          pushParsedCodeFenceContent(inlineCode);
          continue;
        }
      }
    }
    if (/^```/.test(trimmed)) {
      flushParagraph();
      flushList();
      insideCodeFence = !insideCodeFence;
      if (!insideCodeFence) {
        const codeValue = codeFenceLines.join('\n').trimEnd();
        pushParsedCodeFenceContent(codeValue);
        codeFenceLines = [];
      }
      continue;
    }
    if (insideCodeFence) {
      codeFenceLines.push(String(line || ''));
      continue;
    }
    if (/^\{\{/.test(trimmed)) {
      flushParagraph();
      flushList();
      const tokenResult = consumeSpecialTokenBlock(index);
      if (tokenResult.consumed) {
        index = Math.max(tokenResult.endIndex, index);
        continue;
      }
    }
    if (!trimmed) {
      flushParagraph();
      flushList();
      continue;
    }
    const codeContentMatch = normalizePreviewLine(trimmed).match(/^code\s*content\s*:\s*(.*)$/i);
    if (codeContentMatch) {
      flushParagraph();
      flushList();
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
          getPreviewHiddenLinePatterns().some((pattern) => pattern.test(nextNormalized)) &&
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
    if (shouldHidePreviewLine(trimmed)) continue;

    const inlineVideoUrl = extractVideoUrlFromLine(trimmed);
    if (inlineVideoUrl) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'video', url: inlineVideoUrl });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      if (listMode !== 'unordered') {
        flushList();
        listMode = 'unordered';
      }
      listItems.push(bulletMatch[1].trim());
      continue;
    }

    const numberedMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numberedMatch) {
      flushParagraph();
      if (listMode !== 'ordered') {
        flushList();
        listMode = 'ordered';
      }
      listItems.push(numberedMatch[1].trim());
      continue;
    }

    flushList();
    paragraphLines.push(value);
  }

  flushParagraph();
  flushList();
  if (insideCodeFence && codeFenceLines.length > 0) {
    pushParsedCodeFenceContent(codeFenceLines.join('\n').trimEnd());
  }
  return blocks;
};

const splitSimpleArgs = (source) => {
  const text = String(source || '');
  if (!text.trim()) return [];
  const parts = [];
  let current = '';
  let quote = '';
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const prev = i > 0 ? text[i - 1] : '';
    if ((ch === '"' || ch === "'") && prev !== '\\') {
      if (!quote) {
        quote = ch;
      } else if (quote === ch) {
        quote = '';
      }
      current += ch;
      continue;
    }
    if (ch === ',' && !quote) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
};

const parseSimplePythonLiteral = (expr, vars) => {
  const value = String(expr || '').trim();
  if (!value) return '';

  const stringMatch = value.match(/^(['"])([\s\S]*)\1$/);
  if (stringMatch) {
    return String(stringMatch[2] || '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");
  }

  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (Object.prototype.hasOwnProperty.call(vars, value)) return vars[value];
  return value;
};

const runSimplePythonPreview = (code) => {
  const lines = String(code || '').replace(/\r\n/g, '\n').split('\n');
  const vars = {};
  const output = [];

  for (let index = 0; index < lines.length; index += 1) {
    const raw = String(lines[index] || '');
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;

    const assignmentMatch = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
    if (assignmentMatch) {
      vars[assignmentMatch[1]] = parseSimplePythonLiteral(assignmentMatch[2], vars);
      continue;
    }

    const printMatch = line.match(/^print\s*\(([\s\S]*)\)\s*$/);
    if (printMatch) {
      const args = splitSimpleArgs(printMatch[1]);
      const rendered = args.map((arg) => parseSimplePythonLiteral(arg, vars));
      output.push(rendered.map((item) => String(item)).join(' '));
      continue;
    }

    throw new Error(`Unsupported statement on line ${index + 1}.`);
  }

  return output.join('\n') || 'Done';
};

let OptionalWebView = null;
try {
  OptionalWebView = require('react-native-webview')?.WebView || null;
} catch {
  OptionalWebView = null;
}

const runSimpleJavaScriptPreview = (code) => {
  const logs = [];
  const consoleProxy = {
    log: (...args) => logs.push(args.map(String).join(' ')),
    error: (...args) => logs.push(args.map(String).join(' ')),
    warn: (...args) => logs.push(args.map(String).join(' ')),
  };
  const fn = new Function('console', String(code || ''));
  fn(consoleProxy);
  return logs.join('\n') || 'Done';
};

const getLiveEditorTitle = (language) => {
  const lang = String(language || 'python').toLowerCase();
  if (lang === 'javascript') return 'Live JavaScript Editor';
  if (lang === 'html_css') return 'Live HTML/CSS Preview';
  return 'Live Python Editor';
};

const buildHtmlPreviewDocument = (code) => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>body{font-family:Arial,sans-serif;padding:12px;}</style>
  </head>
  <body>
${String(code || '')}
  </body>
</html>`;

const getYouTubeVideoId = (url) => {
  const value = String(url || '').trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{6,})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/,
  ];
  for (let index = 0; index < patterns.length; index += 1) {
    const match = value.match(patterns[index]);
    if (match?.[1]) return match[1];
  }
  return '';
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

function DataListPage({
  title,
  endpoint,
  apiFetch,
  listKey,
  renderItem,
  theme,
  showExtraRows = true,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data?.error ? ` (${data.error})` : '';
        throw new Error((data?.message || `Failed to load ${title}`) + detail);
      }
      const list = Array.isArray(data?.[listKey]) ? data[listKey] : [];
      setItems(list);
    } catch (err) {
      setError(err?.message || `Failed to load ${title}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [endpoint]);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>{title}</Text>
      </View>
      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading && !error && items.length === 0 ? <Text style={portalStyles.empty}>No records.</Text> : null}
      {!loading &&
        items.map((item, idx) => (
          <View
            key={item?.id || `${title}-${idx}`}
            style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
          >
            {renderItem(item)}
            {showExtraRows
              ? buildExtraRows(item).map((row) => (
                  <Text
                    key={`${row.label}-${row.value}`}
                    style={[portalStyles.listItemMeta, { color: theme.textMuted }]}
                  >
                    {row.label}: {row.value}
                  </Text>
                ))
              : null}
          </View>
        ))}
    </View>
  );
}

function UserCrudPage({
  title,
  entityLabel,
  endpoint,
  listKey,
  itemKey,
  apiFetch,
  theme,
  deleteFailureFallback,
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalError, setModalError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    fullName: '',
    email: '',
    password: '',
    status: 'active',
  });

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch(endpoint, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || `Failed to load ${title.toLowerCase()}`);
      setItems(Array.isArray(data?.[listKey]) ? data[listKey] : []);
    } catch (err) {
      setError(err?.message || `Failed to load ${title.toLowerCase()}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debug marker to verify the new CRUD screen is mounted (visible in Metro logs).
    // eslint-disable-next-line no-console
    console.log(`[Admin CRUD] mounted ${title} -> ${endpoint}`);
    load();
  }, [apiFetch, endpoint, listKey, title]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      const name = String(item?.fullName || '').toLowerCase();
      const email = String(item?.email || '').toLowerCase();
      const status = String(item?.status || '').toLowerCase();
      const matchesQuery = !query || name.includes(query) || email.includes(query);
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [items, searchQuery, statusFilter]);

  const openAddModal = () => {
    setModalMode('add');
    setFormData({
      id: '',
      fullName: '',
      email: '',
      password: '',
      status: 'active',
    });
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setFormData({
      id: String(item?.id || ''),
      fullName: String(item?.fullName || ''),
      email: String(item?.email || ''),
      password: '',
      status: String(item?.status || 'active'),
    });
    setModalError('');
    setModalOpen(true);
  };

  const openDeleteModal = (item) => {
    setItemToDelete(item);
    setDeleteError('');
  };

  const closeDeleteModal = () => {
    setItemToDelete(null);
    setDeleteError('');
  };

  const closeModal = () => {
    if (submitting) return;
    setModalOpen(false);
    setModalError('');
  };

  const handleSubmit = async () => {
    setModalError('');
    const fullName = formData.fullName.trim();
    const email = formData.email.trim();
    const password = formData.password.trim();
    const status = formData.status === 'inactive' ? 'inactive' : 'active';

    if (!fullName || !email) {
      setModalError('Full name and email are required.');
      return;
    }
    if (modalMode === 'add' && !password) {
      setModalError('Password is required for new records.');
      return;
    }

    try {
      setSubmitting(true);
      const body =
        modalMode === 'add'
          ? { fullName, email, password, status }
          : { id: formData.id, fullName, email, status };
      const res = await apiFetch(endpoint, {
        method: modalMode === 'add' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message ||
            `Failed to ${modalMode === 'add' ? 'add' : 'update'} ${entityLabel.toLowerCase()}`
        );
      }

      const nextItem = data?.[itemKey];
      if (modalMode === 'add' && nextItem) {
        setItems((prev) => [nextItem, ...prev]);
      } else if (modalMode === 'edit' && nextItem) {
        setItems((prev) => prev.map((item) => (item.id === formData.id ? nextItem : item)));
      } else {
        await load();
      }

      setModalOpen(false);
      setFormData({
        id: '',
        fullName: '',
        email: '',
        password: '',
        status: 'active',
      });
    } catch (err) {
      setModalError(err?.message || 'Server connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete?.id) return;
    try {
      setDeleting(true);
      setDeleteError('');
      const res = await apiFetch(endpoint, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: itemToDelete.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || deleteFailureFallback);
      }
      setItems((prev) => prev.filter((item) => item.id !== itemToDelete.id));
      closeDeleteModal();
    } catch (err) {
      setDeleteError(err?.message || deleteFailureFallback);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>{title}</Text>
      </View>

      <View
        style={[
          portalStyles.listCard,
          {
            backgroundColor: theme.cardBg,
            borderColor: theme.cardBorder,
            gap: 8,
            paddingVertical: 12,
          },
        ]}
      >
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${entityLabel.toLowerCase()}s by name or email...`}
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
        />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <Pressable
            onPress={() => setStatusFilter('all')}
            style={[
              portalStyles.secondaryBtn,
              statusFilter === 'all' && { backgroundColor: '#bfdbfe' },
            ]}
          >
            <Text style={portalStyles.secondaryBtnText}>All</Text>
          </Pressable>
          <Pressable
            onPress={() => setStatusFilter('active')}
            style={[
              portalStyles.secondaryBtn,
              statusFilter === 'active' && { backgroundColor: '#bbf7d0' },
            ]}
          >
            <Text style={portalStyles.secondaryBtnText}>Active</Text>
          </Pressable>
          <Pressable
            onPress={() => setStatusFilter('inactive')}
            style={[
              portalStyles.secondaryBtn,
              statusFilter === 'inactive' && { backgroundColor: '#fecaca' },
            ]}
          >
            <Text style={portalStyles.secondaryBtnText}>Inactive</Text>
          </Pressable>
          <View style={{ flex: 1, minWidth: 8 }} />
          <Pressable onPress={openAddModal} style={portalStyles.chatSendBtn}>
            <Text style={portalStyles.chatSendText}>Add {entityLabel}</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading && filteredItems.length === 0 ? (
        <Text style={portalStyles.empty}>No {entityLabel.toLowerCase()}s found.</Text>
      ) : null}

      {!loading &&
        filteredItems.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => openEditModal(item)}
            style={[
              portalStyles.listCard,
              {
                backgroundColor: theme.cardBg,
                borderColor: theme.cardBorder,
                gap: 6,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
                {item.fullName}
              </Text>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor:
                    String(item.status || '').toLowerCase() === 'active' ? '#dcfce7' : '#fee2e2',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color:
                      String(item.status || '').toLowerCase() === 'active' ? '#166534' : '#b91c1c',
                  }}
                >
                  {String(item.status || 'inactive')}
                </Text>
              </View>
            </View>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]} numberOfLines={1}>
              {item.email}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Registration: {item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-US') : '-'}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted, fontStyle: 'italic' }]}>
              Tap card to edit
            </Text>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
              <Pressable style={portalStyles.secondaryBtn} onPress={() => openEditModal(item)}>
                <Text style={portalStyles.secondaryBtnText}>Edit</Text>
              </Pressable>
              <Pressable
                style={[portalStyles.notificationActionBtn, { backgroundColor: '#fee2e2' }]}
                onPress={() => openDeleteModal(item)}
              >
                <Text style={[portalStyles.notificationActionText, { color: '#b91c1c' }]}>Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        ))}

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={portalStyles.dialogOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={portalStyles.dialogOverlayTouch} onPress={closeModal} />
          <View
            style={[
              portalStyles.dialogCard,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <ScrollView
              style={portalStyles.dialogScroll}
              contentContainerStyle={portalStyles.dialogContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <View style={portalStyles.modalHandle} />
              <View style={portalStyles.modalSheetHeader}>
                <Text style={[portalStyles.modalSheetTitle, { color: theme.textPrimary }]}>
                  {modalMode === 'add' ? `Add ${entityLabel}` : `Edit ${entityLabel}`}
                </Text>
                <Text style={[portalStyles.modalSheetSubtitle, { color: theme.textMuted }]}>
                  {modalMode === 'add'
                    ? `Create a new ${entityLabel.toLowerCase()} account`
                    : `Update ${entityLabel.toLowerCase()} details`}
                </Text>
              </View>

              {modalError ? <Text style={portalStyles.error}>{modalError}</Text> : null}

              <TextInput
                value={formData.fullName}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, fullName: text }))}
                placeholder="Full name"
                placeholderTextColor="#94a3b8"
                style={portalStyles.input}
              />
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData((prev) => ({ ...prev, email: text }))}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
                style={portalStyles.input}
              />
              {modalMode === 'add' ? (
                <TextInput
                  value={formData.password}
                  onChangeText={(text) => setFormData((prev) => ({ ...prev, password: text }))}
                  placeholder="Password"
                  secureTextEntry
                  placeholderTextColor="#94a3b8"
                  style={portalStyles.input}
                />
              ) : null}

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  onPress={() => setFormData((prev) => ({ ...prev, status: 'active' }))}
                  style={[
                    portalStyles.secondaryBtn,
                    formData.status === 'active' && { backgroundColor: '#bbf7d0' },
                  ]}
                >
                  <Text style={portalStyles.secondaryBtnText}>Active</Text>
                </Pressable>
                <Pressable
                  onPress={() => setFormData((prev) => ({ ...prev, status: 'inactive' }))}
                  style={[
                    portalStyles.secondaryBtn,
                    formData.status === 'inactive' && { backgroundColor: '#fecaca' },
                  ]}
                >
                  <Text style={portalStyles.secondaryBtnText}>Inactive</Text>
                </Pressable>
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={portalStyles.secondaryBtn} onPress={closeModal}>
                  <Text style={portalStyles.secondaryBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={portalStyles.chatSendBtn}
                  onPress={handleSubmit}
                  disabled={submitting}
                >
                  <Text style={portalStyles.chatSendText}>
                    {submitting
                      ? 'Saving...'
                      : modalMode === 'add'
                      ? `Add ${entityLabel}`
                      : 'Save Changes'}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={Boolean(itemToDelete)}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={closeDeleteModal}
      >
        <View style={portalStyles.dialogOverlay}>
          <Pressable style={portalStyles.dialogOverlayTouch} onPress={closeDeleteModal} />
          <View
            style={[
              portalStyles.dialogCard,
              portalStyles.dialogCardCompact,
              { backgroundColor: theme.cardBg, borderColor: theme.cardBorder },
            ]}
          >
            <View style={portalStyles.dialogContent}>
              <Text style={[portalStyles.modalSheetTitle, { color: theme.textPrimary }]}>Confirm Delete</Text>
              <Text style={[portalStyles.modalSheetSubtitle, { color: theme.textMuted }]}>
                Delete {itemToDelete?.fullName}?
              </Text>
              {deleteError ? <Text style={portalStyles.error}>{deleteError}</Text> : null}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable style={portalStyles.secondaryBtn} onPress={closeDeleteModal}>
                  <Text style={portalStyles.secondaryBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[portalStyles.notificationActionBtn, { backgroundColor: '#fee2e2' }]}
                  onPress={handleDelete}
                  disabled={deleting}
                >
                  <Text style={[portalStyles.notificationActionText, { color: '#b91c1c' }]}>
                    {deleting ? 'Deleting...' : `Delete ${entityLabel}`}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function RevenueTrendPage({ apiFetch, theme }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trend, setTrend] = useState([]);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch('/api/dashboard/revenue-trend', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load revenue trend');
      setTrend(Array.isArray(data?.trend) ? data.trend : []);
    } catch (err) {
      setError(err?.message || 'Failed to load revenue trend');
      setTrend([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const total = trend.reduce((sum, t) => sum + Number(t?.revenue || 0), 0);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Revenue Trend</Text>
      </View>
      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading ? (
        <SectionCard title="Last 12 weeks" theme={theme}>
          {trend.length === 0 ? <Text style={portalStyles.empty}>No data.</Text> : <RevenueAreaChart trend={trend} />}
          <View style={portalStyles.trendFooter}>
            <Text style={portalStyles.trendFooterLabel}>12-week total</Text>
            <Text style={portalStyles.trendFooterValue}>${total.toFixed(2)}</Text>
          </View>
        </SectionCard>
      ) : null}
    </View>
  );
}

function AdminCoursesPage({ apiFetch, theme, onNavigateFeature = () => {} }) {
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bulkSaving, setBulkSaving] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [expandedCourseId, setExpandedCourseId] = useState('');
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseModalMode, setCourseModalMode] = useState('create');
  const [courseSubmitting, setCourseSubmitting] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentCourseId, setContentCourseId] = useState('');
  const [contentCourseTitle, setContentCourseTitle] = useState('');
  const [contentModules, setContentModules] = useState([]);
  const [expandedManageModuleIds, setExpandedManageModuleIds] = useState({});
  const [contentViewMode, setContentViewMode] = useState('preview');
  const lastContentAutoRefreshAtRef = useRef(0);
  const [previewLiveEditorByLesson, setPreviewLiveEditorByLesson] = useState({});
  const [selectedLessonId, setSelectedLessonId] = useState('');
  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [moduleSubmitting, setModuleSubmitting] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState('');
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonSubmitting, setLessonSubmitting] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState('');
  const [lessonForm, setLessonForm] = useState({
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
  const [courseForm, setCourseForm] = useState({
    id: '',
    title: '',
    description: '',
    teacherId: '',
    price: '0',
    durationWeeks: '4',
    teacherSharePct: '70',
    status: 'draft',
  });

  const fetchCourses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/courses', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load courses');
      const next = Array.isArray(data?.courses) ? data.courses : [];
      setCourses(next);
      setSelectedCourseIds((prev) => prev.filter((id) => next.some((course) => course.id === id)));
    } catch (err) {
      setError(err?.message || 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiFetch('/api/categories', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setCategories(Array.isArray(data?.categories) ? data.categories : []);
      }
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchCategories();
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await apiFetch('/api/teachers/list', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setTeachers(Array.isArray(data?.teachers) ? data.teachers : []);
      }
    } catch {
      setTeachers([]);
    }
  };

  const stats = useMemo(() => {
    const total = courses.length;
    const active = courses.filter((course) => String(course?.status || '').toLowerCase() === 'published').length;
    const totalStudents = courses.reduce((sum, course) => sum + Number(course?.students || 0), 0);
    const revenueMonthlyMock = courses
      .filter((course) => String(course?.status || '').toLowerCase() === 'published')
      .reduce((sum, course) => sum + Number(course?.students || 0) * Number(course?.price || 0), 0);
    return { total, active, totalStudents, revenueMonthlyMock };
  }, [courses]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return courses.filter((course) => {
      const status = String(course?.status || 'draft').toLowerCase();
      const statusMatches = statusFilter === 'all' || status === statusFilter;
      if (!statusMatches) return false;
      if (!normalizedQuery) return true;

      const hay = [course?.title, course?.teacherName, course?.categoryName, course?.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [courses, query, statusFilter]);

  const statusFilterLabel =
    statusFilter === 'all'
      ? 'All'
      : statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((course) => selectedCourseIds.includes(course.id));

  const toggleCourseSelection = (courseId) => {
    setSelectedCourseIds((prev) => (prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]));
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedCourseIds((prev) => prev.filter((id) => !filtered.some((course) => course.id === id)));
      return;
    }
    setSelectedCourseIds((prev) => [...new Set([...prev, ...filtered.map((course) => course.id)])]);
  };

  const handleDeleteCourse = async (course) => {
    const confirmed = await new Promise((resolve) => {
      Alert.alert('Delete course', `Delete "${course?.title || 'this course'}"?`, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ], { cancelable: true, onDismiss: () => resolve(false) });
    });
    if (!confirmed) return;

    try {
      setDeletingId(String(course?.id || ''));
      const res = await apiFetch(`/api/courses/${encodeURIComponent(String(course?.id || ''))}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to delete course');
      await fetchCourses();
    } catch (err) {
      setError(err?.message || 'Failed to delete course');
    } finally {
      setDeletingId('');
    }
  };

  const handleBulkCategoryAssign = async () => {
    if (selectedCourseIds.length === 0) {
      setError('Select at least one course first.');
      return;
    }
    try {
      setBulkSaving(true);
      setError('');
      const res = await apiFetch('/api/courses/bulk-category', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseIds: selectedCourseIds,
          categoryId: bulkCategoryId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to assign category');
      await fetchCourses();
      setSelectedCourseIds([]);
    } catch (err) {
      setError(err?.message || 'Failed to assign category');
    } finally {
      setBulkSaving(false);
    }
  };

  const resetCourseForm = () => {
    setCourseForm({
      id: '',
      title: '',
      description: '',
      teacherId: teachers[0]?.id || '',
      price: '0',
      durationWeeks: '4',
      teacherSharePct: '70',
      status: 'draft',
    });
  };

  const openCreateCourseModal = () => {
    setCourseModalMode('create');
    resetCourseForm();
    setCourseModalOpen(true);
  };

  const openEditCourseModal = async (courseId) => {
    try {
      setError('');
      const res = await apiFetch(`/api/courses/${encodeURIComponent(String(courseId))}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load course details');
      const course = data?.course || {};
      setCourseModalMode('edit');
      setCourseForm({
        id: String(course?.id || ''),
        title: String(course?.title || ''),
        description: String(course?.description || ''),
        teacherId: String(course?.teacherId || teachers[0]?.id || ''),
        price: String(Number(course?.price || 0)),
        durationWeeks: String(Number(course?.durationWeeks || 4)),
        teacherSharePct: String(Number(course?.teacherSharePct || 70)),
        status: ['draft', 'published', 'archived'].includes(String(course?.status || ''))
          ? String(course.status)
          : 'draft',
      });
      setCourseModalOpen(true);
    } catch (err) {
      setError(err?.message || 'Failed to load course for edit');
    }
  };

  const handleSaveCourse = async () => {
    const title = String(courseForm.title || '').trim();
    const description = String(courseForm.description || '').trim();
    const teacherId = String(courseForm.teacherId || '').trim();
    if (!title || !description || !teacherId) {
      setError('Title, description, and teacher are required.');
      return;
    }

    try {
      setCourseSubmitting(true);
      setError('');
      const payload = new FormData();
      payload.append('title', title);
      payload.append('description', description);
      payload.append('teacherId', teacherId);
      payload.append('price', String(courseForm.price || '0'));
      payload.append('durationWeeks', String(courseForm.durationWeeks || '4'));
      payload.append('teacherSharePct', String(courseForm.teacherSharePct || '70'));
      payload.append('status', String(courseForm.status || 'draft'));

      const isEdit = courseModalMode === 'edit' && courseForm.id;
      const endpoint = isEdit
        ? `/api/courses/${encodeURIComponent(String(courseForm.id))}`
        : '/api/courses';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await apiFetch(endpoint, {
        method,
        credentials: 'include',
        body: payload,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to save course');

      setCourseModalOpen(false);
      resetCourseForm();
      await fetchCourses();
    } catch (err) {
      setError(err?.message || 'Failed to save course');
    } finally {
      setCourseSubmitting(false);
    }
  };

  const fetchCourseContent = async (courseId, openPage = false) => {
    try {
      setContentLoading(true);
      setError('');
      const targetCourseId = String(courseId || contentCourseId || '').trim();
      if (!targetCourseId) {
        setError('Course ID is missing.');
        return;
      }
      const res = await apiFetch(`/api/courses/${encodeURIComponent(targetCourseId)}/content`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load course content');
      setContentCourseId(targetCourseId);
      setContentCourseTitle(String(data?.course?.title || 'Course Content'));
      const modules = Array.isArray(data?.modules) ? data.modules : [];
      setContentModules(modules);
      setExpandedManageModuleIds((prev) => {
        const next = {};
        modules.forEach((item, index) => {
          const key = String(item?.id || '');
          if (!key) return;
          next[key] = Object.prototype.hasOwnProperty.call(prev, key) ? Boolean(prev[key]) : index === 0;
        });
        return next;
      });
      const firstLesson = modules.flatMap((item) => (Array.isArray(item?.lessons) ? item.lessons : []))[0];
      setSelectedLessonId((prev) => (prev && modules.some((m) => (m?.lessons || []).some((l) => l?.id === prev)) ? prev : String(firstLesson?.id || '')));
      if (openPage) {
        setContentViewMode('preview');
      }
    } catch (err) {
      setError(err?.message || 'Failed to load course content');
    } finally {
      setContentLoading(false);
    }
  };

  const autoRefreshCourseContentIfNeeded = (courseId) => {
    const targetCourseId = String(courseId || contentCourseId || '').trim();
    if (!targetCourseId || contentLoading) return;
    const now = Date.now();
    if (now - lastContentAutoRefreshAtRef.current < 2500) return;
    lastContentAutoRefreshAtRef.current = now;
    fetchCourseContent(targetCourseId, false);
  };

  useEffect(() => {
    if (!contentCourseId) return;
    autoRefreshCourseContentIfNeeded(contentCourseId);
  }, [contentCourseId, contentViewMode]);

  const openContentPage = async (courseId) => {
    await fetchCourseContent(courseId, true);
  };

  const resetModuleForm = () => {
    setEditingModuleId('');
    setModuleForm({ title: '', description: '' });
  };

  const openCreateModuleModal = () => {
    resetModuleForm();
    setModuleModalOpen(true);
  };

  const openEditModuleModal = (moduleItem) => {
    setEditingModuleId(String(moduleItem?.id || ''));
    setModuleForm({
      title: String(moduleItem?.title || ''),
      description: String(moduleItem?.description || ''),
    });
    setModuleModalOpen(true);
  };

  const handleSaveModule = async () => {
    const title = String(moduleForm.title || '').trim();
    if (!title) {
      setError('Module title is required.');
      return;
    }
    if (!contentCourseId && !editingModuleId) {
      setError('Open a course content view first.');
      return;
    }
    try {
      setModuleSubmitting(true);
      setError('');
      const isEditing = Boolean(editingModuleId);
      const endpoint = isEditing
        ? `/api/modules/${encodeURIComponent(editingModuleId)}`
        : `/api/courses/${encodeURIComponent(contentCourseId)}/modules`;
      const res = await apiFetch(endpoint, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description: String(moduleForm.description || '').trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to save module');
      setModuleModalOpen(false);
      resetModuleForm();
      await fetchCourseContent(contentCourseId, false);
    } catch (err) {
      setError(err?.message || 'Failed to save module');
    } finally {
      setModuleSubmitting(false);
    }
  };

  const handleDeleteModule = async (moduleItem) => {
    const confirmed = await new Promise((resolve) => {
      Alert.alert('Delete module', `Delete "${moduleItem?.title || 'this module'}"?`, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ], { cancelable: true, onDismiss: () => resolve(false) });
    });
    if (!confirmed) return;

    try {
      setError('');
      const res = await apiFetch(`/api/modules/${encodeURIComponent(String(moduleItem?.id || ''))}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to delete module');
      await fetchCourseContent(contentCourseId, false);
    } catch (err) {
      setError(err?.message || 'Failed to delete module');
    }
  };

  const resetLessonForm = () => {
    setEditingLessonId('');
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
  };

  const openCreateLessonModal = (moduleId, type = '') => {
    resetLessonForm();
    setLessonForm((prev) => ({
      ...prev,
      moduleId: String(moduleId || ''),
      type: type || prev.type,
    }));
    if (type === 'code_example') {
      setLessonForm((prev) => ({
        ...prev,
        content: prev.content ? `${prev.content}\n\n\`\`\`code\n\n\`\`\`` : '```code\n\n```',
      }));
    }
    if (type === 'video_embed') {
      setLessonForm((prev) => ({
        ...prev,
        content: prev.content ? `${prev.content}\n\n{{video:URL}}` : '{{video:URL}}',
      }));
    }
    setLessonModalOpen(true);
  };

  const openEditLessonModal = (moduleId, lessonItem) => {
    const contentFallbackParts = [];
    if (!lessonItem?.content && lessonItem?.codeContent) {
      contentFallbackParts.push(`\`\`\`code\n${String(lessonItem.codeContent)}\n\`\`\``);
    }
    if (!lessonItem?.content && lessonItem?.videoUrl) {
      contentFallbackParts.push(`{{video:${String(lessonItem.videoUrl)}}}`);
    }
    setEditingLessonId(String(lessonItem?.id || ''));
    setLessonForm({
      moduleId: String(moduleId || ''),
      title: String(lessonItem?.title || ''),
      description: String(lessonItem?.description || ''),
      content: String(lessonItem?.content || contentFallbackParts.join('\n\n')),
      durationMinutes: String(Number(lessonItem?.durationMinutes || 0)),
      isPublished: Boolean(lessonItem?.isPublished),
      type: String(lessonItem?.type || 'text'),
      enableLiveEditor: Boolean(lessonItem?.enableLiveEditor),
      liveEditorLanguage: String(lessonItem?.liveEditorLanguage || 'python'),
    });
    setLessonModalOpen(true);
  };

  const inferLessonType = (textContent) => {
    const source = String(textContent || '');
    const hasText = Boolean(source.trim());
    const hasCode = /```/.test(source);
    const hasVideo = /\{\{\s*video\s*:/i.test(source);

    if ((hasText && hasCode) || (hasVideo && (hasText || hasCode))) return 'mixed';
    if (hasVideo) return 'video_embed';
    if (hasCode && !hasText) return 'code_example';
    return 'text';
  };

  const appendToLessonContent = (snippet) => {
    const value = String(snippet || '').trim();
    if (!value) return;
    setLessonForm((prev) => ({
      ...prev,
      content: prev.content ? `${prev.content}\n\n${value}` : value,
    }));
  };

  const handleSaveLesson = async () => {
    const title = String(lessonForm.title || '').trim();
    const moduleId = String(lessonForm.moduleId || '').trim();
    if (!title) {
      setError('Lesson title is required.');
      return;
    }
    if (!moduleId && !editingLessonId) {
      setError('Module is required.');
      return;
    }
    const computedType = inferLessonType(lessonForm.content || '');
    try {
      setLessonSubmitting(true);
      setError('');
      const isEditing = Boolean(editingLessonId);
      const endpoint = isEditing
        ? `/api/lessons/${encodeURIComponent(editingLessonId)}`
        : `/api/modules/${encodeURIComponent(moduleId)}/lessons`;
      const res = await apiFetch(endpoint, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description: String(lessonForm.description || '').trim() || null,
          content: String(lessonForm.content || '').trim() || null,
          durationMinutes: Number(lessonForm.durationMinutes || 0),
          isPublished: Boolean(lessonForm.isPublished),
          type: computedType,
          enableLiveEditor: Boolean(lessonForm.enableLiveEditor),
          liveEditorLanguage: String(lessonForm.liveEditorLanguage || 'python'),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to save lesson');
      setLessonModalOpen(false);
      resetLessonForm();
      await fetchCourseContent(contentCourseId, false);
    } catch (err) {
      setError(err?.message || 'Failed to save lesson');
    } finally {
      setLessonSubmitting(false);
    }
  };

  const handleDeleteLesson = async (lessonItem) => {
    const confirmed = await new Promise((resolve) => {
      Alert.alert('Delete lesson', `Delete "${lessonItem?.title || 'this lesson'}"?`, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ], { cancelable: true, onDismiss: () => resolve(false) });
    });
    if (!confirmed) return;
    try {
      setError('');
      const res = await apiFetch(`/api/lessons/${encodeURIComponent(String(lessonItem?.id || ''))}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to delete lesson');
      await fetchCourseContent(contentCourseId, false);
    } catch (err) {
      setError(err?.message || 'Failed to delete lesson');
    }
  };

  const togglePublishLesson = async (lessonItem) => {
    try {
      setError('');
      const lessonId = String(lessonItem?.id || '');
      if (!lessonId) return;
      const res = await apiFetch(`/api/lessons/${encodeURIComponent(lessonId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isPublished: !Boolean(lessonItem?.isPublished) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to update lesson');
      await fetchCourseContent(contentCourseId, false);
    } catch (err) {
      setError(err?.message || 'Failed to update lesson');
    }
  };

  const openExternalUrl = async (url) => {
    try {
      const target = String(url || '').trim();
      if (!target) return;
      const canOpen = await Linking.canOpenURL(target);
      if (!canOpen) {
        setError('Cannot open this link on the device.');
        return;
      }
      await Linking.openURL(target);
    } catch (err) {
      setError(err?.message || 'Failed to open link');
    }
  };

  const updatePreviewLiveEditor = (lessonId, patch) => {
    const key = String(lessonId || '');
    if (!key) return;
    setPreviewLiveEditorByLesson((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] || {}),
        ...patch,
      },
    }));
  };

  const runLessonPreviewEditor = (lessonId, language, starterCode = '') => {
    const key = String(lessonId || '');
    if (!key) return;
    const current = previewLiveEditorByLesson[key] || {};
    const codeToRun = String(current.code ?? starterCode ?? '');
    if (!codeToRun.trim()) {
      updatePreviewLiveEditor(key, {
        code: codeToRun,
        output: '',
        error: 'No code to run.',
        hasRun: true,
      });
      return;
    }

    try {
      const normalizedLanguage = String(language || 'python').toLowerCase();
      let output = '';
      if (normalizedLanguage === 'javascript') {
        output = runSimpleJavaScriptPreview(codeToRun);
      } else if (normalizedLanguage === 'html_css') {
        output = 'Preview updated.';
      } else {
        output = runSimplePythonPreview(codeToRun);
      }
      updatePreviewLiveEditor(key, {
        code: codeToRun,
        output,
        error: '',
        hasRun: true,
      });
    } catch (runErr) {
      updatePreviewLiveEditor(key, {
        code: codeToRun,
        output: '',
        error: runErr?.message || 'Failed to run code.',
        hasRun: true,
      });
    }
  };

  const renderInlineText = (text, baseStyle, keyPrefix) => {
    const segments = extractInlineSegments(text);
    return (
      <Text style={baseStyle}>
        {segments.map((segment, index) =>
          segment.type === 'link' ? (
            <Text
              key={`${keyPrefix}-link-${index}`}
              style={[baseStyle, { color: '#2563eb', textDecorationLine: 'underline' }]}
              onPress={() => openExternalUrl(segment.url)}
            >
              {segment.label}
            </Text>
          ) : (
            <Text key={`${keyPrefix}-text-${index}`} style={baseStyle}>
              {segment.value}
            </Text>
          )
        )}
      </Text>
    );
  };

  if (contentCourseId) {
    const allContentLessons = contentModules.flatMap((moduleItem) =>
      (Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : []).map((lessonItem) => ({
        ...lessonItem,
        moduleId: moduleItem?.id,
        moduleTitle: moduleItem?.title,
      }))
    );
    const activeLesson =
      allContentLessons.find((lessonItem) => String(lessonItem?.id) === String(selectedLessonId)) ||
      allContentLessons[0] ||
      null;
    const lessonContentText = String(activeLesson?.content || '');
    const lessonBlocks = toContentBlocks(lessonContentText || activeLesson?.codeContent || '');
    const lessonPreviewMeta = parseLessonPreviewMeta(lessonContentText);
    const safeLessonBlocks = Array.isArray(lessonBlocks) ? lessonBlocks : [];
    const starterBlocks = safeLessonBlocks.filter((block) => block?.type === 'starter');
    const starterCodeFromBlock = String(starterBlocks[0]?.text || '').trim();
    const hasStarterBlock = starterBlocks.length > 0;
    const fallbackCodeContent = String(
      starterCodeFromBlock || lessonPreviewMeta.codeContent || activeLesson?.codeContent || ''
    ).trim();
    const effectiveLiveEditorEnabled =
      typeof lessonPreviewMeta.enableLiveEditor === 'boolean'
        ? lessonPreviewMeta.enableLiveEditor
        : Boolean(activeLesson?.enableLiveEditor);
    const effectiveLiveEditorLanguage = String(
      lessonPreviewMeta.liveEditorLanguage || activeLesson?.liveEditorLanguage || 'python'
    ).toLowerCase();
    const liveEditorTitle = getLiveEditorTitle(effectiveLiveEditorLanguage);
    const isHtmlPreviewLanguage = effectiveLiveEditorLanguage === 'html_css';
    const lessonPreviewKey = String(activeLesson?.id || '');
    const liveEditorState = previewLiveEditorByLesson[lessonPreviewKey] || {};
    const liveEditorCode = String(liveEditorState.code ?? fallbackCodeContent);
    const liveEditorOutput = String(liveEditorState.output || '');
    const liveEditorError = String(liveEditorState.error || '');
    const shouldShowTopLevelLiveEditor =
      effectiveLiveEditorEnabled && !hasStarterBlock && Boolean(fallbackCodeContent);
    const standaloneVideoUrl = String(activeLesson?.videoUrl || '').trim();
    const hasStandaloneVideoInBlocks = safeLessonBlocks.some(
      (block) => block?.type === 'video' && String(block?.url || '') === standaloneVideoUrl
    );

    return (
      <View style={portalStyles.adminWrap}>
        <View style={portalStyles.adminHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>
              {contentCourseTitle || 'Course Content'}
            </Text>
            <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
              Course content page (mobile)
            </Text>
          </View>
          <Pressable
            style={portalStyles.secondaryBtn}
            onPress={() => {
              setContentCourseId('');
              setContentCourseTitle('');
              setContentModules([]);
              setSelectedLessonId('');
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textPrimary} />
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Pressable
            style={[portalStyles.secondaryBtn, contentViewMode === 'preview' && portalStyles.financeFilterActive]}
            onPress={() => {
              setContentViewMode('preview');
              autoRefreshCourseContentIfNeeded(contentCourseId);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="eye-outline" size={14} color={theme.textPrimary} />
              <Text style={portalStyles.secondaryBtnText}>Student Preview</Text>
            </View>
          </Pressable>
          <Pressable
            style={[portalStyles.secondaryBtn, contentViewMode === 'manage' && portalStyles.financeFilterActive]}
            onPress={() => {
              setContentViewMode('manage');
              autoRefreshCourseContentIfNeeded(contentCourseId);
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="cog-outline" size={14} color={theme.textPrimary} />
              <Text style={portalStyles.secondaryBtnText}>Manage</Text>
            </View>
          </Pressable>
          <Pressable style={portalStyles.chatSendBtn} onPress={openCreateModuleModal}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="folder-plus-outline" size={14} color="#ffffff" />
              <Text style={portalStyles.chatSendText}>Add Module</Text>
            </View>
          </Pressable>
        </View>

        {error ? <Text style={portalStyles.error}>{error}</Text> : null}
        {contentLoading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

        {contentViewMode === 'preview' ? (
          <>
            {allContentLessons.length === 0 ? (
              <Text style={[portalStyles.empty, { color: theme.textMuted }]}>No lessons found.</Text>
            ) : null}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 4, paddingRight: 12 }}>
                {allContentLessons.map((lessonItem, lessonIndex) => (
                  <Pressable
                    key={lessonItem?.id || `preview-lesson-${lessonIndex}`}
                    onPress={() => setSelectedLessonId(String(lessonItem?.id || ''))}
                    style={[
                      portalStyles.secondaryBtn,
                      String(activeLesson?.id || '') === String(lessonItem?.id || '') &&
                        portalStyles.financeFilterActive,
                    ]}
                  >
                    <Text style={portalStyles.secondaryBtnText} numberOfLines={1}>
                      {lessonItem?.title || `Lesson ${lessonIndex + 1}`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {activeLesson ? (
              <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 6 }]}>
                <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                  {activeLesson?.title || 'Untitled lesson'}
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Module: {activeLesson?.moduleTitle || '-'}
                </Text>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Duration: {Number(activeLesson?.durationMinutes || 0)} min | Published: {activeLesson?.isPublished ? 'Yes' : 'No'}
                </Text>
                {activeLesson?.description ? (
                  renderInlineText(
                    String(activeLesson.description),
                    [portalStyles.listItemMeta, { color: theme.textMuted }],
                    'lesson-description'
                  )
                ) : null}
                {shouldShowTopLevelLiveEditor ? (
                  <View
                    style={[
                      portalStyles.listCard,
                      { backgroundColor: theme.pageBg, borderColor: theme.cardBorder, padding: 12, gap: 8, marginTop: 4 },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[portalStyles.listItemMeta, { color: theme.textMuted, textTransform: 'uppercase' }]}>
                        {liveEditorTitle}
                      </Text>
                      {!isHtmlPreviewLanguage ? (
                        <Pressable
                          style={[portalStyles.secondaryBtn, { paddingVertical: 6, paddingHorizontal: 14 }]}
                          onPress={() =>
                            runLessonPreviewEditor(lessonPreviewKey, effectiveLiveEditorLanguage, fallbackCodeContent)
                          }
                        >
                          <Text style={portalStyles.secondaryBtnText}>Run</Text>
                        </Pressable>
                      ) : null}
                    </View>
                    <TextInput
                      multiline
                      value={liveEditorCode}
                      onChangeText={(text) =>
                        updatePreviewLiveEditor(lessonPreviewKey, { code: text, hasRun: false, error: '' })
                      }
                      placeholder="Write Python code..."
                      placeholderTextColor="#94a3b8"
                      style={[
                        portalStyles.input,
                        {
                          minHeight: 130,
                          textAlignVertical: 'top',
                          fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
                          color: theme.textPrimary,
                          backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc',
                          borderColor: theme.cardBorder,
                        },
                      ]}
                    />
                    {isHtmlPreviewLanguage ? (
                      OptionalWebView ? (
                        <View
                          style={{
                            borderWidth: 1,
                            borderColor: theme.cardBorder,
                            borderRadius: 10,
                            overflow: 'hidden',
                            backgroundColor: '#ffffff',
                            minHeight: 180,
                          }}
                        >
                          <OptionalWebView
                            source={{ html: buildHtmlPreviewDocument(liveEditorCode) }}
                            originWhitelist={['*']}
                            style={{ height: 220, backgroundColor: '#ffffff' }}
                          />
                        </View>
                      ) : (
                        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                          Install `react-native-webview` to enable rendered HTML preview on mobile.
                        </Text>
                      )
                    ) : (
                      <>
                        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Output</Text>
                        <View
                          style={{
                            borderWidth: 1,
                            borderColor: liveEditorError ? '#fecaca' : theme.cardBorder,
                            borderRadius: 10,
                            backgroundColor: liveEditorError ? '#fff1f2' : theme.isDark ? '#0f172a' : '#f8fafc',
                            padding: 10,
                          }}
                        >
                          <Text
                            selectable
                            style={{
                              fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
                              color: liveEditorError ? '#b91c1c' : theme.textPrimary,
                            }}
                          >
                            {liveEditorError || liveEditorOutput || 'No output yet.'}
                          </Text>
                        </View>
                      </>
                    )}
                  </View>
                ) : null}
                {standaloneVideoUrl && isVideoLink(standaloneVideoUrl) && !hasStandaloneVideoInBlocks ? (
                  <Pressable
                    onPress={() => openExternalUrl(standaloneVideoUrl)}
                    style={[
                      portalStyles.listCard,
                      { backgroundColor: theme.pageBg, borderColor: theme.cardBorder, padding: 10, gap: 6, marginTop: 4 },
                    ]}
                  >
                    {getYouTubeVideoId(standaloneVideoUrl) ? (
                      <Image
                        source={{ uri: `https://img.youtube.com/vi/${getYouTubeVideoId(standaloneVideoUrl)}/hqdefault.jpg` }}
                        style={{ width: '100%', height: 150, borderRadius: 8, backgroundColor: '#cbd5e1' }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '700' }]}>
                      Open Video
                    </Text>
                    <Text style={[portalStyles.listItemMeta, { color: '#2563eb', textDecorationLine: 'underline' }]}>
                      {standaloneVideoUrl}
                    </Text>
                  </Pressable>
                ) : null}
                {safeLessonBlocks.length > 0 ? (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    {safeLessonBlocks.map((block, blockIndex) => {
                      if (block.type === 'video') {
                        const youtubeId = getYouTubeVideoId(block.url);
                        const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '';
                        return (
                          <Pressable
                            key={`block-video-${blockIndex}`}
                            onPress={() => openExternalUrl(block.url)}
                            style={[
                              portalStyles.listCard,
                              { backgroundColor: theme.pageBg, borderColor: theme.cardBorder, padding: 10, gap: 6 },
                            ]}
                          >
                            {thumbnailUrl ? (
                              <Image
                                source={{ uri: thumbnailUrl }}
                                style={{ width: '100%', height: 150, borderRadius: 8, backgroundColor: '#cbd5e1' }}
                                resizeMode="cover"
                              />
                            ) : null}
                            <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '700' }]}>
                              Open Video
                            </Text>
                            <Text style={[portalStyles.listItemMeta, { color: '#2563eb', textDecorationLine: 'underline' }]}>
                              {block.url}
                            </Text>
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
                          <ScrollView
                            key={`code-${blockIndex}`}
                            horizontal
                            nestedScrollEnabled
                            style={{
                              borderRadius: 8,
                              borderWidth: 1,
                              borderColor: theme.cardBorder,
                              backgroundColor: theme.isDark ? '#020617' : '#0f172a',
                              maxHeight: 240,
                            }}
                            contentContainerStyle={{ padding: 10, minWidth: '100%' }}
                            showsHorizontalScrollIndicator
                          >
                            <Text
                              selectable
                              style={{
                                color: '#e2e8f0',
                                fontFamily: Platform.select({
                                  ios: 'Menlo',
                                  android: 'monospace',
                                  default: 'monospace',
                                }),
                                lineHeight: 20,
                                fontSize: 13,
                              }}
                            >
                              {block.text}
                            </Text>
                          </ScrollView>
                        );
                      }
                      if (block.type === 'starter') {
                        const starterCode = String(block.text || '').trim();
                        const starterEditorCode = String(liveEditorState.code ?? starterCode);
                        return (
                          <View
                            key={`starter-${blockIndex}`}
                            style={[
                              portalStyles.listCard,
                              { backgroundColor: theme.pageBg, borderColor: theme.cardBorder, padding: 10, gap: 6 },
                            ]}
                          >
                            {!effectiveLiveEditorEnabled ? (
                              <>
                                <Text style={[portalStyles.listItemMeta, { color: '#b45309', fontWeight: '700' }]}>
                                  Live editor is disabled for this lesson.
                                </Text>
                                <ScrollView
                                  horizontal
                                  nestedScrollEnabled
                                  style={{
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: theme.cardBorder,
                                    backgroundColor: theme.isDark ? '#020617' : '#0f172a',
                                    maxHeight: 240,
                                  }}
                                  contentContainerStyle={{ padding: 10, minWidth: '100%' }}
                                  showsHorizontalScrollIndicator
                                >
                                  <Text
                                    selectable
                                    style={{
                                      color: '#e2e8f0',
                                      fontFamily: Platform.select({
                                        ios: 'Menlo',
                                        android: 'monospace',
                                        default: 'monospace',
                                      }),
                                      lineHeight: 20,
                                      fontSize: 13,
                                    }}
                                  >
                                    {starterCode}
                                  </Text>
                                </ScrollView>
                              </>
                            ) : (
                              <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted, textTransform: 'uppercase' }]}>
                                    {liveEditorTitle}
                                  </Text>
                                  {!isHtmlPreviewLanguage ? (
                                    <Pressable
                                      style={[portalStyles.secondaryBtn, { paddingVertical: 6, paddingHorizontal: 14 }]}
                                      onPress={() =>
                                        runLessonPreviewEditor(
                                          lessonPreviewKey,
                                          effectiveLiveEditorLanguage,
                                          starterCode
                                        )
                                      }
                                    >
                                      <Text style={portalStyles.secondaryBtnText}>Run</Text>
                                    </Pressable>
                                  ) : null}
                                </View>
                                <TextInput
                                  multiline
                                  value={starterEditorCode}
                                  onChangeText={(text) =>
                                    updatePreviewLiveEditor(lessonPreviewKey, { code: text, hasRun: false, error: '' })
                                  }
                                  placeholder="Write Python code..."
                                  placeholderTextColor="#94a3b8"
                                  style={[
                                    portalStyles.input,
                                    {
                                      minHeight: 130,
                                      textAlignVertical: 'top',
                                      fontFamily: Platform.select({
                                        ios: 'Menlo',
                                        android: 'monospace',
                                        default: 'monospace',
                                      }),
                                      color: theme.textPrimary,
                                      backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc',
                                      borderColor: theme.cardBorder,
                                    },
                                  ]}
                                />
                                {isHtmlPreviewLanguage ? (
                                  OptionalWebView ? (
                                    <View
                                      style={{
                                        borderWidth: 1,
                                        borderColor: theme.cardBorder,
                                        borderRadius: 10,
                                        overflow: 'hidden',
                                        backgroundColor: '#ffffff',
                                        minHeight: 180,
                                      }}
                                    >
                                      <OptionalWebView
                                        source={{ html: buildHtmlPreviewDocument(starterEditorCode) }}
                                        originWhitelist={['*']}
                                        style={{ height: 220, backgroundColor: '#ffffff' }}
                                      />
                                    </View>
                                  ) : (
                                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                                      Install `react-native-webview` to enable rendered HTML preview on mobile.
                                    </Text>
                                  )
                                ) : (
                                  <>
                                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>Output</Text>
                                    <View
                                      style={{
                                        borderWidth: 1,
                                        borderColor: liveEditorError ? '#fecaca' : theme.cardBorder,
                                        borderRadius: 10,
                                        backgroundColor: liveEditorError ? '#fff1f2' : theme.isDark ? '#0f172a' : '#f8fafc',
                                        padding: 10,
                                      }}
                                    >
                                      <Text
                                        selectable
                                        style={{
                                          fontFamily: Platform.select({
                                            ios: 'Menlo',
                                            android: 'monospace',
                                            default: 'monospace',
                                          }),
                                          color: liveEditorError ? '#b91c1c' : theme.textPrimary,
                                        }}
                                      >
                                        {liveEditorError || liveEditorOutput || 'No output yet.'}
                                      </Text>
                                    </View>
                                  </>
                                )}
                              </>
                            )}
                          </View>
                        );
                      }
                      if (block.type === 'list') {
                        return (
                          <View key={`list-${blockIndex}`} style={{ gap: 4 }}>
                            {block.items.map((item, itemIndex) => (
                              <View
                                key={`list-${blockIndex}-${itemIndex}`}
                                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}
                              >
                                <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary }]}>
                                  {block.mode === 'ordered' ? `${itemIndex + 1}.` : '\u2022'}
                                </Text>
                                <View style={{ flex: 1 }}>
                                  {renderInlineText(
                                    item,
                                    [portalStyles.listItemMeta, { color: theme.textPrimary, lineHeight: 22 }],
                                    `list-${blockIndex}-${itemIndex}`
                                  )}
                                </View>
                              </View>
                            ))}
                          </View>
                        );
                      }
                      return (
                        <View key={`paragraph-${blockIndex}`}>
                          {renderInlineText(
                            block.text,
                            [portalStyles.listItemMeta, { color: theme.textPrimary, lineHeight: 22 }],
                            `paragraph-${blockIndex}`
                          )}
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>No content for this lesson.</Text>
                )}
              </View>
            ) : null}
          </>
        ) : (
          <>
            {contentModules.length === 0 ? (
              <Text style={[portalStyles.empty, { color: theme.textMuted }]}>No modules found.</Text>
            ) : null}
            {contentModules.map((moduleItem, moduleIndex) => (
              (() => {
                const moduleId = String(moduleItem?.id || '');
                const moduleExpanded = Boolean(expandedManageModuleIds[moduleId]);
                return (
              <View
                key={moduleItem?.id || `module-page-${moduleIndex}`}
                style={[portalStyles.listCard, { backgroundColor: theme.pageBg, borderColor: theme.cardBorder, gap: 6 }]}
              >
                <Pressable
                  onPress={() =>
                    setExpandedManageModuleIds((prev) => ({
                      ...prev,
                      [moduleId]: !Boolean(prev[moduleId]),
                    }))
                  }
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                >
                  <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, flex: 1 }]}>
                    {moduleItem?.title || `Module ${moduleIndex + 1}`}
                  </Text>
                  <MaterialCommunityIcons
                    name={moduleExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={theme.textMuted}
                  />
                </Pressable>
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Module ID: {moduleItem?.id || '-'} | Order: {Number(moduleItem?.orderNumber || moduleIndex + 1)} | Lessons: {Array.isArray(moduleItem?.lessons) ? moduleItem.lessons.length : 0}
                </Text>
                {moduleItem?.description ? (
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{moduleItem.description}</Text>
                ) : null}
                {moduleExpanded ? (
                  <>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <Pressable style={portalStyles.secondaryBtn} onPress={() => openCreateLessonModal(moduleItem?.id, 'text')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="text-box-plus-outline" size={14} color={theme.textPrimary} />
                      <Text style={portalStyles.secondaryBtnText}>Add Text Lesson</Text>
                    </View>
                  </Pressable>
                  <Pressable style={portalStyles.secondaryBtn} onPress={() => openCreateLessonModal(moduleItem?.id, 'code_example')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="code-tags" size={14} color={theme.textPrimary} />
                      <Text style={portalStyles.secondaryBtnText}>Add Code Lesson</Text>
                    </View>
                  </Pressable>
                  <Pressable style={portalStyles.secondaryBtn} onPress={() => openCreateLessonModal(moduleItem?.id, 'video_embed')}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="video-plus-outline" size={14} color={theme.textPrimary} />
                      <Text style={portalStyles.secondaryBtnText}>Add Video Lesson</Text>
                    </View>
                  </Pressable>
                  <Pressable style={portalStyles.secondaryBtn} onPress={() => openEditModuleModal(moduleItem)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="pencil-outline" size={14} color={theme.textPrimary} />
                      <Text style={portalStyles.secondaryBtnText}>Edit Module</Text>
                    </View>
                  </Pressable>
                  <Pressable
                    style={[
                      portalStyles.secondaryBtn,
                      {
                        backgroundColor: '#fee2e2',
                        borderWidth: 1,
                        borderColor: '#fecaca',
                      },
                    ]}
                    onPress={() => handleDeleteModule(moduleItem)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="trash-can-outline" size={14} color="#b91c1c" />
                      <Text style={[portalStyles.notificationActionText, { color: '#b91c1c' }]}>Delete Module</Text>
                    </View>
                  </Pressable>
                </View>
                {Array.isArray(moduleItem?.lessons) && moduleItem.lessons.length > 0 ? (
                  moduleItem.lessons.map((lessonItem, lessonIndex) => (
                    <View key={lessonItem?.id || `lesson-page-${lessonIndex}`} style={{ gap: 2 }}>
                      <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary }]}>
                        {lessonIndex + 1}. {lessonItem?.title || 'Untitled lesson'} ({lessonItem?.type || 'text'})
                      </Text>
                      <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                        Lesson ID: {lessonItem?.id || '-'} | Order: {Number(lessonItem?.orderNumber || lessonIndex + 1)}
                      </Text>
                      <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                        Duration: {Number(lessonItem?.durationMinutes || 0)} min | Published: {lessonItem?.isPublished ? 'Yes' : 'No'}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 }}>
                        <Pressable style={portalStyles.secondaryBtn} onPress={() => openEditLessonModal(moduleItem?.id, lessonItem)}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MaterialCommunityIcons name="pencil-outline" size={14} color={theme.textPrimary} />
                            <Text style={portalStyles.secondaryBtnText}>Edit Lesson</Text>
                          </View>
                        </Pressable>
                        <Pressable style={portalStyles.secondaryBtn} onPress={() => togglePublishLesson(lessonItem)}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MaterialCommunityIcons
                              name={lessonItem?.isPublished ? 'eye-off-outline' : 'eye-check-outline'}
                              size={14}
                              color={theme.textPrimary}
                            />
                            <Text style={portalStyles.secondaryBtnText}>
                              {lessonItem?.isPublished ? 'Unpublish' : 'Publish'}
                            </Text>
                          </View>
                        </Pressable>
                        <Pressable
                          style={[
                            portalStyles.secondaryBtn,
                            {
                              backgroundColor: '#fee2e2',
                              borderWidth: 1,
                              borderColor: '#fecaca',
                            },
                          ]}
                          onPress={() => handleDeleteLesson(lessonItem)}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <MaterialCommunityIcons name="trash-can-outline" size={14} color="#b91c1c" />
                            <Text style={[portalStyles.notificationActionText, { color: '#b91c1c' }]}>Delete Lesson</Text>
                          </View>
                        </Pressable>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>No lessons yet.</Text>
                )}
                  </>
                ) : null}
              </View>
                );
              })()
            ))}
          </>
        )}

        <Modal
          visible={moduleModalOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          presentationStyle="overFullScreen"
          onRequestClose={() => setModuleModalOpen(false)}
        >
          <KeyboardAvoidingView
            style={portalStyles.dialogOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Pressable style={portalStyles.dialogOverlayTouch} onPress={() => setModuleModalOpen(false)} />
            <View style={[portalStyles.dialogCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <ScrollView
                style={portalStyles.dialogScroll}
                contentContainerStyle={portalStyles.dialogContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                <View style={portalStyles.modalHandle} />
                <View style={portalStyles.modalSheetHeader}>
                  <Text style={[portalStyles.modalSheetTitle, { color: theme.textPrimary }]}>
                    {editingModuleId ? 'Edit Module' : 'Add Module'}
                  </Text>
                  <Text style={[portalStyles.modalSheetSubtitle, { color: theme.textMuted }]}>
                    Create or update module details.
                  </Text>
                </View>
                <TextInput
                  value={moduleForm.title}
                  onChangeText={(text) => setModuleForm((prev) => ({ ...prev, title: text }))}
                  placeholder="Module title"
                  placeholderTextColor="#94a3b8"
                  style={portalStyles.input}
                />
                <TextInput
                  value={moduleForm.description}
                  onChangeText={(text) => setModuleForm((prev) => ({ ...prev, description: text }))}
                  placeholder="Module description"
                  placeholderTextColor="#94a3b8"
                  style={portalStyles.input}
                  multiline
                />
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Pressable style={portalStyles.chatSendBtn} onPress={handleSaveModule} disabled={moduleSubmitting}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="content-save-outline" size={14} color="#ffffff" />
                      <Text style={portalStyles.chatSendText}>{moduleSubmitting ? 'Saving...' : 'Save Module'}</Text>
                    </View>
                  </Pressable>
                  <Pressable style={portalStyles.secondaryBtn} onPress={() => setModuleModalOpen(false)} disabled={moduleSubmitting}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="close-circle-outline" size={14} color={theme.textPrimary} />
                      <Text style={portalStyles.secondaryBtnText}>Cancel</Text>
                    </View>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={lessonModalOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          presentationStyle="overFullScreen"
          onRequestClose={() => setLessonModalOpen(false)}
        >
          <KeyboardAvoidingView
            style={portalStyles.dialogOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <Pressable style={portalStyles.dialogOverlayTouch} onPress={() => setLessonModalOpen(false)} />
            <View style={[portalStyles.dialogCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <ScrollView
                style={portalStyles.dialogScroll}
                contentContainerStyle={portalStyles.dialogContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator
              >
                <View style={portalStyles.modalHandle} />
                <View style={portalStyles.modalSheetHeader}>
                  <Text style={[portalStyles.modalSheetTitle, { color: theme.textPrimary }]}>
                    {editingLessonId ? 'Edit Lesson' : 'Add Lesson'}
                  </Text>
                  <Text style={[portalStyles.modalSheetSubtitle, { color: theme.textMuted }]}>
                    Manage lesson content, type, and publish state.
                  </Text>
                </View>
                <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '700' }]}>
                  Module
                </Text>
                {contentModules.length > 0 ? (
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {contentModules.map((moduleItem, moduleIndex) => {
                      const moduleId = String(moduleItem?.id || '');
                      const selected = String(lessonForm.moduleId || '') === moduleId;
                      return (
                        <Pressable
                          key={moduleId || `lesson-module-${moduleIndex}`}
                          onPress={() => setLessonForm((prev) => ({ ...prev, moduleId }))}
                          style={[portalStyles.secondaryBtn, selected && portalStyles.financeFilterActive]}
                        >
                          <Text style={portalStyles.secondaryBtnText} numberOfLines={1}>
                            {moduleItem?.title || `Module ${moduleIndex + 1}`}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : (
                  <TextInput
                    value={lessonForm.moduleId}
                    onChangeText={(text) => setLessonForm((prev) => ({ ...prev, moduleId: text }))}
                    placeholder="Module ID"
                    placeholderTextColor="#94a3b8"
                    style={portalStyles.input}
                  />
                )}
                <TextInput
                  value={lessonForm.title}
                  onChangeText={(text) => setLessonForm((prev) => ({ ...prev, title: text }))}
                  placeholder="Lesson title"
                  placeholderTextColor="#94a3b8"
                  style={portalStyles.input}
                />
                <TextInput
                  value={lessonForm.description}
                  onChangeText={(text) => setLessonForm((prev) => ({ ...prev, description: text }))}
                  placeholder="Lesson description"
                  placeholderTextColor="#94a3b8"
                  style={portalStyles.input}
                  multiline
                />
                <TextInput
                  value={lessonForm.content}
                  onChangeText={(text) => setLessonForm((prev) => ({ ...prev, content: text }))}
                  placeholder="Lesson content"
                  placeholderTextColor="#94a3b8"
                  style={portalStyles.input}
                  multiline
                />
                <TextInput
                  value={lessonForm.durationMinutes}
                  onChangeText={(text) => setLessonForm((prev) => ({ ...prev, durationMinutes: text }))}
                  placeholder="Duration minutes"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  style={portalStyles.input}
                />
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Pressable style={portalStyles.secondaryBtn} onPress={() => appendToLessonContent('```code\n\n```')}>
                    <Text style={portalStyles.secondaryBtnText}>Insert Code Block</Text>
                  </Pressable>
                  <Pressable style={portalStyles.secondaryBtn} onPress={() => appendToLessonContent('{{video:URL}}')}>
                    <Text style={portalStyles.secondaryBtnText}>Insert Video Token</Text>
                  </Pressable>
                  <Pressable
                    style={portalStyles.secondaryBtn}
                    onPress={() => appendToLessonContent('{{starter:\nprint(\"\")\n}}')}
                  >
                    <Text style={portalStyles.secondaryBtnText}>Insert Starter</Text>
                  </Pressable>
                  <Pressable
                    style={portalStyles.secondaryBtn}
                    onPress={() => appendToLessonContent('{{answer:\n\n}}')}
                  >
                    <Text style={portalStyles.secondaryBtnText}>Insert Answer</Text>
                  </Pressable>
                </View>
                <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '700' }]}>
                  Live Editor
                </Text>
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: theme.cardBorder,
                    borderRadius: 10,
                    overflow: 'hidden',
                    backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc',
                  }}
                >
                  {[
                    { label: 'Off', value: false },
                    { label: 'On', value: true },
                  ].map((option) => {
                    const selected = lessonForm.enableLiveEditor === option.value;
                    return (
                      <Pressable
                        key={`live-editor-${option.label}`}
                        onPress={() => setLessonForm((prev) => ({ ...prev, enableLiveEditor: option.value }))}
                        style={{
                          paddingVertical: 10,
                          paddingHorizontal: 12,
                          backgroundColor: selected ? (theme.isDark ? '#1e293b' : '#dbeafe') : 'transparent',
                          borderTopWidth: option.value ? 1 : 0,
                          borderTopColor: theme.cardBorder,
                        }}
                      >
                        <Text style={{ color: theme.textPrimary, fontWeight: selected ? '700' : '500' }}>
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {lessonForm.enableLiveEditor ? (
                  <>
                    <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '700' }]}>
                      Live Editor Language
                    </Text>
                    <View
                      style={{
                        borderWidth: 1,
                        borderColor: theme.cardBorder,
                        borderRadius: 10,
                        overflow: 'hidden',
                        backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc',
                      }}
                    >
                      {[
                        { label: 'Python', value: 'python' },
                        { label: 'JavaScript', value: 'javascript' },
                        { label: 'HTML/CSS', value: 'html_css' },
                      ].map((option, optionIndex) => {
                        const selected = lessonForm.liveEditorLanguage === option.value;
                        return (
                          <Pressable
                            key={`live-editor-language-${option.value}`}
                            onPress={() => setLessonForm((prev) => ({ ...prev, liveEditorLanguage: option.value }))}
                            style={{
                              paddingVertical: 10,
                              paddingHorizontal: 12,
                              backgroundColor: selected ? (theme.isDark ? '#1e293b' : '#dbeafe') : 'transparent',
                              borderTopWidth: optionIndex > 0 ? 1 : 0,
                              borderTopColor: theme.cardBorder,
                            }}
                          >
                            <Text style={{ color: theme.textPrimary, fontWeight: selected ? '700' : '500' }}>
                              {option.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Pressable
                    style={[portalStyles.secondaryBtn, lessonForm.isPublished && portalStyles.financeFilterActive]}
                    onPress={() => setLessonForm((prev) => ({ ...prev, isPublished: !prev.isPublished }))}
                  >
                    <Text style={portalStyles.secondaryBtnText}>
                      Published: {lessonForm.isPublished ? 'Yes' : 'No'}
                    </Text>
                  </Pressable>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Pressable style={portalStyles.chatSendBtn} onPress={handleSaveLesson} disabled={lessonSubmitting}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="content-save-outline" size={14} color="#ffffff" />
                      <Text style={portalStyles.chatSendText}>{lessonSubmitting ? 'Saving...' : 'Save Lesson'}</Text>
                    </View>
                  </Pressable>
                  <Pressable style={portalStyles.secondaryBtn} onPress={() => setLessonModalOpen(false)} disabled={lessonSubmitting}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="close-circle-outline" size={14} color={theme.textPrimary} />
                      <Text style={portalStyles.secondaryBtnText}>Cancel</Text>
                    </View>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }


  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>All Courses</Text>
          <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
            Manage courses, pricing, and publishing status.
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Pressable style={portalStyles.chatSendBtn} onPress={openCreateCourseModal}>
          <Text style={portalStyles.chatSendText}>Add New Course</Text>
        </Pressable>
        <Pressable style={portalStyles.secondaryBtn} onPress={() => onNavigateFeature('admin-paths')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="map-marker-path" size={14} color={theme.textPrimary} />
            <Text style={portalStyles.secondaryBtnText}>Paths</Text>
          </View>
        </Pressable>
        <Pressable style={portalStyles.secondaryBtn} onPress={() => onNavigateFeature('admin-categories')}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="shape-outline" size={14} color={theme.textPrimary} />
            <Text style={portalStyles.secondaryBtnText}>Categories</Text>
          </View>
        </Pressable>
        <Pressable style={portalStyles.secondaryBtn} onPress={fetchCourses} disabled={loading}>
          <Text style={portalStyles.secondaryBtnText}>{loading ? 'Loading...' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <View style={portalStyles.statsGrid}>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{String(stats.total)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Total Courses</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{String(stats.active)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Published Courses</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{String(stats.totalStudents)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Total Students</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>${stats.revenueMonthlyMock.toFixed(0)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Estimated Monthly Revenue</Text>
        </View>
      </View>

      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 8 }]}>
        <View style={{ gap: 8, zIndex: 20 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by title / teacher / course ID..."
              placeholderTextColor="#94a3b8"
              style={[portalStyles.input, { flex: 1, height: 50 }]}
            />
            <View style={{ width: 150, position: 'relative', zIndex: 30 }}>
              <Pressable
                onPress={() => setStatusDropdownOpen((prev) => !prev)}
                style={[
                  portalStyles.input,
                {
                  height: 50,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                },
                ]}
              >
                <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '700' }]}>
                  {statusFilterLabel}
                </Text>
                <MaterialCommunityIcons
                  name={statusDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.textMuted}
                />
              </Pressable>
              {statusDropdownOpen ? (
                <View
                  style={[
                    portalStyles.listCard,
                    {
                      position: 'absolute',
                      top: 56,
                      left: 0,
                      right: 0,
                      elevation: 8,
                      shadowColor: '#000',
                      shadowOpacity: 0.14,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      backgroundColor: theme.pageBg,
                      borderColor: theme.cardBorder,
                      padding: 6,
                      gap: 4,
                    },
                  ]}
                >
                  {['all', 'published', 'archived', 'draft'].map((status) => {
                    const label = status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1);
                    return (
                      <Pressable
                        key={status}
                        onPress={() => {
                          setStatusFilter(status);
                          setStatusDropdownOpen(false);
                        }}
                        style={[
                          portalStyles.secondaryBtn,
                          { justifyContent: 'flex-start' },
                          statusFilter === status && portalStyles.financeFilterActive,
                        ]}
                      >
                        <Text style={portalStyles.secondaryBtnText}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Pressable style={portalStyles.secondaryBtn} onPress={toggleSelectAllFiltered}>
              <Text style={portalStyles.secondaryBtnText}>{allFilteredSelected ? 'Unselect All' : 'Select All'}</Text>
            </Pressable>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Selected courses: {selectedCourseIds.length}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <TextInput
            value={bulkCategoryId}
            onChangeText={setBulkCategoryId}
            placeholder="Category ID (empty = uncategorized)"
            placeholderTextColor="#94a3b8"
            style={[portalStyles.input, { flex: 1 }]}
          />
          <Pressable
            style={[portalStyles.chatSendBtn, { alignSelf: 'stretch', justifyContent: 'center' }]}
            onPress={handleBulkCategoryAssign}
            disabled={bulkSaving || selectedCourseIds.length === 0}
          >
            <Text style={portalStyles.chatSendText}>{bulkSaving ? 'Applying...' : 'Apply Category'}</Text>
          </Pressable>
        </View>
        {categories.length > 0 ? (
          <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
            Available categories: {categories.map((item) => item.name).slice(0, 5).join(', ')}
            {categories.length > 5 ? ' ...' : ''}
          </Text>
        ) : null}
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading && !error && filtered.length === 0 ? <Text style={portalStyles.empty}>No courses found.</Text> : null}

      {!loading &&
        !error &&
        filtered.map((course, index) => {
          const status = String(course?.status || 'draft').toLowerCase();
          const statusColor = status === 'published' ? '#166534' : status === 'archived' ? '#334155' : '#92400e';
          const statusBg = status === 'published' ? '#dcfce7' : status === 'archived' ? '#e2e8f0' : '#fef3c7';
          const selected = selectedCourseIds.includes(course?.id);

          return (
            <View
              key={course?.id || `course-${index}`}
              style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: selected ? '#60a5fa' : theme.cardBorder, gap: 6 }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Pressable style={portalStyles.secondaryBtn} onPress={() => toggleCourseSelection(course?.id)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons
                      name={selected ? 'check-circle-outline' : 'circle-outline'}
                      size={14}
                      color={theme.textPrimary}
                    />
                    <Text style={portalStyles.secondaryBtnText}>{selected ? 'Selected' : 'Select'}</Text>
                  </View>
                </Pressable>
                <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: statusBg }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: statusColor, textTransform: 'capitalize' }}>{status}</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="book-open-page-variant" size={18} color={theme.textPrimary} />
                <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, flex: 1 }]}>
                  {course?.title || 'Untitled course'}
                </Text>
              </View>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]} numberOfLines={2}>
                {String(course?.description || '').trim()
                  ? String(course.description).trim()
                  : 'No description available.'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <MaterialCommunityIcons name="account-tie" size={14} color={theme.textMuted} />
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  {course?.teacherName || '-'}
                </Text>
                <MaterialCommunityIcons name="shape-outline" size={14} color={theme.textMuted} />
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  {course?.categoryName || 'Uncategorized'}
                </Text>
              </View>
              {expandedCourseId === String(course?.id || '') ? (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <MaterialCommunityIcons name="cash-multiple" size={14} color={theme.textMuted} />
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                      ${Number(course?.price || 0).toFixed(2)}
                    </Text>
                    <MaterialCommunityIcons name="percent-outline" size={14} color={theme.textMuted} />
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                      {Number(course?.teacherSharePct || 70).toFixed(0)}%
                    </Text>
                    <MaterialCommunityIcons name="account-group-outline" size={14} color={theme.textMuted} />
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                      {Number(course?.students || 0)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <MaterialCommunityIcons name="calendar-range-outline" size={14} color={theme.textMuted} />
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                      {Math.max(1, Number(course?.durationWeeks || 0))} week(s)
                    </Text>
                    <MaterialCommunityIcons name="star-outline" size={14} color={theme.textMuted} />
                    <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                      {Number(course?.averageRating || 0).toFixed(1)} ({Number(course?.evaluationCount || 0)} reviews)
                    </Text>
                  </View>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                    Course ID: {course?.id || '-'} | Teacher ID: {course?.teacherId || '-'}
                  </Text>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                    Category ID: {course?.categoryId || '-'} | Created: {course?.createdAt || '-'}
                  </Text>
                  <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                    Enrolled (current user): {course?.enrolled ? 'Yes' : 'No'}
                  </Text>
                </>
              ) : null}

              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginTop: 4 }}>
                <Pressable
                  style={portalStyles.secondaryBtn}
                  onPress={() =>
                    setExpandedCourseId((prev) =>
                      prev === String(course?.id || '') ? '' : String(course?.id || '')
                    )
                  }
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons
                      name={expandedCourseId === String(course?.id || '') ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={theme.textPrimary}
                    />
                    <Text style={portalStyles.secondaryBtnText}>
                      {expandedCourseId === String(course?.id || '') ? 'Hide Details' : 'Show More Details'}
                    </Text>
                  </View>
                </Pressable>
                <Pressable style={portalStyles.secondaryBtn} onPress={() => openContentPage(course?.id)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="file-document-outline" size={14} color={theme.textPrimary} />
                    <Text style={portalStyles.secondaryBtnText}>Content</Text>
                  </View>
                </Pressable>
                <Pressable style={portalStyles.secondaryBtn} onPress={() => openEditCourseModal(course?.id)}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="pencil-outline" size={14} color={theme.textPrimary} />
                    <Text style={portalStyles.secondaryBtnText}>Edit</Text>
                  </View>
                </Pressable>
                <Pressable
                  style={[
                    portalStyles.secondaryBtn,
                    {
                      backgroundColor: '#fee2e2',
                      borderWidth: 1,
                      borderColor: '#fecaca',
                      width: 36,
                      justifyContent: 'center',
                    },
                  ]}
                  onPress={() => handleDeleteCourse(course)}
                  disabled={deletingId === String(course?.id || '')}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <MaterialCommunityIcons name="trash-can-outline" size={14} color="#b91c1c" />
                  </View>
                </Pressable>
              </View>
            </View>
          );
        })}

      <Modal
        visible={courseModalOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        presentationStyle="overFullScreen"
        onRequestClose={() => setCourseModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={portalStyles.dialogOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable style={portalStyles.dialogOverlayTouch} onPress={() => setCourseModalOpen(false)} />
          <View style={[portalStyles.dialogCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
            <ScrollView
              style={portalStyles.dialogScroll}
              contentContainerStyle={portalStyles.dialogContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              <View style={portalStyles.modalHandle} />
              <View style={portalStyles.modalSheetHeader}>
                <Text style={[portalStyles.modalSheetTitle, { color: theme.textPrimary }]}>
                  {courseModalMode === 'edit' ? 'Edit Course' : 'Add Course'}
                </Text>
                <Text style={[portalStyles.modalSheetSubtitle, { color: theme.textMuted }]}>
                  Manage course details in-app.
                </Text>
              </View>

              <TextInput
                value={courseForm.title}
                onChangeText={(text) => setCourseForm((prev) => ({ ...prev, title: text }))}
                placeholder="Course title"
                placeholderTextColor="#94a3b8"
                style={portalStyles.input}
              />
              <TextInput
                value={courseForm.description}
                onChangeText={(text) => setCourseForm((prev) => ({ ...prev, description: text }))}
                placeholder="Description"
                placeholderTextColor="#94a3b8"
                style={portalStyles.input}
                multiline
              />
              <TextInput
                value={courseForm.teacherId}
                onChangeText={(text) => setCourseForm((prev) => ({ ...prev, teacherId: text }))}
                placeholder="Teacher ID"
                placeholderTextColor="#94a3b8"
                style={portalStyles.input}
              />
              {teachers.length > 0 ? (
                <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                  Teachers: {teachers.map((item) => item.fullName).slice(0, 4).join(', ')}
                  {teachers.length > 4 ? ' ...' : ''}
                </Text>
              ) : null}
              <TextInput
                value={courseForm.price}
                onChangeText={(text) => setCourseForm((prev) => ({ ...prev, price: text }))}
                placeholder="Price"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                style={portalStyles.input}
              />
              <TextInput
                value={courseForm.durationWeeks}
                onChangeText={(text) => setCourseForm((prev) => ({ ...prev, durationWeeks: text }))}
                placeholder="Duration weeks"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                style={portalStyles.input}
              />
              <TextInput
                value={courseForm.teacherSharePct}
                onChangeText={(text) => setCourseForm((prev) => ({ ...prev, teacherSharePct: text }))}
                placeholder="Teacher share %"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                style={portalStyles.input}
              />
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {['draft', 'published', 'archived'].map((item) => (
                  <Pressable
                    key={item}
                    onPress={() => setCourseForm((prev) => ({ ...prev, status: item }))}
                    style={[portalStyles.secondaryBtn, courseForm.status === item && portalStyles.financeFilterActive]}
                  >
                    <Text style={portalStyles.secondaryBtnText}>{item}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Pressable style={portalStyles.chatSendBtn} onPress={handleSaveCourse} disabled={courseSubmitting}>
                  <Text style={portalStyles.chatSendText}>{courseSubmitting ? 'Saving...' : 'Save'}</Text>
                </Pressable>
                <Pressable style={portalStyles.secondaryBtn} onPress={() => setCourseModalOpen(false)} disabled={courseSubmitting}>
                  <Text style={portalStyles.secondaryBtnText}>Cancel</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

function AdminCategoriesCrudPage({ apiFetch, theme, onNavigateFeature = () => {} }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [editingCategoryId, setEditingCategoryId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/categories', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load categories');
      setCategories(Array.isArray(data?.categories) ? data.categories : []);
    } catch (err) {
      setError(err?.message || 'Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setEditingCategoryId('');
    setName('');
    setDescription('');
    setStatus('active');
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Category name is required');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const isEditing = Boolean(editingCategoryId);
      const endpoint = isEditing
        ? `/api/categories/${encodeURIComponent(editingCategoryId)}`
        : '/api/categories';
      const res = await apiFetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          status: status === 'inactive' ? 'inactive' : 'active',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to save category');
      resetForm();
      await fetchCategories();
    } catch (err) {
      setError(err?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category) => {
    const confirmed = await new Promise((resolve) => {
      Alert.alert('Delete category', `Delete "${category?.name}"?`, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ], { cancelable: true, onDismiss: () => resolve(false) });
    });
    if (!confirmed) return;
    try {
      setDeletingId(String(category?.id || ''));
      const res = await apiFetch(`/api/categories/${encodeURIComponent(String(category?.id || ''))}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to delete category');
      if (editingCategoryId === String(category?.id || '')) resetForm();
      await fetchCategories();
    } catch (err) {
      setError(err?.message || 'Failed to delete category');
    } finally {
      setDeletingId('');
    }
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Categories</Text>
          <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
            Organize courses and learning paths by topic.
          </Text>
        </View>
        <Pressable style={portalStyles.secondaryBtn} onPress={() => onNavigateFeature('admin-courses')}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textPrimary} />
        </Pressable>
        <Pressable style={portalStyles.secondaryBtn} onPress={fetchCategories}>
          <Text style={portalStyles.secondaryBtnText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 8 }]}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Category name"
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
        />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Short description"
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
        />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Pressable onPress={() => setStatus('active')} style={[portalStyles.secondaryBtn, status === 'active' && portalStyles.financeFilterActive]}>
            <Text style={portalStyles.secondaryBtnText}>Active</Text>
          </Pressable>
          <Pressable onPress={() => setStatus('inactive')} style={[portalStyles.secondaryBtn, status === 'inactive' && portalStyles.financeFilterActive]}>
            <Text style={portalStyles.secondaryBtnText}>Inactive</Text>
          </Pressable>
          <Pressable style={portalStyles.chatSendBtn} onPress={handleSubmit} disabled={saving || !name.trim()}>
            <Text style={portalStyles.chatSendText}>
              {saving ? 'Saving...' : editingCategoryId ? 'Save Category' : 'Add Category'}
            </Text>
          </Pressable>
          {editingCategoryId ? (
            <Pressable style={portalStyles.secondaryBtn} onPress={resetForm}>
              <Text style={portalStyles.secondaryBtnText}>Cancel Edit</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading && categories.length === 0 ? <Text style={portalStyles.empty}>No categories yet.</Text> : null}

      {!loading &&
        categories.map((category) => (
          <View
            key={category?.id}
            style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 5 }]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, flex: 1 }]}>{category?.name}</Text>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 999,
                  backgroundColor: String(category?.status || 'active') === 'active' ? '#dcfce7' : '#e2e8f0',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: String(category?.status || 'active') === 'active' ? '#166534' : '#334155',
                  }}
                >
                  {String(category?.status || 'active')}
                </Text>
              </View>
            </View>
            {category?.description ? (
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{category.description}</Text>
            ) : null}
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Courses: {Number(category?.coursesCount || 0)} | Paths: {Number(category?.pathsCount || 0)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Pressable
                style={portalStyles.secondaryBtn}
                onPress={() => {
                  setEditingCategoryId(String(category?.id || ''));
                  setName(String(category?.name || ''));
                  setDescription(String(category?.description || ''));
                  setStatus(String(category?.status || 'active') === 'inactive' ? 'inactive' : 'active');
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={portalStyles.secondaryBtnText}>Edit</Text>
                  <MaterialCommunityIcons name="chevron-right" size={14} color={theme.textPrimary} />
                </View>
              </Pressable>
              <Pressable
                style={[portalStyles.notificationActionBtn, { backgroundColor: '#fee2e2' }]}
                onPress={() => handleDelete(category)}
                disabled={deletingId === String(category?.id || '')}
              >
                <Text style={[portalStyles.notificationActionText, { color: '#b91c1c' }]}>
                  {deletingId === String(category?.id || '') ? 'Deleting...' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
    </View>
  );
}

function AdminPathsCrudPage({ apiFetch, theme, onNavigateFeature = () => {} }) {
  const [paths, setPaths] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [editingPathId, setEditingPathId] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [level, setLevel] = useState('beginner');
  const [status, setStatus] = useState('draft');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [categoryListOpen, setCategoryListOpen] = useState(false);
  const [levelListOpen, setLevelListOpen] = useState(false);
  const [statusListOpen, setStatusListOpen] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError('');
    const decodeResponse = async (response) => {
      const raw = await response.text();
      if (!raw) return {};
      try {
        return JSON.parse(raw);
      } catch {
        return { message: raw };
      }
    };
    try {
      const [pathsReq, categoriesReq, coursesReq] = await Promise.allSettled([
        apiFetch('/api/paths', { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }),
        apiFetch('/api/categories', { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }),
        apiFetch('/api/courses', { method: 'GET', headers: { 'Content-Type': 'application/json' }, credentials: 'include' }),
      ]);

      const errors = [];

      if (pathsReq.status === 'fulfilled') {
        const payload = await decodeResponse(pathsReq.value);
        if (pathsReq.value.ok) setPaths(Array.isArray(payload?.paths) ? payload.paths : []);
        else {
          setPaths([]);
          errors.push(payload?.message || 'Failed to load paths');
        }
      } else {
        setPaths([]);
        errors.push(pathsReq.reason?.message || 'Failed to load paths');
      }

      if (categoriesReq.status === 'fulfilled') {
        const payload = await decodeResponse(categoriesReq.value);
        if (categoriesReq.value.ok) setCategories(Array.isArray(payload?.categories) ? payload.categories : []);
        else {
          setCategories([]);
          errors.push(payload?.message || 'Failed to load categories');
        }
      } else {
        setCategories([]);
        errors.push(categoriesReq.reason?.message || 'Failed to load categories');
      }

      if (coursesReq.status === 'fulfilled') {
        const payload = await decodeResponse(coursesReq.value);
        if (coursesReq.value.ok) setCourses(Array.isArray(payload?.courses) ? payload.courses : []);
        else {
          setCourses([]);
          errors.push(payload?.message || 'Failed to load courses');
        }
      } else {
        setCourses([]);
        errors.push(coursesReq.reason?.message || 'Failed to load courses');
      }

      if (errors.length > 0) {
        setError(errors.join(' | '));
      }
    } catch (err) {
      setError(err?.message || 'Failed to load paths data');
      setPaths([]);
      setCategories([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setEditingPathId('');
    setTitle('');
    setDescription('');
    setCategoryId('');
    setLevel('beginner');
    setStatus('draft');
    setEstimatedHours('');
    setPrice('');
    setSelectedCourseIds([]);
    setCategoryListOpen(false);
    setLevelListOpen(false);
    setStatusListOpen(false);
  };

  const toggleCourse = (courseId) => {
    setSelectedCourseIds((prev) => (prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Path title is required');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const isEditing = Boolean(editingPathId);
      const endpoint = isEditing ? `/api/paths/${encodeURIComponent(editingPathId)}` : '/api/paths';
      const res = await apiFetch(endpoint, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categoryId: categoryId || null,
          level,
          status,
          estimatedHours: Number(estimatedHours || 0),
          price: Number(price || 0),
          courseIds: selectedCourseIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to save path');
      resetForm();
      await fetchAll();
    } catch (err) {
      setError(err?.message || 'Failed to save path');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pathItem) => {
    const confirmed = await new Promise((resolve) => {
      Alert.alert('Delete path', `Delete "${pathItem?.title || 'this path'}"?`, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
      ], { cancelable: true, onDismiss: () => resolve(false) });
    });
    if (!confirmed) return;
    try {
      setDeletingId(String(pathItem?.id || ''));
      const res = await apiFetch(`/api/paths/${encodeURIComponent(String(pathItem?.id || ''))}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to delete path');
      if (editingPathId === String(pathItem?.id || '')) resetForm();
      await fetchAll();
    } catch (err) {
      setError(err?.message || 'Failed to delete path');
    } finally {
      setDeletingId('');
    }
  };

  const availableCourses = useMemo(
    () => courses.filter((course) => String(course?.status || '').toLowerCase() !== 'archived'),
    [courses]
  );

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Learning Paths</Text>
          <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
            Create guided course bundles students can enroll in as one path.
          </Text>
        </View>
        <Pressable style={portalStyles.secondaryBtn} onPress={() => onNavigateFeature('admin-courses')}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={theme.textPrimary} />
        </Pressable>
        <Pressable style={portalStyles.secondaryBtn} onPress={fetchAll}>
          <Text style={portalStyles.secondaryBtnText}>Refresh</Text>
        </Pressable>
      </View>

      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 8 }]}>
        <TextInput value={title} onChangeText={setTitle} placeholder="Path title" placeholderTextColor="#94a3b8" style={portalStyles.input} />
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Path description"
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
        />
        <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '700' }]}>
          Category
        </Text>
        <Pressable
          style={[
            portalStyles.input,
            {
              minHeight: 46,
              justifyContent: 'center',
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            },
          ]}
          onPress={() => {
            setCategoryListOpen((prev) => !prev);
            setLevelListOpen(false);
            setStatusListOpen(false);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Text style={portalStyles.secondaryBtnText}>
              {categoryId
                ? String(categories.find((item) => String(item?.id || '') === categoryId)?.name || categoryId)
                : 'Uncategorized'}
            </Text>
            <MaterialCommunityIcons
              name={categoryListOpen ? 'chevron-down' : 'chevron-right'}
              size={16}
              color={theme.textPrimary}
            />
          </View>
        </Pressable>
        {categoryListOpen ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.cardBorder,
              borderRadius: 10,
              overflow: 'hidden',
              backgroundColor: theme.cardBg,
            }}
          >
            {[{ id: '', name: 'Uncategorized' }, ...categories].map((item, index) => {
              const selected = categoryId === String(item?.id || '');
              return (
                <Pressable
                  key={String(item?.id || `category-empty-${index}`)}
                  onPress={() => {
                    setCategoryId(String(item?.id || ''));
                    setCategoryListOpen(false);
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: selected ? (theme.isDark ? '#1e293b' : '#eff6ff') : 'transparent',
                    borderTopWidth: index > 0 ? 1 : 0,
                    borderTopColor: theme.cardBorder,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.textPrimary, fontWeight: selected ? '700' : '500' }}>
                      {String(item?.name || 'Uncategorized')}
                    </Text>
                    {selected ? <MaterialCommunityIcons name="check" size={14} color="#2563eb" /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '700' }]}>
          Level
        </Text>
        <Pressable
          style={[
            portalStyles.input,
            {
              minHeight: 46,
              justifyContent: 'center',
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            },
          ]}
          onPress={() => {
            setLevelListOpen((prev) => !prev);
            setCategoryListOpen(false);
            setStatusListOpen(false);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Text style={portalStyles.secondaryBtnText}>
              {level === 'all_levels' ? 'All Levels' : `${level.charAt(0).toUpperCase()}${level.slice(1)}`}
            </Text>
            <MaterialCommunityIcons
              name={levelListOpen ? 'chevron-down' : 'chevron-right'}
              size={16}
              color={theme.textPrimary}
            />
          </View>
        </Pressable>
        {levelListOpen ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.cardBorder,
              borderRadius: 10,
              overflow: 'hidden',
              backgroundColor: theme.cardBg,
            }}
          >
            {[
              { label: 'Beginner', value: 'beginner' },
              { label: 'Intermediate', value: 'intermediate' },
              { label: 'Advanced', value: 'advanced' },
              { label: 'All Levels', value: 'all_levels' },
            ].map((item, itemIndex) => {
              const selected = level === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    setLevel(item.value);
                    setLevelListOpen(false);
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: selected ? (theme.isDark ? '#1e293b' : '#eff6ff') : 'transparent',
                    borderTopWidth: itemIndex > 0 ? 1 : 0,
                    borderTopColor: theme.cardBorder,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.textPrimary, fontWeight: selected ? '700' : '500' }}>{item.label}</Text>
                    {selected ? <MaterialCommunityIcons name="check" size={14} color="#2563eb" /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '700' }]}>
          Status
        </Text>
        <Pressable
          style={[
            portalStyles.input,
            {
              minHeight: 46,
              justifyContent: 'center',
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
            },
          ]}
          onPress={() => {
            setStatusListOpen((prev) => !prev);
            setCategoryListOpen(false);
            setLevelListOpen(false);
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Text style={portalStyles.secondaryBtnText}>
              {`${status.charAt(0).toUpperCase()}${status.slice(1)}`}
            </Text>
            <MaterialCommunityIcons
              name={statusListOpen ? 'chevron-down' : 'chevron-right'}
              size={16}
              color={theme.textPrimary}
            />
          </View>
        </Pressable>
        {statusListOpen ? (
          <View
            style={{
              borderWidth: 1,
              borderColor: theme.cardBorder,
              borderRadius: 10,
              overflow: 'hidden',
              backgroundColor: theme.cardBg,
            }}
          >
            {[
              { label: 'Draft', value: 'draft' },
              { label: 'Published', value: 'published' },
              { label: 'Archived', value: 'archived' },
            ].map((item, itemIndex) => {
              const selected = status === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    setStatus(item.value);
                    setStatusListOpen(false);
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: selected ? (theme.isDark ? '#1e293b' : '#eff6ff') : 'transparent',
                    borderTopWidth: itemIndex > 0 ? 1 : 0,
                    borderTopColor: theme.cardBorder,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.textPrimary, fontWeight: selected ? '700' : '500' }}>{item.label}</Text>
                    {selected ? <MaterialCommunityIcons name="check" size={14} color="#2563eb" /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        <TextInput
          value={estimatedHours}
          onChangeText={setEstimatedHours}
          placeholder="Estimated hours"
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
          keyboardType="numeric"
        />
        <TextInput
          value={price}
          onChangeText={setPrice}
          placeholder="Path price"
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
          keyboardType="numeric"
        />

        <View style={[portalStyles.listCard, { backgroundColor: theme.pageBg, borderColor: theme.cardBorder, gap: 6 }]}>
          <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>Select courses</Text>
          {availableCourses.map((course) => (
            <Pressable
              key={course?.id}
              onPress={() => toggleCourse(course?.id)}
              style={{
                borderWidth: 1,
                borderColor: selectedCourseIds.includes(course?.id) ? '#60a5fa' : theme.cardBorder,
                borderRadius: 10,
                paddingHorizontal: 10,
                paddingVertical: 8,
                backgroundColor: selectedCourseIds.includes(course?.id) ? '#eff6ff' : theme.cardBg,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: theme.textPrimary, fontSize: 12, fontWeight: '600', flex: 1 }} numberOfLines={1}>
                  {course?.title}
                </Text>
                <MaterialCommunityIcons
                  name={selectedCourseIds.includes(course?.id) ? 'check-circle-outline' : 'chevron-right'}
                  size={14}
                  color={selectedCourseIds.includes(course?.id) ? '#2563eb' : theme.textMuted}
                />
              </View>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Pressable style={portalStyles.chatSendBtn} onPress={handleSubmit} disabled={saving || !title.trim()}>
            <Text style={portalStyles.chatSendText}>
              {saving ? 'Saving...' : editingPathId ? 'Save Path' : 'Add Path'}
            </Text>
          </Pressable>
          {editingPathId ? (
            <Pressable style={portalStyles.secondaryBtn} onPress={resetForm}>
              <Text style={portalStyles.secondaryBtnText}>Cancel Edit</Text>
            </Pressable>
          ) : null}
        </View>
        {categories.length > 0 ? (
          <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
            Categories: {categories.map((item) => item.name).slice(0, 5).join(', ')}
            {categories.length > 5 ? ' ...' : ''}
          </Text>
        ) : null}
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading && paths.length === 0 ? <Text style={portalStyles.empty}>No learning paths yet.</Text> : null}

      {!loading &&
        paths.map((pathItem) => (
          <View
            key={pathItem?.id}
            style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 6 }]}
          >
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{pathItem?.title}</Text>
            {String(pathItem?.description || '').trim() ? (
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                {String(pathItem.description).trim()}
              </Text>
            ) : null}
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Category: {pathItem?.categoryName || 'Uncategorized'} | Level: {pathItem?.level || '-'} | Status: {pathItem?.status || '-'}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Price: ${Number(pathItem?.price || 0).toFixed(2)} | Estimated hours: {Number(pathItem?.estimatedHours || 0)}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Courses: {Number(pathItem?.coursesCount || 0)} | Students: {Number(pathItem?.enrolledStudents || 0)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <Pressable
                style={portalStyles.secondaryBtn}
                onPress={() => {
                  setEditingPathId(String(pathItem?.id || ''));
                  setTitle(String(pathItem?.title || ''));
                  setDescription(String(pathItem?.description || ''));
                  setCategoryId(String(pathItem?.categoryId || ''));
                  setLevel(String(pathItem?.level || 'beginner'));
                  setStatus(String(pathItem?.status || 'draft'));
                  setEstimatedHours(String(Number(pathItem?.estimatedHours || 0)));
                  setPrice(String(Number(pathItem?.price || 0)));
                  setSelectedCourseIds(Array.isArray(pathItem?.courseIds) ? pathItem.courseIds : []);
                }}
              >
                <Text style={portalStyles.secondaryBtnText}>Edit</Text>
              </Pressable>
              <Pressable
                style={[portalStyles.notificationActionBtn, { backgroundColor: '#fee2e2' }]}
                onPress={() => handleDelete(pathItem)}
                disabled={deletingId === String(pathItem?.id || '')}
              >
                <Text style={[portalStyles.notificationActionText, { color: '#b91c1c' }]}>
                  {deletingId === String(pathItem?.id || '') ? 'Deleting...' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
    </View>
  );
}

const money = (value) => {
  const numeric = typeof value === 'string' ? Number(value) : Number(value ?? 0);
  const safe = Number.isFinite(numeric) ? numeric : 0;
  const sign = safe < 0 ? '-' : '';
  const abs = Math.abs(safe);
  return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getTeacherProfit = (tx) => {
  const raw = Number(tx?.teacherShare ?? 0);
  if (Number.isFinite(raw) && raw !== 0) return raw;
  if (String(tx?.type || '') !== 'enrollment') return 0;

  const pct = Number(tx?.teacherSharePct ?? NaN);
  const amount = Number(tx?.amount ?? 0);
  if (!Number.isFinite(pct) || !Number.isFinite(amount)) return 0;
  return (amount * pct) / 100;
};

function FinanceTransactionsPage({ apiFetch, theme }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const trimmed = String(month || '').trim();
      const validMonth = /^\d{4}-\d{2}$/.test(trimmed) ? trimmed : new Date().toISOString().slice(0, 7);
      const res = await apiFetch(`/api/finance/transactions?month=${encodeURIComponent(validMonth)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load transactions');
      setTransactions(Array.isArray(data?.transactions) ? data.transactions : []);
    } catch (err) {
      setError(err?.message || 'Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const stats = useMemo(() => {
    const income = transactions
      .filter((item) => Number(item?.amount || 0) > 0)
      .reduce((sum, item) => sum + Number(item?.amount || 0), 0);
    const teacherProfit = transactions.reduce((sum, item) => sum + getTeacherProfit(item), 0);
    const platformProfit = transactions.reduce((sum, item) => sum + Number(item?.platformShare || 0), 0);

    return {
      count: transactions.length,
      income,
      teacherProfit,
      platformProfit,
    };
  }, [transactions]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return transactions.filter((item) => {
      const typeMatches = typeFilter === 'all' || String(item?.type || '') === typeFilter;
      if (!typeMatches) return false;
      if (!normalizedQuery) return true;
      const hay = [
        item?.id,
        item?.studentName,
        item?.teacherName,
        item?.courseTitle,
        item?.type,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [transactions, query, typeFilter]);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <View>
          <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Finance Transactions</Text>
          <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
            Monitor payments and refunds across the platform.
          </Text>
        </View>
      </View>

      <View style={portalStyles.statsGrid}>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{money(stats.income)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Income (month)</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{money(stats.teacherProfit)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Teacher profit</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{money(stats.platformProfit)}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Platform profit</Text>
        </View>
        <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
          <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{stats.count}</Text>
          <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Transactions count</Text>
        </View>
      </View>

      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 8 }]}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by id / student / teacher / course..."
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
        />
        <TextInput
          value={month}
          onChangeText={setMonth}
          placeholder="Month (YYYY-MM)"
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
          autoCapitalize="none"
        />
        <View style={portalStyles.financeFilterRow}>
          <Pressable
            onPress={() => setTypeFilter('all')}
            style={[portalStyles.secondaryBtn, typeFilter === 'all' && portalStyles.financeFilterActive]}
          >
            <Text style={portalStyles.secondaryBtnText}>All</Text>
          </Pressable>
          <Pressable
            onPress={() => setTypeFilter('enrollment')}
            style={[portalStyles.secondaryBtn, typeFilter === 'enrollment' && portalStyles.financeFilterActive]}
          >
            <Text style={portalStyles.secondaryBtnText}>Enrollment</Text>
          </Pressable>
          <Pressable
            onPress={() => setTypeFilter('refund')}
            style={[portalStyles.secondaryBtn, typeFilter === 'refund' && portalStyles.financeFilterActive]}
          >
            <Text style={portalStyles.secondaryBtnText}>Refund</Text>
          </Pressable>
        </View>
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

      {!loading && !error && filtered.length === 0 ? (
        <Text style={portalStyles.empty}>No transactions found.</Text>
      ) : null}

      {!loading &&
        !error &&
        filtered.map((tx, index) => (
          <View
            key={tx?.id || `tx-${index}`}
            style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 5 }]}
          >
            <View style={portalStyles.financeTransactionTopRow}>
              <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, flex: 1 }]} numberOfLines={1}>
                {tx?.studentName || tx?.teacherName || tx?.courseTitle || 'Transaction'}
              </Text>
              <View
                style={[
                  portalStyles.financeTypePill,
                  String(tx?.type || '') === 'refund'
                    ? portalStyles.financeTypePillRefund
                    : portalStyles.financeTypePillEnrollment,
                ]}
              >
                <Text
                  style={[
                    portalStyles.financeTypePillText,
                    String(tx?.type || '') === 'refund'
                      ? portalStyles.financeTypePillTextRefund
                      : portalStyles.financeTypePillTextEnrollment,
                  ]}
                >
                  {String(tx?.type || 'enrollment')}
                </Text>
              </View>
            </View>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              {tx?.dateTime || tx?.date || '-'} | Status: {tx?.status || '-'}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Course: {tx?.courseTitle || '-'}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Student: {tx?.studentName || '-'} | Teacher: {tx?.teacherName || '-'}
            </Text>
            <View style={portalStyles.financeTransactionStatsRow}>
              <View style={portalStyles.financeTransactionStatCell}>
                <Text style={[portalStyles.financeTransactionStatLabel, { color: theme.textMuted }]}>Course Price</Text>
                <Text style={[portalStyles.financeTransactionStatValue, { color: theme.textPrimary }]}>
                  {money(tx?.coursePrice ?? tx?.amount ?? 0)}
                </Text>
              </View>
              <View style={portalStyles.financeTransactionStatCell}>
                <Text style={[portalStyles.financeTransactionStatLabel, { color: theme.textMuted }]}>Teacher Profit</Text>
                <Text style={[portalStyles.financeTransactionStatValue, { color: theme.textPrimary }]}>
                  {money(getTeacherProfit(tx))}
                </Text>
              </View>
              <View style={portalStyles.financeTransactionStatCell}>
                <Text style={[portalStyles.financeTransactionStatLabel, { color: theme.textMuted }]}>Method</Text>
                <Text style={[portalStyles.financeTransactionStatValue, { color: theme.textPrimary }]}>
                  {tx?.method || '-'}
                </Text>
              </View>
            </View>
          </View>
        ))}
    </View>
  );
}

function FinanceReportsPage({ apiFetch, theme }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState({
    income: 0,
    teacherProfit: 0,
    platformProfit: 0,
    byType: {},
    count: 0,
  });
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const trimmed = String(month || '').trim();
      const validMonth = /^\d{4}-\d{2}$/.test(trimmed) ? trimmed : new Date().toISOString().slice(0, 7);
      const res = await apiFetch(`/api/finance/reports?month=${encodeURIComponent(validMonth)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load reports');
      setReport({
        income: Number(data?.income || 0),
        teacherProfit: Number(data?.teacherProfit || 0),
        platformProfit: Number(data?.platformProfit || 0),
        byType: data?.byType && typeof data.byType === 'object' ? data.byType : {},
        count: Number(data?.count || 0),
      });
    } catch (err) {
      setError(err?.message || 'Failed to load reports');
      setReport({
        income: 0,
        teacherProfit: 0,
        platformProfit: 0,
        byType: {},
        count: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [month]);

  const enrollmentCount = Number(report?.byType?.enrollment || 0);
  const refundCount = Number(report?.byType?.refund || 0);
  const expectedRevenue = Math.round(Number(report?.income || 0) * 1.08);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <View style={{ flex: 1 }}>
          <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Finance Reports</Text>
          <Text style={[portalStyles.adminSubTitle, { color: theme.textMuted }]}>
            Monthly finance summary with exportable-ready metrics.
          </Text>
        </View>
        <Pressable style={portalStyles.secondaryBtn} onPress={load} disabled={loading}>
          <Text style={portalStyles.secondaryBtnText}>{loading ? 'Loading...' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 8 }]}>
        <TextInput
          value={month}
          onChangeText={setMonth}
          placeholder="Month (YYYY-MM)"
          placeholderTextColor="#94a3b8"
          style={portalStyles.input}
          autoCapitalize="none"
        />
        <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
          {loading ? 'Loading report...' : error ? error : `Monthly summary for ${month}`}
        </Text>
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading ? (
        <>
          <View style={portalStyles.statsGrid}>
            <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{money(report.income)}</Text>
              <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Income</Text>
            </View>
            <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{money(report.teacherProfit)}</Text>
              <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Teacher Profit</Text>
            </View>
            <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{money(report.platformProfit)}</Text>
              <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Platform Profit</Text>
            </View>
            <View style={[portalStyles.statCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}>
              <Text style={[portalStyles.statValue, { color: theme.textPrimary }]}>{Number(report.count || 0)}</Text>
              <Text style={[portalStyles.statLabel, { color: theme.textMuted }]}>Transactions Count</Text>
            </View>
          </View>

          <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 6 }]}>
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>Transactions by type</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Enrollments: {enrollmentCount}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Refunds: {refundCount}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Total: {Number(report.count || 0)}
            </Text>
          </View>

          <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 6 }]}>
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>Profit split summary</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Teacher profit: {money(report.teacherProfit)}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Platform profit: {money(report.platformProfit)}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Income: {money(report.income)}
            </Text>
          </View>

          <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 6 }]}>
            <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>AI forecast</Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Expected revenue: {money(expectedRevenue)}
            </Text>
            <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
              Trend: +8% vs current month
            </Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

function AdminCertificatesPage({ apiFetch, theme }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [certificates, setCertificates] = useState([]);
  const [viewLoadingId, setViewLoadingId] = useState('');
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch('/api/admin/certificates', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load certificates');
      setCertificates(Array.isArray(data?.certificates) ? data.certificates : []);
    } catch (err) {
      setError(err?.message || 'Failed to load certificates');
      setCertificates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleViewCertificate = async (certId) => {
    if (!certId) return;
    try {
      setViewLoadingId(String(certId));
      setError('');
      const res = await apiFetch(`/api/admin/certificates/${encodeURIComponent(String(certId))}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load certificate');
      setSelectedCertificate(data?.certificate || null);
    } catch (err) {
      setError(err?.message || 'Failed to load certificate preview');
      setSelectedCertificate(null);
    } finally {
      setViewLoadingId('');
    }
  };

  const handleDownloadCertificate = async () => {
    if (!selectedCertificate?.id) return;
    try {
      setDownloading(true);
      setError('');
      const fileUri = await downloadCertificatePdfNative({
        certificate: selectedCertificate,
        baseUrl: getActiveApiBaseUrl(),
      });
      Alert.alert('Download complete', `Certificate saved to:\n${fileUri}`);
    } catch (err) {
      setError(err?.message || 'Failed to download certificate');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Certificates</Text>
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

      {!loading && selectedCertificate ? (
        <CertificatePreviewCard
          certificate={selectedCertificate}
          theme={theme}
          baseUrl={getActiveApiBaseUrl()}
          onBack={() => setSelectedCertificate(null)}
          onDownload={handleDownloadCertificate}
          downloading={downloading}
        />
      ) : null}

      {!loading && !selectedCertificate && certificates.length === 0 ? (
        <Text style={portalStyles.empty}>No certificates found.</Text>
      ) : null}

      {!loading && !selectedCertificate
        ? certificates.map((cert) => (
            <View
              key={cert.id}
              style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder }]}
            >
              <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                Certificate #{cert.certificateNo || cert.id || '-'}
              </Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                Student: {cert.student?.name || '-'}
              </Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                Email: {cert.student?.email || '-'}
              </Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                Course: {cert.course?.title || '-'}
              </Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                Teacher: {cert.teacher?.name || '-'}
              </Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                Issued: {cert.issuedAt ? new Date(cert.issuedAt).toLocaleString() : '-'}
              </Text>
              <Pressable
                style={[portalStyles.notificationActionBtn, { alignSelf: 'flex-start', marginTop: 8 }]}
                onPress={() => handleViewCertificate(cert.id)}
                disabled={Boolean(viewLoadingId)}
              >
                <Text style={portalStyles.notificationActionText}>
                  {viewLoadingId === String(cert.id) ? 'Loading...' : 'View'}
                </Text>
              </Pressable>
            </View>
          ))
        : null}
    </View>
  );
}

function AdminNotificationsPage({ apiFetch, theme }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [expandedMap, setExpandedMap] = useState({});

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiFetch('/api/admin/notifications', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to load notifications');
      setItems(Array.isArray(data?.notifications) ? data.notifications : []);
    } catch (err) {
      setError(err?.message || 'Failed to load notifications');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkAsRead = async (id) => {
    if (!id) return;
    try {
      setUpdating(true);
      setError('');
      const res = await apiFetch(`/api/admin/notifications/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to mark notification as read');
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to mark notification as read');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setUpdating(true);
      setError('');
      const res = await apiFetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to mark all as read');
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to mark all as read');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Notifications</Text>
      </View>

      <View style={portalStyles.actionRow}>
        <Pressable
          onPress={handleMarkAllAsRead}
          disabled={loading || updating}
          style={portalStyles.secondaryBtn}
        >
          <Text style={portalStyles.secondaryBtnText}>Mark All As Read</Text>
        </Pressable>
      </View>

      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}
      {!loading && items.length === 0 ? <Text style={portalStyles.empty}>No notifications.</Text> : null}

      {!loading &&
        items.map((item, idx) => {
          const id = String(item?.id || `notification-${idx}`);
          const title = item?.title || 'Notification';
          const message = String(item?.message || '').trim();
          const firstSentence = getFirstSentence(message);
          const hasMore = Boolean(message) && firstSentence !== message;
          const expanded = Boolean(expandedMap[id]);
          const isRead = Boolean(item?.readAt);
          const createdAt = item?.createdAt ? new Date(item.createdAt).toLocaleString() : '';
          return (
            <View
              key={id}
              style={[
                portalStyles.listCard,
                {
                  backgroundColor: theme.cardBg,
                  borderColor: isRead ? theme.cardBorder : '#60a5fa',
                },
              ]}
            >
              <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>{title}</Text>
              <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>
                {expanded || !hasMore ? message || 'No additional details.' : firstSentence}
              </Text>
              <View style={portalStyles.notificationMetaRow}>
                {createdAt ? (
                  <Text style={[portalStyles.notificationMetaText, { color: theme.textMuted }]}>
                    {createdAt}
                  </Text>
                ) : null}
                {hasMore ? (
                  <Pressable
                    onPress={() =>
                      setExpandedMap((prev) => ({
                        ...prev,
                        [id]: !Boolean(prev[id]),
                      }))
                    }
                  >
                    <Text style={portalStyles.notificationLinkText}>
                      {expanded ? 'Show less' : 'Show more'}
                    </Text>
                  </Pressable>
                ) : null}
                {!isRead ? (
                  <Pressable
                    onPress={() => handleMarkAsRead(item?.id)}
                    disabled={updating}
                    style={portalStyles.notificationActionBtn}
                  >
                    <Text style={portalStyles.notificationActionText}>Mark as read</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        })}
    </View>
  );
}

function AdminMessagesPage({ apiFetch, theme }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const loadThreads = async () => {
    const res = await apiFetch('/api/admin/messages', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to load threads');
    const list = Array.isArray(data?.threads) ? data.threads : [];
    setThreads(list);
    if (!activeThread && list.length > 0) {
      setActiveThread(list[0]);
    }
  };

  const loadMessages = async (teacherId) => {
    if (!teacherId) {
      setMessages([]);
      return;
    }
    const res = await apiFetch(`/api/admin/messages?teacherId=${encodeURIComponent(teacherId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Failed to load conversation');
    setMessages(Array.isArray(data?.messages) ? data.messages : []);
  };

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');
      await loadThreads();
    } catch (err) {
      setError(err?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeThread?.teacherId) {
      loadMessages(activeThread.teacherId).catch((err) =>
        setError(err?.message || 'Failed to load conversation')
      );
    }
  }, [activeThread?.teacherId]);

  const handleSend = async () => {
    const body = newMessage.trim();
    if (!body || !activeThread?.teacherId) return;
    try {
      const res = await apiFetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teacherId: activeThread.teacherId,
          body,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Failed to send message');
      setNewMessage('');
      await loadMessages(activeThread.teacherId);
      await loadThreads();
    } catch (err) {
      setError(err?.message || 'Failed to send message');
    }
  };

  return (
    <View style={portalStyles.adminWrap}>
      <View style={portalStyles.adminHeaderRow}>
        <Text style={[portalStyles.adminHeaderTitle, { color: theme.textPrimary }]}>Teacher Messages</Text>
      </View>
      {error ? <Text style={portalStyles.error}>{error}</Text> : null}
      {loading ? <ActivityIndicator color="#0d3b66" style={portalStyles.loader} /> : null}

      {!loading ? (
        <>
          <SectionCard title="Threads" theme={theme}>
            {threads.length === 0 ? (
              <Text style={portalStyles.empty}>No threads yet.</Text>
            ) : (
              threads.map((thread) => (
                <Pressable
                  key={thread.id}
                  style={[
                    portalStyles.threadItem,
                    activeThread?.id === thread.id && portalStyles.threadItemActive,
                  ]}
                  onPress={() => setActiveThread(thread)}
                >
                  <Text style={portalStyles.threadTeacher}>{thread.teacherName}</Text>
                  <Text style={portalStyles.threadMeta}>
                    Unread: {Number(thread.unreadCount || 0)}
                  </Text>
                </Pressable>
              ))
            )}
          </SectionCard>

          <SectionCard title={activeThread ? `Chat with ${activeThread.teacherName}` : 'Conversation'} theme={theme}>
            {messages.length === 0 ? (
              <Text style={portalStyles.empty}>No messages.</Text>
            ) : (
              messages.map((message) => (
                <View
                  key={message.id}
                  style={[
                    portalStyles.chatBubble,
                    message.senderRole === 'admin'
                      ? portalStyles.chatBubbleAdmin
                      : portalStyles.chatBubbleTeacher,
                  ]}
                >
                  <Text style={portalStyles.chatText}>{message.body}</Text>
                </View>
              ))
            )}
            {activeThread ? (
              <View style={portalStyles.chatComposerRow}>
                <TextInput
                  value={newMessage}
                  onChangeText={setNewMessage}
                  style={portalStyles.chatInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#94a3b8"
                />
                <Pressable style={portalStyles.chatSendBtn} onPress={handleSend}>
                  <Text style={portalStyles.chatSendText}>Send</Text>
                </Pressable>
              </View>
            ) : null}
          </SectionCard>
        </>
      ) : null}
    </View>
  );
}

export default function AdminWorkspace({
  user,
  onBackHome,
  onLogout,
  apiFetch,
  themeMode = 'light',
  onToggleTheme = () => {},
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const adminTabs = useMemo(() => MOBILE_TABS.admin || [], []);
  const [activeTabId, setActiveTabId] = useState(adminTabs[0]?.id || 'admin-dashboard');
  const [activeFeatureId, setActiveFeatureId] = useState(adminTabs[0]?.featureIds?.[0] || 'admin-stats');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [topBarHeight, setTopBarHeight] = useState(68);
  const topBarOffset = useRef(new Animated.Value(0)).current;
  const topBarVisibleRef = useRef(true);
  const lastScrollYRef = useRef(0);
  const activeTab = useMemo(
    () => adminTabs.find((tab) => tab.id === activeTabId) || adminTabs[0] || null,
    [activeTabId, adminTabs]
  );
  const theme = useMemo(() => getThemeColors(themeMode), [themeMode]);
  const activeFeature = useMemo(
    () =>
      ROLE_FEATURES.admin.find((feature) => feature.id === activeFeatureId) ||
      ROLE_FEATURES.admin[0],
    [activeFeatureId]
  );
  const mobileMorePanel = !isDesktop;
  const navTabs = useMemo(
    () => (mobileMorePanel ? adminTabs.filter((tab) => tab.id === 'admin-more') : adminTabs),
    [adminTabs, mobileMorePanel]
  );
  const renderAdminNavItems = () => (
    <>
      <Text
        style={[
          portalStyles.adminSidebarUser,
          mobileMorePanel && portalStyles.adminSidebarUserMobile,
        ]}
        numberOfLines={1}
      >
        {user?.fullName || user?.email || 'Administrator'}
      </Text>
      {navTabs.map((tab) => (
        <View
          key={tab.id}
          style={[
            portalStyles.adminSubmenuWrap,
            mobileMorePanel && portalStyles.adminSubmenuWrapMobile,
          ]}
        >
          <Text
            style={[
              portalStyles.adminSubmenuGroupTitle,
              mobileMorePanel && portalStyles.adminSubmenuGroupTitleMobile,
            ]}
          >
            {tab.title}
          </Text>
          {tab.featureIds.map((featureId) => {
            const feature = ROLE_FEATURES.admin.find((item) => item.id === featureId);
            if (!feature) return null;
            const iconName = FEATURE_ICON_MAP[feature.id] || 'circle-medium';
            return (
              <Pressable
                key={feature.id}
                style={[
                  portalStyles.adminSubmenuItem,
                  mobileMorePanel && portalStyles.adminSubmenuItemMobile,
                  activeFeatureId === feature.id && portalStyles.adminSubmenuItemActive,
                  activeFeatureId === feature.id &&
                    mobileMorePanel &&
                    portalStyles.adminSubmenuItemActiveMobile,
                ]}
                onPress={() => {
                  setActiveFeatureId(feature.id);
                  setActiveTabId(tab.id);
                  if (!isDesktop) setSidebarOpen(false);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <MaterialCommunityIcons
                    name={iconName}
                    size={16}
                    color={
                      activeFeatureId === feature.id
                        ? mobileMorePanel
                          ? '#1d4ed8'
                          : '#0f2740'
                        : mobileMorePanel
                          ? '#64748b'
                          : '#cbd5e1'
                    }
                  />
                  <Text
                    style={[
                      portalStyles.adminSubmenuText,
                      mobileMorePanel && portalStyles.adminSubmenuTextMobile,
                      activeFeatureId === feature.id && portalStyles.adminSubmenuTextActive,
                      activeFeatureId === feature.id &&
                        mobileMorePanel &&
                        portalStyles.adminSubmenuTextActiveMobile,
                    ]}
                  >
                    {feature.title}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </>
  );

  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (isDesktop || !activeTab) return;
    if (!activeTab.featureIds.includes(activeFeatureId)) {
      const nextFeatureId = activeTab.featureIds[0] || 'admin-stats';
      if (nextFeatureId !== activeFeatureId) {
        setActiveFeatureId(nextFeatureId);
      }
    }
  }, [activeFeatureId, activeTab, isDesktop]);

  const setTopBarVisible = (visible) => {
    if (topBarVisibleRef.current === visible) return;
    topBarVisibleRef.current = visible;
    Animated.timing(topBarOffset, {
      toValue: visible ? 0 : -topBarHeight,
      duration: 180,
      useNativeDriver: true,
    }).start();
  };

  const renderActivePage = () => {
    switch (activeFeature.id) {
      case 'admin-stats':
        return <AdminDashboardView apiFetch={apiFetch} theme={theme} />;
      case 'admin-recent-activity':
        return (
          <DataListPage
            title="Recent Activity"
            endpoint="/api/dashboard/recent-activity"
            apiFetch={apiFetch}
            listKey="activities"
            theme={theme}
            renderItem={(item) => (
              <>
                <Text style={portalStyles.listItemTitle}>{item.description}</Text>
                <Text style={portalStyles.listItemMeta}>{item.type}</Text>
                <Text style={portalStyles.listItemMeta}>{new Date(item.time).toLocaleString()}</Text>
              </>
            )}
          />
        );
      case 'admin-revenue-trend':
        return <RevenueTrendPage apiFetch={apiFetch} theme={theme} />;
      case 'admin-courses':
        return (
          <AdminCoursesPage
            apiFetch={apiFetch}
            theme={theme}
            onNavigateFeature={(featureId) => {
              if (!featureId) return;
              setActiveFeatureId(featureId);
              const ownerTab = adminTabs.find((tab) => (tab.featureIds || []).includes(featureId));
              if (ownerTab?.id) setActiveTabId(ownerTab.id);
            }}
          />
        );
      case 'admin-teachers':
        return (
          <UserCrudPage
            key="admin-teachers-crud"
            title="Teachers CRUD (Mobile)"
            entityLabel="Teacher"
            endpoint="/api/teachers"
            listKey="teachers"
            itemKey="teacher"
            apiFetch={apiFetch}
            theme={theme}
            deleteFailureFallback="Failed to delete teacher. Reassign teacher courses and try again."
          />
        );
      case 'admin-students':
        return (
          <UserCrudPage
            key="admin-students-crud"
            title="Students CRUD (Mobile)"
            entityLabel="Student"
            endpoint="/api/students"
            listKey="students"
            itemKey="student"
            apiFetch={apiFetch}
            theme={theme}
            deleteFailureFallback="Failed to delete student."
          />
        );
      case 'admin-categories':
        return (
          <AdminCategoriesCrudPage
            apiFetch={apiFetch}
            theme={theme}
            onNavigateFeature={(featureId) => {
              if (!featureId) return;
              setActiveFeatureId(featureId);
              const ownerTab = adminTabs.find((tab) => (tab.featureIds || []).includes(featureId));
              if (ownerTab?.id) setActiveTabId(ownerTab.id);
            }}
          />
        );
      case 'admin-paths':
        return (
          <AdminPathsCrudPage
            apiFetch={apiFetch}
            theme={theme}
            onNavigateFeature={(featureId) => {
              if (!featureId) return;
              setActiveFeatureId(featureId);
              const ownerTab = adminTabs.find((tab) => (tab.featureIds || []).includes(featureId));
              if (ownerTab?.id) setActiveTabId(ownerTab.id);
            }}
          />
        );
      case 'admin-certificates':
        return <AdminCertificatesPage apiFetch={apiFetch} theme={theme} />;
      case 'admin-notifications':
        return <AdminNotificationsPage apiFetch={apiFetch} theme={theme} />;
      case 'admin-messages':
        return <AdminMessagesPage apiFetch={apiFetch} theme={theme} />;
      case 'admin-transactions':
        return <FinanceTransactionsPage apiFetch={apiFetch} theme={theme} />;
      case 'admin-reports':
        return <FinanceReportsPage apiFetch={apiFetch} theme={theme} />;
      default:
        return <AdminDashboardView apiFetch={apiFetch} theme={theme} />;
    }
  };

  return (
    <View style={[portalStyles.adminShellPage, { backgroundColor: theme.pageBg }]}>
      <Animated.View
        style={[
          portalStyles.adminShellTopBar,
          {
            paddingTop: Math.max(insets.top, 8),
            backgroundColor: theme.topBg,
            borderBottomColor: theme.border,
            transform: [{ translateY: topBarOffset }],
          },
        ]}
        onLayout={(event) => {
          const measuredHeight = Math.round(event.nativeEvent.layout.height);
          if (measuredHeight > 0 && measuredHeight !== topBarHeight) {
            setTopBarHeight(measuredHeight);
          }
        }}
      >
        <View style={portalStyles.adminBrandWrap}>
          <View style={portalStyles.adminLogoWrap}>
            <Image
              source={require('../../../assets/alaa.png')}
              style={[portalStyles.adminLogo, { tintColor: theme.isDark ? '#f8fafc' : '#0f2740' }]}
              resizeMode="contain"
            />
          </View>
        </View>
        <View style={portalStyles.adminTopActions}>
          <Pressable style={portalStyles.themeToggleBtn} onPress={onToggleTheme}>
            <MaterialCommunityIcons
              name={theme.isDark ? 'weather-sunny' : 'weather-night'}
              size={20}
              color={theme.isDark ? '#fbbf24' : '#334155'}
            />
          </Pressable>
          <Pressable onPress={onBackHome} style={portalStyles.themeToggleBtn}>
            <MaterialCommunityIcons
              name="home"
              size={20}
              color={theme.isDark ? '#e2e8f0' : '#334155'}
            />
          </Pressable>
          <Pressable onPress={onLogout} style={portalStyles.themeToggleBtn}>
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={theme.isDark ? '#fecaca' : '#b91c1c'}
            />
          </Pressable>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          portalStyles.adminShellBody,
          {
            marginTop: topBarHeight,
            transform: [{ translateY: topBarOffset }],
          },
        ]}
      >
        {isDesktop && sidebarOpen ? (
          <ScrollView
            style={portalStyles.adminSidebar}
            contentContainerStyle={portalStyles.adminSidebarContent}
          >
            {renderAdminNavItems()}
          </ScrollView>
        ) : null}

        <ScrollView
          style={portalStyles.adminContent}
          contentContainerStyle={[
            portalStyles.adminContentInner,
            { backgroundColor: theme.pageBg },
            !isDesktop && { paddingBottom: Math.max(insets.bottom + 84, 96) },
          ]}
          scrollEventThrottle={16}
          onScroll={(event) => {
            const currentY = event.nativeEvent.contentOffset.y;
            if (currentY <= 0) {
              setTopBarVisible(true);
              lastScrollYRef.current = 0;
              return;
            }

            const delta = currentY - lastScrollYRef.current;
            if (delta > 8) {
              setTopBarVisible(false);
            } else if (delta < -8) {
              setTopBarVisible(true);
            }
            lastScrollYRef.current = currentY;
          }}
        >
          {renderActivePage()}
        </ScrollView>

        {!isDesktop && sidebarOpen ? (
          <View style={portalStyles.adminMenuBackdrop}>
            <Pressable
              style={portalStyles.adminMenuBackdropTouch}
              onPress={() => setSidebarOpen(false)}
            />
            <View style={portalStyles.adminDrawerMobile}>
            <ScrollView
              style={portalStyles.adminDrawerScroll}
              contentContainerStyle={[
                portalStyles.adminSidebarContent,
                portalStyles.adminSidebarContentMobile,
              ]}
              showsVerticalScrollIndicator
            >
                <View style={portalStyles.modalHandle} />
                <View style={portalStyles.modalSheetHeader}>
                  <Text style={portalStyles.modalSheetTitle}>More Options</Text>
                  <Text style={portalStyles.modalSheetSubtitle}>Quick access to extra modules</Text>
                </View>
                {renderAdminNavItems()}
              </ScrollView>
            </View>
          </View>
        ) : null}
      </Animated.View>

      {!isDesktop ? (
        <View
          style={[
            portalStyles.bottomNav,
            {
              paddingBottom: Math.max(insets.bottom, 8),
              backgroundColor: theme.navBg,
              borderColor: theme.navBorder,
            },
          ]}
        >
          {adminTabs.map((tab) => {
            const active = tab.id === activeTabId;
            return (
              <Pressable
                key={`admin-bottom-${tab.id}`}
                onPress={() => {
                  if (tab.id === 'admin-more') {
                    setSidebarOpen(true);
                    return;
                  }
                  setActiveTabId(tab.id);
                  const firstFeatureId = tab.featureIds?.[0];
                  if (firstFeatureId && firstFeatureId !== activeFeatureId) {
                    setActiveFeatureId(firstFeatureId);
                  }
                }}
                style={portalStyles.bottomNavItem}
              >
                <MaterialCommunityIcons
                  name={tab.icon || 'circle'}
                  size={18}
                  color={active ? '#0d3b66' : '#64748b'}
                />
                <Text style={[portalStyles.bottomNavLabel, active && portalStyles.bottomNavLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

    </View>
  );
}
