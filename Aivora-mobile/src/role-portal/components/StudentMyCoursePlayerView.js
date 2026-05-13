import { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { portalStyles } from '../styles';
let OptionalWebView = null;
try {
  OptionalWebView = require('react-native-webview')?.WebView || null;
} catch {
  OptionalWebView = null;
}

const toNumber = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return n;
};

const URL_REGEX = /(https?:\/\/[^\s]+)/gi;
const normalizeVideoUrl = (rawUrl) => {
  const input = String(rawUrl || '').trim();
  if (!input) return '';
  try {
    const url = new URL(input);
    const host = String(url.hostname || '').toLowerCase();
    if (host.includes('youtube.com')) {
      const vid = url.searchParams.get('v');
      if (vid) return `https://www.youtube.com/embed/${vid}`;
      if (url.pathname.startsWith('/embed/')) {
        const existingId = String(url.pathname || '').split('/').filter(Boolean)[1];
        if (existingId) return `https://www.youtube.com/embed/${existingId}`;
        return input;
      }
    }
    if (host === 'youtu.be') {
      const vid = String(url.pathname || '').replace('/', '').trim();
      if (vid) return `https://www.youtube.com/embed/${vid}`;
    }
    if (host.includes('vimeo.com')) {
      const parts = String(url.pathname || '').split('/').filter(Boolean);
      const vid = parts[parts.length - 1];
      if (vid && /^\d+$/.test(vid)) return `https://player.vimeo.com/video/${vid}`;
    }
    return input;
  } catch {
    return input;
  }
};

const getYouTubeVideoId = (rawUrl) => {
  const value = String(rawUrl || '').trim();
  if (!value) return '';
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{6,})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/,
  ];
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
};

const buildHtmlPreviewDocument = (code) => `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body>${String(code || '')}</body></html>`;

const parseLessonContent = (content) => {
  const source = String(content || '').replace(/\\`/g, '`');
  const segments = [];
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
    if (tokenStart > cursor) segments.push({ type: 'text', value: source.slice(cursor, tokenStart) });

    if (token === '```') {
      const codeStart = tokenRegex.lastIndex;
      let codeEnd = source.indexOf('```', codeStart);
      let advanceBy = 3;
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
    if (normalizedToken.includes('video')) segments.push({ type: 'video', value });
    else if (normalizedToken.includes('starter')) segments.push({ type: 'starter', value });
    else segments.push({ type: 'answer', value });
    cursor = valueEnd + 2;
  }

  return segments.filter((segment) => segment.value.trim() !== '' && segment.type !== 'answer');
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
      quote = quote === ch ? '' : quote || ch;
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
  if (stringMatch) return String(stringMatch[2] || '');
  if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  if (Object.prototype.hasOwnProperty.call(vars, value)) return vars[value];
  return value;
};

const runSimplePythonPreview = (code) => {
  const lines = String(code || '').replace(/\r\n/g, '\n').split('\n');
  const vars = {};
  const output = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = String(lines[index] || '').trim();
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

export default function StudentMyCoursePlayerView({
  data,
  theme,
  lessonId = '',
  onBack = () => {},
  onOpenLesson = () => {},
  onStartLesson = async () => ({ ok: false }),
  onCompleteLesson = async () => ({ ok: false, message: 'Not implemented' }),
}) {
  const course = data?.course || {};
  const modules = Array.isArray(data?.modules) ? data.modules : [];
  const allLessons = useMemo(
    () => modules.flatMap((moduleItem) => (Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : [])),
    [modules]
  );

  const activeLesson = useMemo(() => {
    const targetId = String(lessonId || '').trim();
    if (targetId) {
      const found = allLessons.find((lesson) => String(lesson?.id || '') === targetId && lesson?.unlocked);
      if (found) return found;
    }
    return allLessons.find((lesson) => lesson?.unlocked && !lesson?.completed) || allLessons.find((lesson) => lesson?.unlocked) || null;
  }, [allLessons, lessonId]);

  const selectedModule = useMemo(
    () => modules.find((moduleItem) =>
      (Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : []).some(
        (lesson) => String(lesson?.id || '') === String(activeLesson?.id || '')
      )
    ) || modules[0] || null,
    [modules, activeLesson?.id]
  );

  const lessonsInSelectedModule = Array.isArray(selectedModule?.lessons) ? selectedModule.lessons : [];
  const lessonContent = String(activeLesson?.content || activeLesson?.description || '');
  const contentParts = useMemo(() => {
    const parsed = parseLessonContent(lessonContent);
    if (parsed.length > 0) return parsed;
    const standaloneVideo = String(activeLesson?.videoUrl || '').trim();
    if (standaloneVideo) return [{ type: 'video', value: standaloneVideo }];
    return parsed;
  }, [lessonContent, activeLesson?.videoUrl]);
  const [starterStates, setStarterStates] = useState({});
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState('');

  const liveEnabled = Boolean(activeLesson?.enableLiveEditor);
  const liveLanguage = String(activeLesson?.liveEditorLanguage || 'python').toLowerCase();

  const [chapterMenuOpen, setChapterMenuOpen] = useState(false);
  const [lessonMenuOpen, setLessonMenuOpen] = useState(false);

  const activeModuleIndex = Math.max(
    0,
    modules.findIndex((moduleItem) => String(moduleItem?.id || '') === String(selectedModule?.id || ''))
  );
  const activeLessonIndex = Math.max(
    0,
    lessonsInSelectedModule.findIndex((lesson) => String(lesson?.id || '') === String(activeLesson?.id || ''))
  );
  const activeGlobalLessonIndex = Math.max(
    0,
    allLessons.findIndex((lesson) => String(lesson?.id || '') === String(activeLesson?.id || ''))
  );
  const prevLesson = activeGlobalLessonIndex > 0 ? allLessons[activeGlobalLessonIndex - 1] : null;
  const nextLesson = activeGlobalLessonIndex >= 0 ? allLessons[activeGlobalLessonIndex + 1] || null : null;
  const firstStarterIndex = contentParts.findIndex((part) => part?.type === 'starter');
  const firstStarterStateKey = firstStarterIndex >= 0 ? `${activeLesson?.id || 'lesson'}-${firstStarterIndex}` : '';
  const firstStarterState = firstStarterStateKey ? starterStates[firstStarterStateKey] || null : null;

  useEffect(() => {
    const activeLessonId = String(activeLesson?.id || '').trim();
    if (!activeLessonId) return;
    onStartLesson({ lessonId: activeLessonId }).catch(() => {});
  }, [activeLesson?.id, onStartLesson]);

  return (
    <View style={portalStyles.adminWrap}>
      <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 10 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Pressable onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="arrow-left" size={16} color="#2563eb" />
            <Text style={{ color: '#2563eb', fontWeight: '600' }}>Back to My Courses</Text>
          </Pressable>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={{ maxWidth: 120 }}>
            {allLessons.slice(0, 14).map((lesson, idx) => {
              const active = String(lesson?.id || '') === String(activeLesson?.id || '');
              const done = Boolean(lesson?.completed);
              return (
                <Pressable
                  key={`player-dot-${lesson?.id || idx}`}
                  onPress={() => lesson?.unlocked && onOpenLesson(lesson)}
                  disabled={!lesson?.unlocked}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: active ? '#60a5fa' : done ? '#93c5fd' : '#cbd5e1',
                    backgroundColor: active ? '#2563eb' : done ? '#60a5fa' : '#e2e8f0',
                    opacity: lesson?.unlocked ? 1 : 0.5,
                  }}
                />
              );
            })}
          </ScrollView>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={() => {
                setChapterMenuOpen((prev) => !prev);
                setLessonMenuOpen(false);
              }}
              style={{
                borderWidth: 1,
                borderColor: '#dbe4ef',
                borderRadius: 10,
                backgroundColor: '#ffffff',
                paddingHorizontal: 10,
                paddingVertical: 9,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <Text numberOfLines={1} style={{ color: '#334155', fontWeight: '700', flex: 1 }}>
                {`CH${activeModuleIndex + 1}: ${selectedModule?.title || 'Module'}`}
              </Text>
              <MaterialCommunityIcons name={chapterMenuOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
            </Pressable>

            {chapterMenuOpen ? (
              <View style={{ marginTop: 6, borderWidth: 1, borderColor: '#dbe4ef', borderRadius: 10, backgroundColor: '#ffffff' }}>
                {modules.map((moduleItem, index) => {
                  const active = String(moduleItem?.id || '') === String(selectedModule?.id || '');
                  const firstUnlocked = (Array.isArray(moduleItem?.lessons) ? moduleItem.lessons : []).find((lesson) => lesson?.unlocked);
                  return (
                    <Pressable
                      key={`dropdown-ch-${moduleItem?.id || index}`}
                      onPress={() => {
                        if (firstUnlocked) onOpenLesson(firstUnlocked);
                        setChapterMenuOpen(false);
                      }}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 9,
                        backgroundColor: active ? '#eff6ff' : '#ffffff',
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: '#eef2f7',
                      }}
                    >
                      <Text style={{ color: active ? '#1d4ed8' : '#334155', fontWeight: '700' }}>{`CH${index + 1}: ${moduleItem?.title || 'Module'}`}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>

          <View style={{ flex: 1 }}>
            <Pressable
              onPress={() => {
                setLessonMenuOpen((prev) => !prev);
                setChapterMenuOpen(false);
              }}
              style={{
                borderWidth: 1,
                borderColor: '#dbe4ef',
                borderRadius: 10,
                backgroundColor: '#ffffff',
                paddingHorizontal: 10,
                paddingVertical: 9,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <Text numberOfLines={1} style={{ color: '#334155', fontWeight: '700', flex: 1 }}>
                {`L${activeLessonIndex + 1}: ${activeLesson?.title || 'Lesson'}`}
              </Text>
              <MaterialCommunityIcons name={lessonMenuOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
            </Pressable>

            {lessonMenuOpen ? (
              <View style={{ marginTop: 6, borderWidth: 1, borderColor: '#dbe4ef', borderRadius: 10, backgroundColor: '#ffffff' }}>
                {lessonsInSelectedModule.map((lesson, index) => {
                  const active = String(lesson?.id || '') === String(activeLesson?.id || '');
                  return (
                    <Pressable
                      key={`dropdown-l-${lesson?.id || index}`}
                      onPress={() => {
                        if (lesson?.unlocked) onOpenLesson(lesson);
                        setLessonMenuOpen(false);
                      }}
                      disabled={!lesson?.unlocked}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 9,
                        backgroundColor: active ? '#eff6ff' : '#ffffff',
                        borderTopWidth: index === 0 ? 0 : 1,
                        borderTopColor: '#eef2f7',
                        opacity: lesson?.unlocked ? 1 : 0.5,
                      }}
                    >
                      <Text style={{ color: active ? '#1d4ed8' : '#334155', fontWeight: '700' }}>
                        {`L${index + 1}: ${lesson?.title || 'Lesson'}${lesson?.unlocked ? '' : ' (Locked)'}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        </View>
      </View>

      {!activeLesson ? (
        <Text style={portalStyles.empty}>No unlocked lesson available.</Text>
      ) : (
        <View style={[portalStyles.listCard, { backgroundColor: theme.cardBg, borderColor: theme.cardBorder, gap: 8 }]}>
          <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary, fontSize: 18 }]}>{activeLesson?.title || 'Lesson'}</Text>
          <Text style={[portalStyles.listItemMeta, { color: theme.textMuted }]}>{Math.max(0, Math.round(toNumber(activeLesson?.durationMinutes)))} min</Text>
          {contentParts.length === 0 ? (
            <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary }]}>No lesson content available yet.</Text>
          ) : (
            contentParts.map((part, partIndex) => {
              if (part.type === 'code') {
                return (
                  <View
                    key={`part-${partIndex}`}
                    style={{
                      borderWidth: 1,
                      borderColor: '#cbd5e1',
                      borderRadius: 10,
                      backgroundColor: '#0f172a',
                      paddingHorizontal: 10,
                      paddingVertical: 9,
                    }}
                  >
                    <Text style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{part.value}</Text>
                  </View>
                );
              }
              if (part.type === 'video') {
                const videoUrl = normalizeVideoUrl(part.value);
                const youtubeId = getYouTubeVideoId(videoUrl);
                const thumbnailUrl = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '';
                return (
                  <Pressable
                    key={`part-${partIndex}`}
                    onPress={() => Linking.openURL(String(videoUrl)).catch(() => {})}
                    style={[portalStyles.listCard, { backgroundColor: theme.pageBg, borderColor: theme.cardBorder, padding: 10, gap: 6 }]}
                  >
                    {thumbnailUrl ? (
                      <Image
                        source={{ uri: thumbnailUrl }}
                        style={{ width: '100%', height: 150, borderRadius: 8, backgroundColor: '#cbd5e1' }}
                        resizeMode="cover"
                      />
                    ) : null}
                    <Text style={[portalStyles.listItemMeta, { color: theme.textPrimary, fontWeight: '700' }]}>Open Video</Text>
                    <Text style={[portalStyles.listItemMeta, { color: '#2563eb', textDecorationLine: 'underline' }]}>{videoUrl}</Text>
                  </Pressable>
                );
              }
              if (part.type === 'starter') {
                const stateKey = `${activeLesson?.id || 'lesson'}-${partIndex}`;
                const starterCode = String(part.value || '');
                const starterState = starterStates[stateKey] || { code: starterCode, output: '', error: '', hasRun: false };
                const updateStarterState = (patch) => {
                  setStarterStates((prev) => ({
                    ...prev,
                    [stateKey]: { ...(prev[stateKey] || { code: starterCode, output: '', error: '', hasRun: false }), ...patch },
                  }));
                };
                if (!liveEnabled) {
                  return (
                    <View
                      key={`part-${partIndex}`}
                      style={{
                        borderWidth: 1,
                        borderColor: '#fcd34d',
                        borderRadius: 10,
                        backgroundColor: '#fffbeb',
                        paddingHorizontal: 10,
                        paddingVertical: 9,
                      }}
                    >
                      <Text style={{ color: '#92400e', fontWeight: '700' }}>Live editor is disabled for this lesson.</Text>
                    </View>
                  );
                }
                return (
                  <View key={`part-${partIndex}`} style={{ gap: 8, marginTop: 8 }}>
                    <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                      {liveLanguage === 'javascript' ? 'Live JavaScript Editor' : liveLanguage === 'html_css' ? 'Live HTML/CSS Editor' : 'Live Python Editor'}
                    </Text>
                    <TextInput
                      value={starterState.code}
                      onChangeText={(text) => updateStarterState({ code: text, error: '', output: '', hasRun: false })}
                      multiline
                      placeholder={liveLanguage === 'javascript' ? 'console.log("Hello")' : liveLanguage === 'html_css' ? '<h1>Hello</h1>' : 'print("Hello")'}
                      placeholderTextColor="#94a3b8"
                      style={{
                        borderWidth: 1,
                        borderColor: '#cbd5e1',
                        borderRadius: 10,
                        backgroundColor: '#0f172a',
                        color: '#e2e8f0',
                        minHeight: 110,
                        textAlignVertical: 'top',
                        paddingHorizontal: 10,
                        paddingVertical: 9,
                        fontFamily: 'monospace',
                      }}
                    />
                    {liveLanguage !== 'html_css' ? (
                      <Pressable
                        onPress={() => {
                          try {
                            const result =
                              liveLanguage === 'javascript'
                                ? runSimpleJavaScriptPreview(starterState.code)
                                : runSimplePythonPreview(starterState.code);
                            updateStarterState({ output: String(result || 'Done'), error: '', hasRun: true });
                          } catch (error) {
                            updateStarterState({ output: '', error: String(error?.message || 'Execution failed.'), hasRun: true });
                          }
                        }}
                        style={[portalStyles.chatSendBtn, { alignSelf: 'flex-start' }]}
                      >
                        <Text style={portalStyles.chatSendText}>Run Code</Text>
                      </Pressable>
                    ) : null}
                    {liveLanguage === 'html_css' && OptionalWebView ? (
                      <View style={{ borderWidth: 1, borderColor: '#dbe4ef', borderRadius: 10, overflow: 'hidden', backgroundColor: '#fff' }}>
                        <OptionalWebView source={{ html: buildHtmlPreviewDocument(starterState.code) }} originWhitelist={['*']} style={{ height: 220, backgroundColor: '#fff' }} />
                      </View>
                    ) : null}
                    {starterState.error ? (
                      <View style={{ borderWidth: 1, borderColor: '#fecaca', borderRadius: 10, backgroundColor: '#fff1f2', paddingHorizontal: 10, paddingVertical: 9 }}>
                        <Text style={{ color: '#b91c1c', fontFamily: 'monospace' }}>{starterState.error}</Text>
                      </View>
                    ) : starterState.output ? (
                      <View style={{ borderWidth: 1, borderColor: '#dbe4ef', borderRadius: 10, backgroundColor: '#f8fafc', paddingHorizontal: 10, paddingVertical: 9 }}>
                        <Text style={{ color: '#0f172a', fontFamily: 'monospace' }}>{starterState.output}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              }
              const paragraphText = String(part.value || '');
              return (
                <View key={`part-${partIndex}`} style={{ gap: 6 }}>
                  {paragraphText
                    .split('\n')
                    .map((line) => String(line || ''))
                    .filter((line) => line.trim().length > 0)
                    .map((line, lineIndex) => {
                      const trimmed = line.trim();
                      const isHeading1 = /^#\s+/.test(trimmed);
                      const isHeading2 = /^##\s+/.test(trimmed);
                      const isHeading3 = /^###\s+/.test(trimmed);
                      const isBullet = /^[-*]\s+/.test(trimmed);
                      const displayText = trimmed
                        .replace(/^###\s+/, '')
                        .replace(/^##\s+/, '')
                        .replace(/^#\s+/, '')
                        .replace(/^[-*]\s+/, '• ');
                      const segments = displayText.split(URL_REGEX);
                      return (
                        <Text
                          key={`line-${partIndex}-${lineIndex}`}
                          style={[
                            portalStyles.listItemMeta,
                            {
                              color: theme.textPrimary,
                              fontWeight: isHeading1 || isHeading2 || isHeading3 ? '700' : '400',
                              fontSize: isHeading1 ? 22 : isHeading2 ? 20 : isHeading3 ? 18 : 15,
                              lineHeight: isBullet ? 24 : 22,
                            },
                          ]}
                        >
                          {segments.map((seg, segIndex) => {
                            if (/^https?:\/\/\S+$/i.test(seg)) {
                              return (
                                <Text
                                  key={`seg-${partIndex}-${lineIndex}-${segIndex}`}
                                  onPress={() => Linking.openURL(seg).catch(() => {})}
                                  style={{ color: '#2563eb', textDecorationLine: 'underline' }}
                                >
                                  {seg}
                                </Text>
                              );
                            }
                            return <Text key={`seg-${partIndex}-${lineIndex}-${segIndex}`}>{seg}</Text>;
                          })}
                        </Text>
                      );
                    })}
                </View>
              );
            })
          )}

          <View style={{ marginTop: 8, gap: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Pressable
              disabled={completing || !activeLesson?.id}
              onPress={async () => {
                if (!activeLesson?.id || completing) return;
                setCompleting(true);
                setCompleteError('');
                try {
                  const liveSubmission = liveEnabled
                    ? {
                        code: String(firstStarterState?.code || ''),
                        output: String(firstStarterState?.output || ''),
                        hasRun: Boolean(firstStarterState?.hasRun),
                        error: firstStarterState?.error ? String(firstStarterState.error) : null,
                      }
                    : null;
                  const result = await onCompleteLesson({
                    lessonId: String(activeLesson.id),
                    liveEditorSubmission: liveSubmission,
                  });
                  if (!result?.ok) {
                    setCompleteError(String(result?.message || 'Failed to mark lesson complete.'));
                  }
                } catch (err) {
                  setCompleteError(String(err?.message || 'Failed to mark lesson complete.'));
                } finally {
                  setCompleting(false);
                }
              }}
              style={[portalStyles.chatSendBtn, { opacity: completing ? 0.7 : 1 }]}
            >
              <Text style={portalStyles.chatSendText}>{completing ? 'Saving...' : 'Mark lesson as completed'}</Text>
            </Pressable>
            {activeLesson?.completed ? (
              <Text style={{ color: '#059669', fontWeight: '700' }}>Completed</Text>
            ) : null}
          </View>
          {completeError ? <Text style={{ color: '#b91c1c' }}>{completeError}</Text> : null}
          <View style={{ marginTop: 6, gap: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Pressable
              disabled={!prevLesson || !prevLesson?.unlocked}
              onPress={() => prevLesson?.unlocked && onOpenLesson(prevLesson)}
              style={[portalStyles.secondaryBtn, { opacity: !prevLesson || !prevLesson?.unlocked ? 0.5 : 1 }]}
            >
              <Text style={portalStyles.secondaryBtnText}>Previous Lesson</Text>
            </Pressable>
            <Pressable
              disabled={!nextLesson || !nextLesson?.unlocked}
              onPress={() => nextLesson?.unlocked && onOpenLesson(nextLesson)}
              style={[portalStyles.secondaryBtn, { opacity: !nextLesson || !nextLesson?.unlocked ? 0.5 : 1 }]}
            >
              <Text style={portalStyles.secondaryBtnText}>Next Lesson</Text>
            </Pressable>
          </View>

        </View>
      )}
    </View>
  );
}
