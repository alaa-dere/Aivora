import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { portalStyles } from '../styles';

const toNumber = (value) => {
  const n = Number(value || 0);
  if (!Number.isFinite(n)) return 0;
  return n;
};

const normalizeText = (value) => String(value || '').replace(/\r\n/g, '\n').trim();
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;
const SPECIAL_TOKEN_REGEX =
  /\{\{\s*video\s*:\s*([^}]+)\s*\}\}|\{\{\s*starter\s*:\s*([\s\S]*?)\}\}|\{\{\s*(?:answer|expected)\s*:\s*([\s\S]*?)\}\}/gi;
const isVideoUrl = (url) => {
  const value = String(url || '').toLowerCase();
  return value.includes('youtube.com') || value.includes('youtu.be') || value.includes('vimeo.com') || value.endsWith('.mp4');
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
  const lessonText = normalizeText(activeLesson?.content || activeLesson?.description || '');
  const [editorCode, setEditorCode] = useState('');
  const [editorOutput, setEditorOutput] = useState('');

  const contentParts = useMemo(() => {
    const text = lessonText;
    if (!text) return [];
    const parts = [];
    const lines = text.split('\n');
    let inCode = false;
    let codeLines = [];
    let paragraph = [];

    const flushParagraph = () => {
      if (paragraph.length > 0) {
        parts.push({ type: 'paragraph', text: paragraph.join('\n').trim() });
        paragraph = [];
      }
    };
    const flushCode = () => {
      if (codeLines.length > 0) {
        parts.push({ type: 'code', text: codeLines.join('\n').trimEnd() });
        codeLines = [];
      }
    };

    const pushSpecialBlocks = (source) => {
      const raw = String(source || '');
      if (!raw.trim()) return false;
      SPECIAL_TOKEN_REGEX.lastIndex = 0;
      let matched = false;
      let m;
      while ((m = SPECIAL_TOKEN_REGEX.exec(raw)) !== null) {
        matched = true;
        if (m[1] !== undefined) {
          const videoUrl = String(m[1] || '').trim();
          if (videoUrl) parts.push({ type: 'video', url: videoUrl });
        } else if (m[2] !== undefined) {
          const starter = String(m[2] || '').trim();
          if (starter) parts.push({ type: 'code', text: starter });
        }
        // answer/expected intentionally hidden for student view
      }
      return matched;
    };

    for (let i = 0; i < lines.length; i += 1) {
      const raw = String(lines[i] || '');
      const trimmed = raw.trim();
      if (!inCode && /^```/.test(trimmed) && trimmed.endsWith('```') && trimmed.length > 6) {
        flushParagraph();
        const inlineCode = trimmed.replace(/^```/, '').replace(/```$/, '').trim();
        if (inlineCode) parts.push({ type: 'code', text: inlineCode });
        continue;
      }
      if (/^```/.test(trimmed)) {
        if (inCode) {
          const codeValue = codeLines.join('\n').trimEnd();
          if (!pushSpecialBlocks(codeValue) && codeValue) {
            parts.push({ type: 'code', text: codeValue });
          }
          codeLines = [];
          inCode = false;
        } else {
          flushParagraph();
          inCode = true;
        }
        continue;
      }
      if (inCode) {
        codeLines.push(raw);
        continue;
      }
      if (!trimmed) {
        flushParagraph();
        continue;
      }
      if (/^\{\{/.test(trimmed)) {
        flushParagraph();
        const blockLines = [raw];
        let cursor = i;
        while (!String(lines[cursor] || '').includes('}}') && cursor + 1 < lines.length) {
          cursor += 1;
          blockLines.push(String(lines[cursor] || ''));
        }
        const blockText = blockLines.join('\n');
        if (!pushSpecialBlocks(blockText)) {
          parts.push({ type: 'paragraph', text: blockText });
        }
        i = cursor;
        continue;
      }
      if (isVideoUrl(trimmed) || /^https?:\/\/\S+$/i.test(trimmed)) {
        flushParagraph();
        parts.push({ type: isVideoUrl(trimmed) ? 'video' : 'link', url: trimmed });
        continue;
      }
      paragraph.push(raw);
    }
    flushParagraph();
    if (inCode && codeLines.length > 0) {
      const codeValue = codeLines.join('\n').trimEnd();
      if (!pushSpecialBlocks(codeValue) && codeValue) {
        parts.push({ type: 'code', text: codeValue });
      }
    }
    return parts;
  }, [lessonText]);

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
          {activeLesson?.videoUrl ? (
            <Pressable
              onPress={() => Linking.openURL(String(activeLesson.videoUrl)).catch(() => {})}
              style={[portalStyles.secondaryBtn, { alignSelf: 'flex-start', paddingVertical: 8, borderWidth: 1, borderColor: '#bfdbfe' }]}
            >
              <Text style={portalStyles.secondaryBtnText}>Open Video</Text>
            </Pressable>
          ) : null}
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
                    <Text style={{ color: '#e2e8f0', fontFamily: 'monospace' }}>{part.text}</Text>
                  </View>
                );
              }
              if (part.type === 'video') {
                return (
                  <Pressable
                    key={`part-${partIndex}`}
                    onPress={() => Linking.openURL(String(part.url)).catch(() => {})}
                    style={[portalStyles.secondaryBtn, { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#bfdbfe', paddingVertical: 8 }]}
                  >
                    <Text style={portalStyles.secondaryBtnText}>Open Video Link</Text>
                  </Pressable>
                );
              }
              if (part.type === 'link') {
                return (
                  <Pressable key={`part-${partIndex}`} onPress={() => Linking.openURL(String(part.url)).catch(() => {})}>
                    <Text style={{ color: '#2563eb', textDecorationLine: 'underline' }}>{part.url}</Text>
                  </Pressable>
                );
              }
              const paragraphText = String(part.text || '');
              const segments = paragraphText.split(URL_REGEX);
              return (
                <Text key={`part-${partIndex}`} style={[portalStyles.listItemMeta, { color: theme.textPrimary }]}>
                  {segments.map((seg, segIndex) => {
                    if (/^https?:\/\/\S+$/i.test(seg)) {
                      return (
                        <Text
                          key={`seg-${segIndex}`}
                          onPress={() => Linking.openURL(seg).catch(() => {})}
                          style={{ color: '#2563eb', textDecorationLine: 'underline' }}
                        >
                          {seg}
                        </Text>
                      );
                    }
                    return <Text key={`seg-${segIndex}`}>{seg}</Text>;
                  })}
                </Text>
              );
            })
          )}

          {liveEnabled ? (
            <View style={{ gap: 8, marginTop: 8 }}>
              <Text style={[portalStyles.listItemTitle, { color: theme.textPrimary }]}>
                {liveLanguage === 'javascript' ? 'Live JavaScript Editor' : 'Live Python Editor'}
              </Text>
              <TextInput
                value={editorCode}
                onChangeText={setEditorCode}
                multiline
                placeholder={liveLanguage === 'javascript' ? 'console.log(\"Hello\")' : 'print(\"Hello\")'}
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
              <Pressable
                onPress={() => {
                  try {
                    const result =
                      liveLanguage === 'javascript'
                        ? runSimpleJavaScriptPreview(editorCode)
                        : runSimplePythonPreview(editorCode);
                    setEditorOutput(String(result || 'Done'));
                  } catch (error) {
                    setEditorOutput(String(error?.message || 'Execution failed.'));
                  }
                }}
                style={[portalStyles.chatSendBtn, { alignSelf: 'flex-start' }]}
              >
                <Text style={portalStyles.chatSendText}>Run Code</Text>
              </Pressable>
              {editorOutput ? (
                <View
                  style={{
                    borderWidth: 1,
                    borderColor: '#dbe4ef',
                    borderRadius: 10,
                    backgroundColor: '#f8fafc',
                    paddingHorizontal: 10,
                    paddingVertical: 9,
                  }}
                >
                  <Text style={{ color: '#0f172a', fontFamily: 'monospace' }}>{editorOutput}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
}
