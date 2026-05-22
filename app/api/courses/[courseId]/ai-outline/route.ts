import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';
import { requirePermission, getRequestUser } from '@/lib/request-auth';
import { ensureCourseQuizSchema } from '@/lib/ensure-course-quiz-schema';

interface Params {
  params: Promise<{ courseId: string }>;
}

type QuizQuestion = {
  questionType: 'multiple_choice' | 'written' | 'true_false';
  questionText: string;
  options?: string[];
  correctOptionIndex?: number;
  writtenAnswer?: string;
};

type OutlineLesson = {
  title: string;
  description: string;
  content?: string;
  hint?: string;
  hints?: string[];
  type: 'text' | 'code_example' | 'video_embed';
  durationMinutes: number;
  enableLiveEditor?: boolean;
  liveEditorLanguage?: 'python' | 'javascript' | 'html_css' | 'sql' | 'c';
  starterCode?: string;
  exampleCode?: string;
  expectedOutput?: string;
  videoUrl?: string;
  resources?: string[];
  quizQuestions?: QuizQuestion[];
};

type OutlineModule = {
  title: string;
  description: string;
  lessons: OutlineLesson[];
};

type OutlineOnlyLesson = {
  title: string;
  objective: string;
};

type OutlineOnlyModule = {
  title: string;
  description: string;
  lessons: OutlineOnlyLesson[];
};

type GenerationConstraints = {
  minModules: number;
  maxModules: number;
};

const HARD_MAX_MODULES = 12;

function ensureDetailedExplanation(lesson: OutlineLesson): OutlineLesson {
  const text = String(lesson.description || '').trim();
  const minLen = 260;
  if (text.length >= minLen) return lesson;

  const detailed = [
    text || `This lesson explains ${lesson.title} in a practical way.`,
    'What you will learn: the core idea, why it matters, and where it is used in real projects.',
    'Step-by-step flow: start from a simple baseline, then build the final solution gradually.',
    'Common mistakes to avoid: incorrect assumptions, missing validation, and weak error handling.',
    'After this lesson, you should be able to apply the same pattern in a small real-world task.',
  ]
    .filter(Boolean)
    .join('\n\n');

  return {
    ...lesson,
    description: detailed,
  };
}

type TopicProfile = {
  key: 'node' | 'python' | 'general';
  keywords: string[];
  blockedKeywords: string[];
  requiredResourceLinks: string[];
};

type LiveEditorLanguage = 'python' | 'javascript' | 'html_css' | 'sql' | 'c';

const DB_TITLE_MAX = 180;
const DB_DESC_MAX = 4000;

function clampText(value: string, max: number): string {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 3).trim()}...`;
}

function conciseTopicFromPrompt(prompt: string): string {
  const cleaned = String(prompt || '')
    .replace(/^create\s+/i, '')
    .replace(/^build\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return 'Express.js API Development';

  const firstSentence = cleaned.split(/[.!?]/)[0].trim();
  const compact = clampText(firstSentence, 80);
  if (compact) return compact;
  return 'Express.js API Development';
}

function extractGenerationConstraints(prompt: string): GenerationConstraints {
  const text = String(prompt || '').toLowerCase();
  const rangeMatch =
    text.match(/(\d+)\s*[-–]\s*(\d+)\s*(modules?|موديول|موديولات|وحدات|chapters?)/i) ||
    text.match(/(?:from|من)\s*(\d+)\s*(?:to|الى|إلى)\s*(\d+)\s*(modules?|موديول|موديولات|وحدات|chapters?)/i);

  if (rangeMatch) {
    const a = Number(rangeMatch[1]);
    const b = Number(rangeMatch[2]);
    const min = Math.max(1, Math.min(a, b));
    const max = Math.max(min, Math.max(a, b));
    return { minModules: min, maxModules: Math.min(HARD_MAX_MODULES, max) };
  }

  const exactMatch = text.match(/(\d+)\s*(modules?|موديول|موديولات|وحدات|chapters?)/i);
  if (exactMatch) {
    const n = Math.max(1, Number(exactMatch[1]));
    const clamped = Math.min(HARD_MAX_MODULES, n);
    return { minModules: clamped, maxModules: clamped };
  }

  return { minModules: 4, maxModules: 5 };
}

function enforceModuleCount(modules: OutlineModule[], constraints: GenerationConstraints, prompt: string): OutlineModule[] {
  const capped = modules.slice(0, constraints.maxModules);
  if (capped.length >= constraints.minModules) return capped;

  const needed = constraints.minModules - capped.length;
  const topic = conciseTopicFromPrompt(prompt);
  const inferredLang = inferPreferredLiveEditorLanguage(topic, buildTopicProfile(topic));
  const starterByLang: Record<LiveEditorLanguage, { code: string; output: string }> = {
    javascript: { code: 'console.log(["Ali", "Lina"].map((x) => x.toLowerCase()).join(","));', output: 'ali,lina' },
    python: { code: 'print(",".join([name.lower() for name in ["Ali", "Lina"]]))', output: 'ali,lina' },
    html_css: { code: '<h2>Hello</h2>\n<style>h2{color:#2563eb;}</style>', output: 'rendered' },
    sql: { code: 'SELECT name FROM users WHERE is_active = 1 LIMIT 5;', output: 'query parsed' },
    c: { code: '#include <stdio.h>\nint main(void) {\n  printf("hello\\n");\n  return 0;\n}', output: 'hello' },
  };
  const fallbackStarter = starterByLang[inferredLang];
  const startIdx = capped.length + 1;
  for (let i = 0; i < needed; i += 1) {
    const idx = startIdx + i;
    capped.push({
      title: `Module ${idx}: ${topic} Practice ${idx}`,
      description: `Practical applications for ${topic}.`,
      lessons: [
        {
          title: `Practice Task ${idx}.1`,
          description: `Apply key concepts of ${topic} in a guided exercise.`,
          type: 'code_example',
          durationMinutes: 15,
          enableLiveEditor: true,
          liveEditorLanguage: inferredLang,
          starterCode: fallbackStarter.code,
          expectedOutput: fallbackStarter.output,
          resources: ['https://developer.mozilla.org/en-US/docs/Learn'],
          quizQuestions: [],
        },
      ],
    });
  }
  return capped;
}

function sanitizeLessonForDb(lesson: OutlineLesson): OutlineLesson {
  return {
    ...lesson,
    title: clampText(lesson.title, DB_TITLE_MAX),
    description: clampText(lesson.description || '', DB_DESC_MAX),
    content: lesson.content ? clampText(lesson.content, 12000) : lesson.content,
    hint: lesson.hint ? clampText(lesson.hint, 400) : lesson.hint,
    hints: Array.isArray(lesson.hints)
      ? lesson.hints.map((h) => clampText(String(h || ''), 300)).filter(Boolean).slice(0, 3)
      : lesson.hints,
    starterCode: lesson.starterCode ? clampText(lesson.starterCode, 12000) : lesson.starterCode,
    expectedOutput: lesson.expectedOutput ? clampText(lesson.expectedOutput, 500) : lesson.expectedOutput,
    resources: (lesson.resources || []).map((r) => clampText(r, 500)).filter(Boolean),
    quizQuestions: (lesson.quizQuestions || []).map((q) => ({
      ...q,
      questionText: clampText(q.questionText || '', 500),
      writtenAnswer: q.writtenAnswer ? clampText(q.writtenAnswer, 500) : q.writtenAnswer,
      options: (q.options || []).map((o) => clampText(o, 300)).filter(Boolean),
    })),
  };
}

function sanitizeModulesForDb(modules: OutlineModule[]): OutlineModule[] {
  return modules.map((m) => ({
    ...m,
    title: clampText(m.title, DB_TITLE_MAX),
    description: clampText(m.description || '', DB_DESC_MAX),
    lessons: m.lessons.map(sanitizeLessonForDb),
  }));
}

function buildTopicProfile(topicText: string): TopicProfile {
  const text = topicText.toLowerCase();
  if (/express|node|backend|rest api|api|javascript|js/.test(text)) {
    return {
      key: 'node',
      keywords: ['express', 'node', 'api', 'javascript', 'backend', 'rest'],
      blockedKeywords: ['django', 'flask', 'pyodide', 'python'],
      requiredResourceLinks: [
        'https://expressjs.com/',
        'https://nodejs.org/en/docs',
        'https://developer.mozilla.org/en-US/docs/Web/HTTP',
      ],
    };
  }
  if (/python|django|flask/.test(text)) {
    return {
      key: 'python',
      keywords: ['python', 'django', 'flask', 'api', 'backend'],
      blockedKeywords: ['express', 'nodejs', 'npm'],
      requiredResourceLinks: [
        'https://docs.python.org/3/',
        'https://flask.palletsprojects.com/',
        'https://developer.mozilla.org/en-US/docs/Web/HTTP',
      ],
    };
  }
  return {
    key: 'general',
    keywords: ['programming', 'code', 'development'],
    blockedKeywords: [],
    requiredResourceLinks: ['https://developer.mozilla.org/en-US/docs/Learn'],
  };
}

function extractOpenAiText(data: unknown): string {
  const root = (data || {}) as {
    output_text?: unknown;
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
  };
  if (typeof root.output_text === 'string' && root.output_text.trim()) return root.output_text.trim();
  if (!Array.isArray(root.output)) return '';

  const chunks: string[] = [];
  for (const item of root.output) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && typeof content.text === 'string') {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join('\n').trim();
}

function extractJsonObject(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}

let ensureLessonLiveEditorLanguagePromise: Promise<void> | null = null;

async function ensureLessonLiveEditorLanguageSupportsSql() {
  if (ensureLessonLiveEditorLanguagePromise) return ensureLessonLiveEditorLanguagePromise;

  ensureLessonLiveEditorLanguagePromise = (async () => {
    const [rows] = await pool.query<RowDataPacket[]>(
      `
      SELECT COLUMN_TYPE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'lesson'
        AND COLUMN_NAME = 'liveEditorLanguage'
      LIMIT 1
      `
    );

    const columnType = String(rows[0]?.COLUMN_TYPE || '').toLowerCase();
    if (columnType.includes("'sql'") && columnType.includes("'c'")) return;

    await pool.query(`
      ALTER TABLE lesson
      MODIFY COLUMN liveEditorLanguage ENUM('python','javascript','html_css','sql','c')
      NOT NULL DEFAULT 'python'
    `);
  })();

  try {
    await ensureLessonLiveEditorLanguagePromise;
  } catch (err) {
    ensureLessonLiveEditorLanguagePromise = null;
    throw err;
  }
}

function detectCodeLanguage(code: string): 'python' | 'javascript' | 'c' | null {
  const src = String(code || '').trim();
  if (!src) return null;
  const cScore =
    Number(/#\s*include\s*<[^>]+>/.test(src)) +
    Number(/\bint\s+main\s*\(/.test(src)) +
    Number(/\bprintf\s*\(/.test(src)) +
    Number(/\bmalloc\s*\(/.test(src)) +
    Number(/\breturn\s+\d+\s*;/.test(src));
  const jsScore =
    Number(/\b(const|let|var)\b/.test(src)) +
    Number(/=>/.test(src)) +
    Number(/console\.log\s*\(/.test(src)) +
    Number(/[;{}]/.test(src));
  const pyScore =
    Number(/\bdef\b/.test(src)) +
    Number(/\bprint\s*\(/.test(src)) +
    Number(/:\s*(#.*)?$/m.test(src)) +
    Number(/\bimport\s+[a-zA-Z_]/.test(src));
  const maxScore = Math.max(cScore, jsScore, pyScore);
  if (maxScore === 0) return null;
  if (cScore === maxScore && cScore > jsScore && cScore > pyScore) return 'c';
  if (jsScore === pyScore && jsScore === maxScore) return null;
  return jsScore > pyScore ? 'javascript' : 'python';
}

function inferPreferredLiveEditorLanguage(topicText: string, profile: TopicProfile): LiveEditorLanguage {
  const text = String(topicText || '').toLowerCase();
  if (/\bc\b| c language |ansi c|gcc|clang|pointer|pointers|malloc|stdio|segmentation fault/.test(` ${text} `)) return 'c';
  if (/\bsql\b|mysql|postgres|database query|query optimization|joins/.test(text)) return 'sql';
  if (/html|css|frontend|ui|web design/.test(text)) return 'html_css';
  if (/\bpython\b|django|flask/.test(text) || profile.key === 'python') return 'python';
  if (/\bnode\b|express|javascript|backend|api/.test(text) || profile.key === 'node') return 'javascript';
  return 'python';
}

function sanitizeJsStarterCode(code: string): string {
  let out = String(code || '').trim();
  if (!out) return out;
  out = out
    .replace(/\brequire\s*\(/g, '// require(')
    .replace(/\bimport\s+.+from\s+['"][^'"]+['"];?/g, '// import removed for browser runtime')
    .replace(/\bprocess\.[a-zA-Z0-9_]+/g, '"[not available in browser runtime]"')
    .replace(/\bexpress\s*\(\s*\)/g, '({ note: "Express server runtime is not available in this editor" })');
  return out;
}

function sanitizeCStarterCode(code: string): string {
  let out = String(code || '').trim();
  if (!out) return out;

  // Common fix: comparing int loop variable with size_t length.
  out = out.replace(
    /for\s*\(\s*int\s+([a-zA-Z_]\w*)\s*=\s*0\s*;\s*\1\s*<\s*len\s*;\s*\1\+\+\s*\)/g,
    'for (size_t $1 = 0; $1 < len; $1++)'
  );

  // Common fix: printing size_t with %d.
  out = out.replace(/printf\s*\(\s*"([^"]*?)%d([^"]*?)"\s*,\s*len\s*\)/g, 'printf("$1%zu$2", len)');

  // Auto-close unbalanced curly braces outside string/char literals.
  let balance = 0;
  let inSingle = false;
  let inDouble = false;
  let escape = false;
  for (let i = 0; i < out.length; i += 1) {
    const ch = out[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (!inDouble && ch === "'") {
      inSingle = !inSingle;
      continue;
    }
    if (!inSingle && ch === '"') {
      inDouble = !inDouble;
      continue;
    }
    if (inSingle || inDouble) continue;
    if (ch === '{') balance += 1;
    if (ch === '}') balance -= 1;
  }
  if (balance > 0) {
    out = `${out}\n${Array.from({ length: balance }, () => '}').join('\n')}`;
  }

  // Keep starter concise for learners.
  const lines = out.split('\n');
  if (lines.length > 45) {
    out = `${lines.slice(0, 45).join('\n')}\n\n/* trimmed for readability */\n`;
  }

  return out;
}

function normalizeGeneratedCode(code: string | undefined): string | undefined {
  if (!code) return undefined;
  const normalized = String(code)
    .replace(/\r\n/g, '\n')
    .trim();
  return normalized || undefined;
}

function prettifyStarterCode(code: string | undefined, language: 'python' | 'javascript' | 'html_css' | 'sql' | 'c'): string | undefined {
  const normalized = normalizeGeneratedCode(code);
  if (!normalized) return undefined;

  const isMultiline = /\n/.test(normalized);

  if ((language === 'javascript' || language === 'html_css') && !isMultiline) {
    const pretty = normalized
      .replace(/;\s*/g, ';\n')
      .replace(/\{\s*/g, '{\n  ')
      .replace(/\s*\}/g, '\n}\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return pretty || normalized;
  }

  if (language === 'python' && !isMultiline) {
    const pretty = normalized
      .replace(/\s+if\s+/g, '\nif ')
      .replace(/\s+for\s+/g, '\nfor ')
      .replace(/\s+while\s+/g, '\nwhile ')
      .replace(/\s+print\(/g, '\nprint(')
      .replace(/:\s+/g, ':\n    ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return pretty || normalized;
  }

  if (language === 'c') {
    const pretty = normalized
      .replace(/\s*#\s*include\s*/g, '\n#include ')
      .replace(/\s*#\s*define\s*/g, '\n#define ')
      .replace(/;\s*/g, ';\n')
      .replace(/\{\s*/g, '{\n')
      .replace(/\s*\}/g, '\n}\n')
      .replace(/\n{3,}/g, '\n\n')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .trim();
    return pretty || normalized;
  }

  if (language === 'sql') {
    const pretty = normalized
      .replace(/\s+(FROM|WHERE|GROUP BY|ORDER BY|LIMIT|HAVING|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN)\s+/gi, '\n$1 ')
      .replace(/;\s*/g, ';\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    return pretty || normalized;
  }

  return normalized;
}

function enforceReadableSpacing(code: string | undefined): string | undefined {
  const normalized = normalizeGeneratedCode(code);
  if (!normalized) return undefined;

  const lines = normalized
    .split('\n')
    .map((line) => line.replace(/\s+$/g, ''))
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''));

  const out: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    out.push(line);

    if (!trimmed) continue;
    const isBlockBoundary = /[;:{}]$/.test(trimmed);
    const next = lines[i + 1]?.trim() || '';
    if (isBlockBoundary && next) {
      out.push('');
    }
  }

  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function normalizeQuizQuestion(raw: unknown): QuizQuestion | null {
  const q = (raw || {}) as Record<string, unknown>;
  const typeRaw = String(q.questionType || 'multiple_choice').trim().toLowerCase();
  const questionType: QuizQuestion['questionType'] =
    typeRaw === 'written' ? 'written' : typeRaw === 'true_false' ? 'true_false' : 'multiple_choice';
  const questionText = String(q.questionText || '').trim();
  if (!questionText) return null;

  if (questionType === 'written') {
    const writtenAnswer = String(q.writtenAnswer || '').trim();
    if (!writtenAnswer) return null;
    return { questionType, questionText, writtenAnswer, options: [writtenAnswer], correctOptionIndex: 0 };
  }

  if (questionType === 'true_false') {
    const idx = Number(q.correctOptionIndex);
    const correctOptionIndex = idx === 1 ? 1 : 0;
    return {
      questionType,
      questionText,
      options: ['True', 'False'],
      correctOptionIndex,
    };
  }

  const optionsRaw = Array.isArray(q.options) ? q.options : [];
  const options = optionsRaw.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 4);
  if (options.length < 2) return null;
  const idx = Number(q.correctOptionIndex);
  const correctOptionIndex = Number.isInteger(idx) && idx >= 0 && idx < options.length ? idx : 0;
return { questionType, questionText, options, correctOptionIndex };
}

function isYouTubeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return host.includes('youtube.com') || host === 'youtu.be';
  } catch {
    return false;
  }
}

function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\/+/, '').split('/')[0] || '';
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (host.includes('youtube.com')) {
      const id = parsed.searchParams.get('v') || '';
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
    }
    return null;
  } catch {
    return null;
  }
}

async function validateYouTubeUrl(url: string): Promise<boolean> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { signal: controller.signal }
    );
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

type VideoRelevanceResult = { valid: boolean; reason?: string };

function tokenizeForMatch(text: string): string[] {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'into', 'using', 'use', 'your', 'you',
    'lesson', 'learn', 'intro', 'introduction', 'guide', 'basics', 'overview', 'about',
  ]);
  const normalized = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return [];
  const words = normalized.split(' ').filter((w) => w.length > 2 && !stopWords.has(w));
  return Array.from(new Set(words));
}

async function validateYouTubeRelevance(
  videoUrl: string,
  lessonTitle: string,
  youtubeApiKey: string
): Promise<VideoRelevanceResult> {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (!videoId) return { valid: false, reason: 'Invalid YouTube URL format' };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${youtubeApiKey}`,
      { signal: controller.signal }
    );
    if (!res.ok) return { valid: false, reason: `YouTube API error (${res.status})` };

    const data = (await res.json()) as {
      items?: Array<{ snippet?: { title?: string; description?: string } }>;
    };
    const snippet = data.items?.[0]?.snippet;
    if (!snippet) return { valid: false, reason: 'Video not found' };

    const videoText = `${String(snippet.title || '')} ${String(snippet.description || '')}`;
    const lessonTokens = tokenizeForMatch(lessonTitle);
    if (lessonTokens.length === 0) {
      return { valid: true };
    }

    const videoTokensText = ` ${tokenizeForMatch(videoText).join(' ')} `;
    const matchCount = lessonTokens.filter((w) => videoTokensText.includes(` ${w} `)).length;
    const matchRatio = matchCount / lessonTokens.length;
    const threshold = lessonTokens.length <= 3 ? 0.6 : lessonTokens.length <= 6 ? 0.5 : 0.4;

    return {
      valid: matchRatio >= threshold,
      reason:
        matchRatio >= threshold
          ? undefined
          : `Low relevance (${Math.round(matchRatio * 100)}% keyword match, min ${Math.round(threshold * 100)}%)`,
    };
  } catch {
    return { valid: false, reason: 'YouTube relevance check failed' };
  } finally {
    clearTimeout(timeout);
  }
}

async function keepOnlyWorkingYouTubeVideos(modules: OutlineModule[]): Promise<OutlineModule[]> {
  const youtubeApiKey = String(process.env.YOUTUBE_API_KEY || '').trim();
  const urlChecks = new Map<string, Promise<boolean>>();
  const relevanceChecks = new Map<string, Promise<VideoRelevanceResult>>();

  const checkAvailability = (url: string) => {
    const key = url.trim().toLowerCase();
    const existing = urlChecks.get(key);
    if (existing) return existing;
    const pending = validateYouTubeUrl(url);
    urlChecks.set(key, pending);
    return pending;
  };

  const checkRelevance = (url: string, lessonContext: string) => {
    const key = `${url.trim().toLowerCase()}|${lessonContext.trim().toLowerCase()}`;
    const existing = relevanceChecks.get(key);
    if (existing) return existing;
    const pending = validateYouTubeRelevance(url, lessonContext, youtubeApiKey);
    relevanceChecks.set(key, pending);
    return pending;
  };

  const validatedModules = await Promise.all(
    modules.map(async (module) => {
      const lessons = await Promise.all(
        module.lessons.map(async (lesson) => {
          const videoUrl = String(lesson.videoUrl || '').trim();
          if (!videoUrl) return lesson;
          const isAvailable = await checkAvailability(videoUrl);
          if (!isAvailable) return { ...lesson, videoUrl: undefined };

          if (!youtubeApiKey) return lesson;

          const context = `${module.title} ${lesson.title}`.trim();
          const relevance = await checkRelevance(videoUrl, context);
          if (!relevance.valid) {
            console.warn(`Video rejected for "${lesson.title}": ${relevance.reason || 'Not relevant'}`);
            return { ...lesson, videoUrl: undefined };
          }
          return lesson;
        })
      );
      return { ...module, lessons };
    })
  );

  return validatedModules;
}

function topicVideoUrl(topicText: string): string {
  const topic = topicText.toLowerCase();
  if (/if|else|condition|branch|logic operator|boolean/.test(topic)) {
    return 'https://www.youtube.com/watch?v=Z6HIOj2xg9E';
  }
  if (/loop|for loop|while loop|iteration/.test(topic)) {
    return 'https://www.youtube.com/watch?v=wxZNzqB13iQ';
  }
  if (/array|pointer|string|memory/.test(topic)) {
    return 'https://www.youtube.com/watch?v=zuegQmMdy8M';
  }
  if (/function|return|parameter/.test(topic)) {
    return 'https://www.youtube.com/watch?v=1-sNJs-MFYo';
  }
  if (/sql|query|join|database|postgres|mysql/.test(topic)) {
    return 'https://www.youtube.com/watch?v=HXV3zeQKqGY';
  }
  if (/html|css|frontend|dom/.test(topic)) {
    return 'https://www.youtube.com/watch?v=G3e-cpL7ofc';
  }
  if (/python|flask|django/.test(topic)) {
    return 'https://www.youtube.com/watch?v=rfscVS0vtbw';
  }
  if (/express|node|api|backend|javascript|js/.test(topic)) {
    return 'https://www.youtube.com/watch?v=l8WPWK9mS5M';
  }
  return 'https://www.youtube.com/watch?v=KJgsSFOSQv0';
}

function normalizeVideoForTopic(url: string | undefined, topicText: string): string | undefined {
  if (!url) return undefined;
  if (!isUrlFormatValid(url)) return undefined;
  if (!isYouTubeUrl(url)) return undefined;

  const lower = url.toLowerCase();
  const topic = topicText.toLowerCase();
  const isNodeTopic = /express|node|api|backend|javascript|js/.test(topic);
  const isPythonTopic = /python|flask|django/.test(topic);
  const isCTopic = /\bc\b|c language|pointer|stdio|gcc|clang/.test(topic);
  const hasPythonHint = /python|pyodide|django|flask/.test(lower);
  const hasNodeHint = /node|express|rest-api|javascript|js/.test(lower);
  const hasCHint = /\bc\b|pointer|memory|stdio|gcc|clang/.test(lower);

  if (isNodeTopic && hasPythonHint && !hasNodeHint) return undefined;
  if (isPythonTopic && hasNodeHint && !hasPythonHint) return undefined;
  if (isCTopic && (hasPythonHint || hasNodeHint) && !hasCHint) return undefined;
  return url;
}

function defaultVideoForTopic(topicText: string): string {
  return topicVideoUrl(topicText);
}

function appendExtraCodeExample(lesson: OutlineLesson): OutlineLesson {
  return lesson;
}

function dedupeTextBlocks(text: string): string {
  const seen = new Set<string>();
  const parts = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const kept: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(part);
  }
  return kept.join('\n\n');
}

function dedupeStringArray(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    const value = String(raw || '').trim();
    if (!value) continue;
    const key = value.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function isUrlFormatValid(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function lessonToContent(lesson: OutlineLesson): string {
  const chunks: string[] = [];
  const authoredContent = String(lesson.content || '').trim();
  if (authoredContent) chunks.push(authoredContent);
  else chunks.push(`Lesson: ${lesson.title}`);
  if (lesson.enableLiveEditor && lesson.liveEditorLanguage === 'javascript') {
    chunks.push('> Note: Live JavaScript editor runs in the browser. Avoid `require`, `process`, and server startup code here.');
  }

  if (lesson.resources && lesson.resources.length > 0) {
    chunks.push('Useful Resources:');
    for (const link of dedupeStringArray(lesson.resources).slice(0, 4)) {
      chunks.push(`- ${link}`);
    }
  }

  if (lesson.videoUrl) {
    chunks.push(`{{video: ${lesson.videoUrl}}}`);
  }

  const exampleCode = normalizeGeneratedCode(lesson.exampleCode);
  if (exampleCode) {
    chunks.push('Example:');
    chunks.push(`\`\`\`code\n${exampleCode}\n\`\`\``);
  }

  if (lesson.enableLiveEditor && lesson.starterCode) {
    const language = (lesson.liveEditorLanguage || 'python') as LiveEditorLanguage;
    const starter =
      enforceReadableSpacing(
        prettifyStarterCode(normalizeGeneratedCode(lesson.starterCode) || lesson.starterCode, language)
      ) || lesson.starterCode;
    chunks.push('Live Coding Task:');
    chunks.push('Run the starter code, then complete the TODOs.');
    chunks.push(`{{starter:\n${starter}\n}}`);
    if (lesson.expectedOutput) {
      chunks.push(`{{answer: ${lesson.expectedOutput}}}`);
    }
  }

  return dedupeTextBlocks(chunks.join('\n\n'));
}

function fallbackOutline(prompt: string, preferredLanguage: LiveEditorLanguage): OutlineModule[] {
  const idea = conciseTopicFromPrompt(prompt);
  const starterByLang: Record<LiveEditorLanguage, { code: string; output: string }> = {
    javascript: {
      code: 'const users = [{ id: 1, name: "Ali" }, { id: 2, name: "Lina" }];\nconst result = users.map((u) => u.name.toLowerCase()).join(",");\nconsole.log(result);',
      output: 'ali,lina',
    },
    python: {
      code: 'users = ["Ali", "Lina"]\nresult = ",".join(name.lower() for name in users)\nprint(result)',
      output: 'ali,lina',
    },
    html_css: {
      code: '<h1 id="title">Hello</h1>\n<style>\n  #title { color: steelblue; }\n</style>',
      output: 'rendered',
    },
    sql: {
      code: 'SELECT name\nFROM users\nWHERE is_active = 1\nORDER BY created_at DESC\nLIMIT 5;',
      output: 'query parsed',
    },
    c: {
      code: '#include <stdio.h>\n\nint main(void) {\n  printf("hello\\n");\n  return 0;\n}',
      output: 'hello',
    },
  };
  const starter = starterByLang[preferredLanguage];
  return [
    {
      title: clampText(`Getting Started with ${idea}`, DB_TITLE_MAX),
      description: `Understand the fundamentals of ${idea} and set up your environment.`,
      lessons: [
        {
          title: 'Setup and First Run',
          description: 'Install dependencies and run your first backend script.',
          type: 'code_example',
          durationMinutes: 20,
          enableLiveEditor: true,
            liveEditorLanguage: preferredLanguage,
            starterCode: starter.code,
            expectedOutput: starter.output,
          videoUrl: 'https://www.youtube.com/watch?v=l8WPWK9mS5M',
          resources: ['https://expressjs.com/', 'https://nodejs.org/en/docs'],
          quizQuestions: [
            {
              questionType: 'multiple_choice',
              questionText: 'What does Express.js help you build?',
              options: ['Web APIs and servers', 'Mobile native apps', 'Desktop games', 'Photo editing tools'],
              correctOptionIndex: 0,
            },
          ],
        },
      ],
    },
  ];
}

function normalizeOutline(parsed: unknown): OutlineModule[] | null {
  const root = (parsed || {}) as { modules?: unknown[] };
  if (!Array.isArray(root.modules) || root.modules.length === 0) return null;

  const modules: OutlineModule[] = [];
  for (const rawModule of root.modules) {
    const moduleObj = (rawModule || {}) as {
      title?: unknown;
      description?: unknown;
      lessons?: unknown[];
    };
    const title = String(moduleObj.title || '').trim();
    const description = String(moduleObj.description || '').trim();
    if (!title) continue;

    const lessonsRaw = Array.isArray(moduleObj.lessons) ? moduleObj.lessons : [];
    const lessons: OutlineLesson[] = [];
    for (const rawLesson of lessonsRaw) {
      const lessonObj = (rawLesson || {}) as Record<string, unknown>;
      const lessonTitle = String(lessonObj.title || '').trim();
      if (!lessonTitle) continue;

      const typeRaw = String(lessonObj.type || '').trim();
      const type: OutlineLesson['type'] =
        typeRaw === 'code_example' || typeRaw === 'video_embed' ? typeRaw : 'text';
      const duration = Math.max(5, Number(lessonObj.durationMinutes || 10));
      const resources = Array.isArray(lessonObj.resources)
        ? lessonObj.resources.map((x) => String(x || '').trim()).filter(Boolean)
        : [];
      const quizRaw = Array.isArray(lessonObj.quizQuestions) ? lessonObj.quizQuestions : [];
      const quizQuestions = quizRaw.map(normalizeQuizQuestion).filter(Boolean) as QuizQuestion[];

        const starterCode = String(lessonObj.starterCode || '').trim() || undefined;
        const langRaw = String(lessonObj.liveEditorLanguage || '').trim();
        const liveLang: 'python' | 'javascript' | 'html_css' | 'sql' | 'c' =
          langRaw === 'python' || langRaw === 'javascript' || langRaw === 'html_css' || langRaw === 'sql' || langRaw === 'c'
            ? langRaw
            : 'python';
        const prettyStarter = enforceReadableSpacing(prettifyStarterCode(starterCode, liveLang));

        lessons.push({
        title: lessonTitle,
        description: String(lessonObj.description || '').trim(),
        content: String(lessonObj.content || '').trim() || undefined,
        hint: String(lessonObj.hint || '').trim() || undefined,
        hints: Array.isArray(lessonObj.hints)
          ? lessonObj.hints.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 3)
          : undefined,
        type,
        durationMinutes: Number.isFinite(duration) ? duration : 10,
        enableLiveEditor: Boolean(lessonObj.enableLiveEditor),
        liveEditorLanguage: liveLang,
          starterCode:
            liveLang === 'javascript' && prettyStarter
              ? sanitizeJsStarterCode(prettyStarter)
              : liveLang === 'c' && prettyStarter
                ? sanitizeCStarterCode(prettyStarter)
                : prettyStarter,
        exampleCode: normalizeGeneratedCode(String(lessonObj.exampleCode || '').trim() || undefined),
        expectedOutput: String(lessonObj.expectedOutput || '').trim() || undefined,
        videoUrl: String(lessonObj.videoUrl || '').trim() || undefined,
        resources,
        quizQuestions,
      });
    }

    if (lessons.length === 0) continue;
    modules.push({ title, description, lessons });
  }

  return modules.length > 0 ? modules.slice(0, HARD_MAX_MODULES) : null;
}

function normalizeOutlineOnly(parsed: unknown): OutlineOnlyModule[] | null {
  const root = (parsed || {}) as { modules?: unknown[] };
  if (!Array.isArray(root.modules) || root.modules.length === 0) return null;

  const modules: OutlineOnlyModule[] = [];
  for (const rawModule of root.modules) {
    const moduleObj = (rawModule || {}) as Record<string, unknown>;
    const title = clampText(String(moduleObj.title || '').trim(), DB_TITLE_MAX);
    if (!title) continue;
    const description = clampText(String(moduleObj.description || '').trim(), DB_DESC_MAX);
    const lessonsRaw = Array.isArray(moduleObj.lessons) ? moduleObj.lessons : [];
    const lessons = lessonsRaw
      .map((rawLesson) => {
        const lessonObj = (rawLesson || {}) as Record<string, unknown>;
        const lessonTitle = clampText(String(lessonObj.title || '').trim(), DB_TITLE_MAX);
        if (!lessonTitle) return null;
        return {
          title: lessonTitle,
          objective: clampText(String(lessonObj.objective || '').trim(), 500) || `Learn ${lessonTitle}`,
        };
      })
      .filter(Boolean) as OutlineOnlyLesson[];
    if (lessons.length === 0) continue;
    modules.push({ title, description, lessons });
  }

  return modules.length > 0 ? modules.slice(0, HARD_MAX_MODULES) : null;
}

function outlineOnlyToOutline(modules: OutlineOnlyModule[], preferredLanguage: LiveEditorLanguage): OutlineModule[] {
  return modules.map((m) => ({
    title: m.title,
    description: m.description,
    lessons: m.lessons.map((l, idx) => ({
      title: l.title,
      description: l.objective,
      type: idx % 3 === 1 ? 'code_example' : 'text',
      durationMinutes: 15,
      enableLiveEditor: false,
      liveEditorLanguage: preferredLanguage,
      resources: [],
      quizQuestions: [],
    })),
  }));
}

function buildContextualStarter(
  language: LiveEditorLanguage,
  moduleTitle: string,
  lessonTitle: string,
  lessonDescription: string,
  lessonIndex: number,
  fallbackCode: string,
  fallbackOut: string
): { code: string; out: string; question: string } {
  const topic = `${moduleTitle} ${lessonTitle} ${lessonDescription}`.toLowerCase();
  const teachesConditions = /if|condition|branch|decision|nested/.test(topic);
  const teachesLoops = /loop|for|while|iteration/.test(topic);
  const teachesFunctions = /function|return|parameter|argument/.test(topic);

  if (language === 'c') {
    if (teachesConditions) {
      return {
        code: '#include <stdio.h>\n\nint main(void) {\n  int score = 75;\n\n  if (score >= 60) {\n    printf("pass\\n");\n  } else {\n    printf("fail\\n");\n  }\n\n  return 0;\n}',
        out: 'pass',
        question: `In "${lessonTitle}", what does the condition output for score = 75?`,
      };
    }
    if (teachesLoops) {
      return {
        code: '#include <stdio.h>\n\nint main(void) {\n  int sum = 0;\n\n  for (int i = 1; i <= 3; i++) {\n    sum += i;\n  }\n\n  printf("%d\\n", sum);\n  return 0;\n}',
        out: '6',
        question: `In "${lessonTitle}", what is the final sum after the loop?`,
      };
    }
    if (teachesFunctions) {
      return {
        code: '#include <stdio.h>\n\nint add(int a, int b) {\n  return a + b;\n}\n\nint main(void) {\n  printf("%d\\n", add(2, 3));\n  return 0;\n}',
        out: '5',
        question: `In "${lessonTitle}", what does add(2, 3) return?`,
      };
    }
    if (lessonIndex <= 1) {
      return {
        code: '#include <stdio.h>\n\nint main(void) {\n  int a = 4;\n  int b = 3;\n\n  printf("%d\\n", a + b);\n  return 0;\n}',
        out: '7',
        question: `In "${lessonTitle}", what is printed after adding a and b?`,
      };
    }
    return {
      code: '#include <stdio.h>\n\nint main(void) {\n  int a = 4;\n  int b = 3;\n  int total = a + b;\n\n  printf("%d\\n", total);\n  return 0;\n}',
      out: '7',
      question: `In "${lessonTitle}", what is printed after adding the two variables?`,
    };
  }

  if (language === 'javascript') {
    if (teachesConditions) {
      return {
        code: 'const score = 75;\nif (score >= 60) {\n  console.log("pass");\n} else {\n  console.log("fail");\n}',
        out: 'pass',
        question: `In "${lessonTitle}", what is logged for score = 75?`,
      };
    }
    if (teachesLoops) {
      return {
        code: 'let sum = 0;\nfor (let i = 1; i <= 3; i++) {\n  sum += i;\n}\nconsole.log(sum);',
        out: '6',
        question: `In "${lessonTitle}", what is the final sum from the loop?`,
      };
    }
    return {
      code: 'const a = 4;\nconst b = 3;\nconsole.log(a + b);',
      out: '7',
      question: `In "${lessonTitle}", what value is logged for a + b?`,
    };
  }

  if (language === 'python') {
    if (teachesConditions) {
      return {
        code: 'score = 75\nif score >= 60:\n    print("pass")\nelse:\n    print("fail")',
        out: 'pass',
        question: `In "${lessonTitle}", what does this condition print?`,
      };
    }
    if (teachesLoops) {
      return {
        code: 'total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)',
        out: '6',
        question: `In "${lessonTitle}", what is printed after the loop?`,
      };
    }
    return {
      code: 'a = 4\nb = 3\nprint(a + b)',
      out: '7',
      question: `In "${lessonTitle}", what does a + b print?`,
    };
  }

  if (language === 'sql') {
    return {
      code: 'SELECT name\nFROM users\nWHERE is_active = 1\nLIMIT 2;',
      out: 'query parsed',
      question: `In "${lessonTitle}", which clause limits the number of returned rows?`,
    };
  }

  if (language === 'html_css') {
    return {
      code: '<h1 class="title">Hello</h1>\n<style>\n.title { color: steelblue; }\n</style>',
      out: 'rendered',
      question: `In "${lessonTitle}", which CSS rule controls the heading color?`,
    };
  }

  return { code: fallbackCode, out: fallbackOut, question: `In "${lessonTitle}", what is the expected output?` };
}

function isGenericStarter(language: LiveEditorLanguage, code: string | undefined): boolean {
  const src = String(code || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!src) return true;
  if (language === 'c') {
    return (
      src.includes('printf("hello') ||
      src.includes('printf("hi') ||
      src.includes('int main(void) { printf(') ||
      src === '#include <stdio.h> int main(void) { printf("hello\\n"); return 0; }'
    );
  }
  if (language === 'javascript') return src.includes('console.log("hello') || src.includes('console.log("hi');
  if (language === 'python') return src.includes('print("hello') || src.includes("print('hello");
  return false;
}

function ensurePracticalLesson(
  lesson: OutlineLesson,
  moduleTitle: string,
  lessonIndex: number,
  preferredLanguage: LiveEditorLanguage
): OutlineLesson {
  const lowerTitle = `${moduleTitle} ${lesson.title}`.toLowerCase();
  const jsPreferred = /node|javascript|js|backend|api|express|next/.test(lowerTitle);
  const inferredFromStarter = detectCodeLanguage(String(lesson.starterCode || ''));
  const language: LiveEditorLanguage =
    lesson.liveEditorLanguage || (inferredFromStarter as LiveEditorLanguage | null) || preferredLanguage || (jsPreferred ? 'javascript' : 'python');
  const providedStarterPretty = enforceReadableSpacing(prettifyStarterCode(lesson.starterCode, language));
  const rawProvidedStarter =
    lesson.starterCode
      ? ((lesson.liveEditorLanguage || language) === 'javascript'
          ? sanitizeJsStarterCode(providedStarterPretty || lesson.starterCode)
          : (lesson.liveEditorLanguage || language) === 'c'
            ? sanitizeCStarterCode(providedStarterPretty || lesson.starterCode)
            : (providedStarterPretty || lesson.starterCode))
      : simpleStarterForLanguage(language, lessonIndex).code;
  const finalStarterCode =
    (lesson.liveEditorLanguage || language) === 'c' && !hasBalancedCBraces(rawProvidedStarter)
      ? cStarterVariant(lessonIndex).code
      : rawProvidedStarter;
  const useSimpleStarter = shouldUseSimpleStarter(
    (lesson.liveEditorLanguage || language) as LiveEditorLanguage,
    finalStarterCode
  );
  const useContextStarter =
    useSimpleStarter ||
    isGenericStarter((lesson.liveEditorLanguage || language) as LiveEditorLanguage, finalStarterCode);

  const starterCode =
      language === 'javascript'
        ? 'const users = [{ id: 1, name: "Ali" }, { id: 2, name: "Lina" }];\n// TODO: print names in lowercase as comma-separated values\nconst result = users.map((u) => u.name.toLowerCase()).join(",");\nconsole.log(result);'
        : language === 'c'
          ? '#include <stdio.h>\n\nint main(void) {\n  // TODO: print names in lowercase as comma-separated values\n  printf("ali,lina\\n");\n  return 0;\n}'
        : language === 'sql'
          ? 'SELECT name\nFROM users\nWHERE is_active = 1\nORDER BY created_at DESC\nLIMIT 5;'
          : language === 'html_css'
            ? '<div class="card">Hello</div>\n<style>\n.card { color: #2563eb; }\n</style>'
            : 'print("Hello, Backend World!")\n# TODO: print your Python version';
  const expectedOutput =
    language === 'javascript'
      ? 'ali,lina'
      : language === 'python'
        ? 'hello, backend world!'
        : language === 'sql'
          ? 'query parsed'
          : language === 'c'
            ? 'ali,lina'
            : 'rendered';
  const contextual = buildContextualStarter(
    (lesson.liveEditorLanguage || language) as LiveEditorLanguage,
    moduleTitle,
    lesson.title,
    String(lesson.description || ''),
    lessonIndex,
    starterCode,
    expectedOutput
  );

  const resources = (lesson.resources || []).filter(Boolean);
  if (resources.length === 0) {
    resources.push(
      language === 'javascript'
        ? 'https://expressjs.com/'
        : language === 'c'
          ? 'https://en.cppreference.com/w/c'
          : 'https://docs.python.org/3/',
      'https://developer.mozilla.org/en-US/docs/Learn'
    );
  }

  const quizQuestions = Array.isArray(lesson.quizQuestions) ? lesson.quizQuestions.slice(0, 4) : [];
  const hasLiveQuestion = quizQuestions.some((q) =>
    /output|result|print|console|query|clause|condition|loop/i.test(String(q.questionText || ''))
  );
  if (!hasLiveQuestion) {
    quizQuestions.unshift({
      questionType: 'multiple_choice',
      questionText: contextual.question,
      options: [contextual.out, 'runtime error', 'no output', 'undefined'],
      correctOptionIndex: 0,
    });
  }

  const withVideoUrl =
    normalizeVideoForTopic(lesson.videoUrl, lowerTitle) || defaultVideoForTopic(lowerTitle);
function enforceQuizMatchesOutput(lesson: OutlineLesson): OutlineLesson {
  if (!lesson.enableLiveEditor || !lesson.expectedOutput) return lesson;
  const expected = lesson.expectedOutput.trim().toLowerCase();
  const lessonScopedQuestion = `In "${lesson.title}", what will the console print when you run this code?`;
  if (!Array.isArray(lesson.quizQuestions) || lesson.quizQuestions.length === 0) {
    return {
      ...lesson,
      quizQuestions: [
        {
          questionType: 'multiple_choice',
          questionText: lessonScopedQuestion,
          options: [
            expected,
            expected.split('').reverse().join(''),
            expected.toUpperCase(),
            `error: ${expected}`,
          ],
          correctOptionIndex: 0,
        },
      ],
    };
  }
  return {
    ...lesson,
    quizQuestions: lesson.quizQuestions.map((q) => {
      if (!Array.isArray(q.options) || q.options.length === 0) return q;
      const opts = [...q.options];
      opts[q.correctOptionIndex ?? 0] = expected;
      const normalizedText = String(q.questionText || '').trim();
      const isGenericOutputQuestion =
        /^what will the console print when you run this code\??$/i.test(normalizedText) ||
        /^what is the expected output\??$/i.test(normalizedText);
      return {
        ...q,
        questionText: isGenericOutputQuestion ? lessonScopedQuestion : normalizedText,
        options: opts,
        correctOptionIndex: q.correctOptionIndex ?? 0,
      };
    }),
  };
}
  return {
    ...lesson,
    type: lesson.type === 'video_embed' && lessonIndex % 2 === 0 ? 'code_example' : lesson.type,
    enableLiveEditor: true,
    liveEditorLanguage: lesson.liveEditorLanguage || language,
    starterCode: useContextStarter ? contextual.code : (finalStarterCode || contextual.code),
    expectedOutput: useContextStarter ? contextual.out : (lesson.expectedOutput || contextual.out),
    videoUrl: withVideoUrl,
    resources,
    quizQuestions,
  };
}

function stripLiveCompilerLikeQuestions(lesson: OutlineLesson): OutlineLesson {
  if (!lesson.enableLiveEditor || !Array.isArray(lesson.quizQuestions) || lesson.quizQuestions.length === 0) {
    return lesson;
  }
  const expected = String(lesson.expectedOutput || '').trim().toLowerCase();
  const filtered = lesson.quizQuestions.filter((q) => {
    const text = String(q.questionText || '').toLowerCase();
    const asksAboutRunOutput =
      /exact output|starter script|run.*code|what.*output|console\.log|print\(/i.test(text);
    const written = String(q.writtenAnswer || q.options?.[0] || '').trim().toLowerCase();
    const mirrorsExpected = Boolean(expected) && written === expected;
    return !(asksAboutRunOutput || mirrorsExpected);
  });
  return { ...lesson, quizQuestions: filtered };
}

function enrichModules(modules: OutlineModule[], preferredLanguage: LiveEditorLanguage): OutlineModule[] {
  const usedQuizKeys = new Set<string>();
  return modules.map((module) => {
    const baseLessons = module.lessons.slice(0, 8);
    if (baseLessons.length === 0) return module;

    const enriched = baseLessons.map((lesson, lessonIndex) => {
      const shouldForcePractical =
        lesson.enableLiveEditor ||
        lesson.type === 'code_example' ||
        /practice|exercise|hands[- ]?on|coding|implementation|build/i.test(
          `${lesson.title} ${lesson.description || ''}`
        );

      if (!shouldForcePractical) {
        const topicText = `${module.title} ${lesson.title}`;
        return appendExtraCodeExample(ensureDetailedExplanation({
          ...lesson,
          resources: lesson.resources?.length ? lesson.resources : [],
          videoUrl: normalizeVideoForTopic(lesson.videoUrl, topicText),
          quizQuestions: [],
        }));
      }

  const processed = stripLiveCompilerLikeQuestions(
    ensureDetailedExplanation(ensurePracticalLesson(lesson, module.title, lessonIndex, preferredLanguage))
  );
if (Array.isArray(processed.quizQuestions)) {
  processed.quizQuestions = processed.quizQuestions.filter((q) => {
    const key = q.questionText.toLowerCase().replace(/\s+/g, ' ').trim();
    if (usedQuizKeys.has(key)) return false;
    usedQuizKeys.add(key);
    return true;
  });
}
return appendExtraCodeExample(processed);
    });

    return {
      ...module,
      lessons: enriched,
    };
  });
}

function enforceTopicRelevance(modules: OutlineModule[], profile: TopicProfile): OutlineModule[] {
  return modules.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson) => {
      const fullText = `${module.title} ${lesson.title} ${lesson.description || ''}`.toLowerCase();
      const blockedHit = profile.blockedKeywords.some((k) => fullText.includes(k));
      const hasTopicHint = profile.keywords.some((k) => fullText.includes(k));
      const correctedTitle =
        blockedHit && !hasTopicHint ? `${profile.key === 'node' ? 'Express' : 'Programming'} ${lesson.title}` : lesson.title;

      return {
        ...lesson,
        title: correctedTitle,
      };
    }),
  }));
}

function validateAndFixLinks(modules: OutlineModule[], profile: TopicProfile): OutlineModule[] {
  const allowedDomainsByLang: Record<LiveEditorLanguage, string[]> = {
    javascript: ['developer.mozilla.org', 'nodejs.org', 'expressjs.com', 'javascript.info'],
    python: ['docs.python.org', 'realpython.com', 'pypi.org'],
    html_css: ['developer.mozilla.org', 'w3.org', 'css-tricks.com', 'web.dev'],
    sql: ['postgresql.org', 'mysql.com', 'sqlite.org', 'developer.mozilla.org'],
    c: ['en.cppreference.com', 'gnu.org', 'clang.llvm.org', 'learn.microsoft.com'],
  };

  const lessonLanguage = (lesson: OutlineLesson): LiveEditorLanguage => {
    const raw = String(lesson.liveEditorLanguage || '').toLowerCase();
    if (raw === 'javascript' || raw === 'python' || raw === 'html_css' || raw === 'sql' || raw === 'c') {
      return raw;
    }
    return inferPreferredLiveEditorLanguage(`${lesson.title} ${lesson.description || ''}`, profile);
  };

  const isRelevantResource = (url: string, contextText: string, lang: LiveEditorLanguage) => {
    if (!isUrlFormatValid(url)) return false;
    let host = '';
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      return false;
    }

    const allowedHosts = allowedDomainsByLang[lang];
    if (!allowedHosts.some((d) => host === d || host.endsWith(`.${d}`))) return false;

    const lower = `${url} ${contextText}`.toLowerCase();
    const blocked = profile.blockedKeywords.some((k) => lower.includes(k));
    if (blocked) return false;

    const hasTopicHint = profile.keywords.some((k) => lower.includes(k));
    const langHintByLang: Record<LiveEditorLanguage, RegExp> = {
      javascript: /\bjavascript\b|\bnode\b|\bexpress\b|js/,
      python: /\bpython\b|\bdjango\b|\bflask\b/,
      html_css: /\bhtml\b|\bcss\b|\bfrontend\b|\bdom\b/,
      sql: /\bsql\b|\bmysql\b|\bpostgres\b|\bsqlite\b|\bquery\b/,
      c: /\bc\b|gcc|clang|stdio|pointer|memory|ansi c/,
    };
    return hasTopicHint || langHintByLang[lang].test(lower);
  };

  const fixed: OutlineModule[] = [];
  for (const module of modules) {
    const lessons: OutlineLesson[] = [];
    for (const lesson of module.lessons) {
      const resources = (lesson.resources || []).filter((u) => /^https?:\/\//i.test(u));
      const approved: string[] = [];
      const lang = lessonLanguage(lesson);
      const contextText = `${module.title} ${lesson.title} ${lesson.description || ''}`;
      for (const link of resources.slice(0, 6)) {
        if (isRelevantResource(link, contextText, lang)) approved.push(link);
      }
      const shouldAttachResources = approved.length > 0;

      const videoCandidate = normalizeVideoForTopic(lesson.videoUrl, `${module.title} ${lesson.title}`);
      const videoUrl = videoCandidate && isUrlFormatValid(videoCandidate)
        ? videoCandidate
        : undefined;

      lessons.push({
        ...lesson,
        resources: shouldAttachResources ? dedupeStringArray(approved).slice(0, 4) : [],
        videoUrl,
      });
    }
    fixed.push({ ...module, lessons });
  }
  return fixed;
}

function jsStarterVariant(index: number) {
  const variants = [
    {
      code: 'const users = [{ id: 1, name: "Ali" }, { id: 2, name: "Lina" }];\nconst result = users.map((u) => u.name.toLowerCase()).join(",");\nconsole.log(result);',
      out: 'ali,lina',
    },
    {
      code: 'const nums = [2, 4, 6];\nconst total = nums.reduce((a, b) => a + b, 0);\nconsole.log(total);',
      out: '12',
    },
    {
      code: 'const products = [{ name: "Book", price: 10 }, { name: "Pen", price: 2 }];\nconst expensive = products.filter((p) => p.price >= 5).map((p) => p.name).join(",");\nconsole.log(expensive);',
      out: 'Book',
    },
    {
      code: 'const text = "Express API";\nconsole.log(text.toLowerCase().replace(" ", "-"));',
      out: 'express-api',
    },
  ];
  return variants[index % variants.length];
}

function pyStarterVariant(index: number) {
  const variants = [
    { code: 'nums = [1, 2, 3]\nprint(sum(nums))', out: '6' },
    { code: 'words = ["API", "Course"]\nprint("-".join(w.lower() for w in words))', out: 'api-course' },
    { code: 'name = "Aivora"\nprint(name.lower())', out: 'aivora' },
  ];
  return variants[index % variants.length];
}

function cStarterVariant(index: number) {
  const variants = [
    { code: '#include <stdio.h>\n\nint main(void) {\n  printf("hello\\n");\n  return 0;\n}', out: 'hello' },
    { code: '#include <stdio.h>\n\nint main(void) {\n  int total = 2 + 4 + 6;\n  printf("%d\\n", total);\n  return 0;\n}', out: '12' },
    { code: '#include <stdio.h>\n\nint main(void) {\n  const char *name = "aivora";\n  printf("%s\\n", name);\n  return 0;\n}', out: 'aivora' },
  ];
  return variants[index % variants.length];
}

function shouldUseSimpleStarter(language: LiveEditorLanguage, code: string | undefined): boolean {
  const src = String(code || '').trim();
  if (!src) return true;
  const lines = src.split('\n').length;
  if (lines > 28 || src.length > 900) return true;
  if (language === 'c') {
    const defineCount = (src.match(/^\s*#\s*define\b/gm) || []).length;
    if (defineCount > 1) return true;
    if (/typedef|struct|union|enum|#\s*if|#\s*ifdef|#\s*ifndef/.test(src)) return true;
  }
  return false;
}

function simpleStarterForLanguage(language: LiveEditorLanguage, index: number): { code: string; out: string } {
  if (language === 'javascript') return jsStarterVariant(index);
  if (language === 'python') return pyStarterVariant(index);
  if (language === 'c') return cStarterVariant(index);
  if (language === 'sql') {
    return { code: 'SELECT name\nFROM users\nWHERE is_active = 1\nLIMIT 3;', out: 'query parsed' };
  }
  return {
    code: '<h1>Hello</h1>\n<style>\nh1 { color: #2563eb; }\n</style>',
    out: 'rendered',
  };
}

function hasBalancedCBraces(code: string): boolean {
  const src = String(code || '');
  if (!src.trim()) return false;
  let balance = 0;
  let inSingle = false;
  let inDouble = false;
  let escape = false;

  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (!inDouble && ch === "'") {
      inSingle = !inSingle;
      continue;
    }
    if (!inSingle && ch === '"') {
      inDouble = !inDouble;
      continue;
    }
    if (inSingle || inDouble) continue;
    if (ch === '{') balance += 1;
    if (ch === '}') {
      balance -= 1;
      if (balance < 0) return false;
    }
  }
  return !inSingle && !inDouble && balance === 0;
}

function enforceNoDuplicates(modules: OutlineModule[]): OutlineModule[] {
  const usedVideos = new Set<string>();
  const usedStarter = new Set<string>();
  const usedExtra = new Set<string>();
  let counter = 0;

  return modules.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson) => {
      const next = { ...lesson };
      const topicText = `${module.title} ${lesson.title}`;

      if (next.videoUrl) {
        const key = next.videoUrl.trim().toLowerCase();
        if (usedVideos.has(key)) {
          next.videoUrl = defaultVideoForTopic(`${topicText} ${counter}`);
        }
        if (next.videoUrl) usedVideos.add(next.videoUrl.trim().toLowerCase());
      }

      if (next.enableLiveEditor) {
        const lang = next.liveEditorLanguage || 'python';
        const starterKey = String(next.starterCode || '').trim().toLowerCase();
        if (!starterKey || usedStarter.has(starterKey)) {
          const variant =
            lang === 'javascript'
              ? jsStarterVariant(counter)
              : lang === 'c'
                ? cStarterVariant(counter)
                : pyStarterVariant(counter);
          next.starterCode = variant.code;
          next.expectedOutput = variant.out;
        }
        usedStarter.add(String(next.starterCode || '').trim().toLowerCase());
      }

      if (next.description) {
        const extraKey = next.description.toLowerCase().replace(/\s+/g, ' ').trim();
        if (usedExtra.has(extraKey)) {
          next.description = `${next.description}\n\nExtra Exercise:\nTry changing the input values and compare the output.`;
        }
        usedExtra.add(next.description.toLowerCase().replace(/\s+/g, ' ').trim());
      }

      counter += 1;
      return next;
    }),
  }));
}

function topicScore(text: string, profile: TopicProfile): number {
  const normalized = text.toLowerCase();
  let score = 0;
  for (const k of profile.keywords) {
    if (normalized.includes(k)) score += 2;
  }
  for (const b of profile.blockedKeywords) {
    if (normalized.includes(b)) score -= 3;
  }
  return score;
}

function strictSanitizeModules(modules: OutlineModule[], profile: TopicProfile): OutlineModule[] {
  const usedLessonTitles = new Set<string>();
  const usedQuizQuestions = new Set<string>();
  const usedVideos = new Set<string>();
  const usedResources = new Set<string>();
  const usedStarter = new Set<string>();

  const cleaned: OutlineModule[] = [];
  for (const module of modules) {
    const keptLessons: OutlineLesson[] = [];
    for (const lesson of module.lessons) {
      const combined = `${module.title} ${lesson.title} ${lesson.description || ''}`;
      if (topicScore(combined, profile) < 0) {
        continue;
      }

      const lessonTitleKey = lesson.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (usedLessonTitles.has(lessonTitleKey)) continue;
      usedLessonTitles.add(lessonTitleKey);

      let next: OutlineLesson = { ...lesson };
      if (next.videoUrl) {
        const vk = next.videoUrl.toLowerCase().trim();
        if (usedVideos.has(vk)) next.videoUrl = undefined;
        else usedVideos.add(vk);
      }

      if (next.resources?.length) {
        const resourceFiltered = next.resources.filter((r) => {
          if (!isUrlFormatValid(r)) return false;
          const rk = r.toLowerCase().trim();
          if (usedResources.has(rk)) return false;
          usedResources.add(rk);
          return true;
        });
        next.resources = resourceFiltered;
      }

      if (next.enableLiveEditor) {
        const sk = String(next.starterCode || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (sk && usedStarter.has(sk)) {
          const variant =
            (next.liveEditorLanguage || 'python') === 'javascript'
              ? jsStarterVariant(usedStarter.size + 1)
              : (next.liveEditorLanguage || 'python') === 'c'
                ? cStarterVariant(usedStarter.size + 1)
                : pyStarterVariant(usedStarter.size + 1);
          next.starterCode = variant.code;
          next.expectedOutput = variant.out;
        }
        const finalSk = String(next.starterCode || '').toLowerCase().replace(/\s+/g, ' ').trim();
        if (finalSk) usedStarter.add(finalSk);
      }
// dedupe quiz questions across all lessons
if (Array.isArray(next.quizQuestions)) {
  next.quizQuestions = next.quizQuestions.filter((q) => {
  const key = q.questionText.toLowerCase().replace(/\s+/g, ' ').trim();
  if (usedQuizQuestions.has(key)) return false;
  usedQuizQuestions.add(key);
  return true;
});
}
      next.description = dedupeTextBlocks(String(next.description || ''));
      keptLessons.push(next);
    }

    if (keptLessons.length > 0) {
      cleaned.push({ ...module, lessons: keptLessons.slice(0, 8) });
    }
  }

  return cleaned.slice(0, HARD_MAX_MODULES);
}

async function generateOutlineOnlyFromAi(input: {
  apiKey: string;
  model: string;
  prompt: string;
  courseTitle: string;
  constraints: GenerationConstraints;
}): Promise<OutlineOnlyModule[] | null> {
 const instruction =
  `Return ONLY a raw JSON object - no markdown, no backticks, no explanation.\n` +
  `Schema: {"modules":[{"title":"","description":"","lessons":[{"title":"","objective":""}]}]}\n\n` +
  `RULES:\n` +
  `[1] STRUCTURE:\n` +
  `  - Exactly ${input.constraints.minModules}-${input.constraints.maxModules} modules\n` +
  `  - Exactly 4-5 lessons per module\n` +
  `  - Modules must progress logically: fundamentals -> core concepts -> advanced -> real-world application\n` +
  `[2] MODULE:\n` +
  `  - title: short and specific (e.g. "Routing and Middleware in Express")\n` +
  `  - description: 1-2 sentences about what this module covers and why it matters\n` +
  `[3] LESSON:\n` +
  `  - title: action-oriented and specific (e.g. "Handle POST Requests with body-parser")\n` +
  `  - objective: one sentence starting with a verb describing what the student will DO\n` +
  `  - Lessons within each module must progress from simple to complex\n` +
  `  - No duplicate lesson titles across the entire course\n` +
  `[4] RELEVANCE:\n` +
  `  - Every module and lesson must be specific to the course topic\n` +
  `  - No generic programming lessons (e.g. "Introduction to Variables", "What is a Function")\n` +
  `  - No filler modules (e.g. "Conclusion", "Final Thoughts", "Recap")\n` +
  `[5] DEPENDENCY ORDER (CRITICAL):\n` +
  `  - Every lesson must ONLY assume knowledge taught in previous lessons within this course\n` +
  `  - Never reference a concept before it is introduced (e.g. do not use "middleware" in module 1 if middleware is taught in module 3)\n` +
  `  - Each module must be fully understandable using only what was covered before it\n` +
  `  - Lesson order within each module: define -> demonstrate -> apply -> edge cases\n` +
  `  - If a concept is a prerequisite, it must appear earlier in the outline, not assumed as prior knowledge\n`;

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      input: [
        { role: 'system', content: instruction },
        {
          role: 'user',
          content:
            `Create OUTLINE ONLY for: ${input.prompt}.\n` +
            `Course title: ${input.courseTitle}\n` +
            `Audience: complete beginners - assume zero prior knowledge.\n` +
            `Priority: logical dependency order over topic completeness. ` +
            `If a topic requires too many prerequisites, defer it to a later module or drop it.`,
        },
      ],
    }),
  });
  if (!res.ok) return null;
  const data: unknown = await res.json();
  return normalizeOutlineOnly(extractJsonObject(extractOpenAiText(data)));
}

async function generateLessonDetailsFromAi(input: {
  apiKey: string;
  model: string;
  topic: string;
  courseTitle: string;
  moduleTitle: string;
  lessonTitle: string;
  objective: string;
  preferredLanguage: LiveEditorLanguage;
  moduleIndex: number;
  totalModules: number;
  lessonIndex: number;
  totalLessons: number;
  priorConcepts: string[];
}): Promise<OutlineLesson | null> {
 const instruction =
  `Return JSON only: {"title":"","description":"","content":"markdown string with full lesson content","hint":"","type":"text|code_example|video_embed","durationMinutes":10,"enableLiveEditor":false,"liveEditorLanguage":"${input.preferredLanguage}","starterCode":"","exampleCode":"","expectedOutput":"","videoUrl":"","resources":[""],"quizQuestions":[{"questionType":"multiple_choice","questionText":"","options":["","","",""],"correctOptionIndex":0}],"hints":["","",""]}. ` +
  'Rules: ' +
  '1. description = 60-80 words MAX. Cover: what+why+pitfall. No filler. ' +
  '2. enableLiveEditor=true only for code_example type. starterCode must match liveEditorLanguage exactly (no language mixing). For javascript only: browser-safe JS (no require/import/process/express()). For C code: return valid compilable C11 code with balanced braces, one declaration per line, each #define on its own line, and use escaped newline in strings ("\\\\n", never raw line-break inside quotes). Make it warning-free where possible (correct size_t usage and printf specifiers such as %zu). Use proper line breaks and indentation (never one-line compressed code), and include one empty line between logical steps/blocks for readability. expectedOutput must match the starterCode output format for that language. ' +
  '2.1 For lessons that include an explanation example, fill exampleCode with a short readable snippet (5-20 lines) using clear new lines and indentation. ' +
  '[QUIZ & LIVE EDITOR]: If enableLiveEditor=false: quizQuestions=[], hints=[], skip this section entirely. ' +
  '[Q1] QUESTION RULES: Exactly 1 question per lesson. Question must be about the starterCode output specifically. Include the lesson title in questionText to ensure uniqueness across lessons. Keep it short and clear (max 20 words). Never ask about concepts not yet introduced in this or previous lessons. Never repeat a question from another lesson. Vary question style (e.g. "What does this code print?", "What is the value of X?", "Which line causes Y?"). ' +
  '[Q1.1] QUESTION-CONTEXT MATCH: The quiz question must closely match the exact example used in this lesson (starterCode/exampleCode), not a generic variant. Ask about the same variables/functions/data used in the lesson snippet so the question feels like a direct continuation of that example. ' +
  '[Q2] OPTIONS RULES: Exactly 4 options. correctOptionIndex must point to the option that matches expectedOutput exactly (same format and whitespace). Wrong options must be plausible but incorrect (off-by-one, common type/format mistakes, wrong order, or common beginner mistakes). No trick or absurd options. ' +
  '[Q3] LIVE EDITOR LANGUAGE: liveEditorLanguage must match the course language exactly. Never mix languages. starterCode must be valid and runnable in liveEditorLanguage. ' +
  '[Q4] HINTS (progressive): hints must be an array of exactly 3 strings. hints[0]=general direction (after 1st failed attempt), hints[1]=more specific operation/method (after 2nd failed attempt), hints[2]=almost answer structure without exact code (after 3rd failed attempt). Each hint must be exactly 1 sentence. Never reveal the answer or show code in hints. Hints must relate directly to starterCode and expectedOutput. ' +
  '[LIVE EDITOR SELECTION]: enableLiveEditor=true only when the lesson genuinely benefits from hands-on practice. Target 60-70% of lessons per module with live editor. MUST have live editor for specific practical tasks (e.g. handling POST requests, writing SQL JOINs), lessons requiring writing/running code, and lessons with clear testable expectedOutput. Must NOT have live editor for introductions/overviews, conceptual reading-first lessons (e.g. event loop), lessons not demonstrable in a self-contained snippet, and video_embed lessons. When enableLiveEditor=false: starterCode="", exampleCode="", expectedOutput="", quizQuestions=[], hints=[]. ' +
  '[CODE FORMATTING]: exampleCode and starterCode must use real newlines, never \\n as a literal string. Each statement should be on its own line. Add one blank line between logical blocks. Never write code as one compressed line. Use consistent indentation (2 or 4 spaces). ' +
  '[STARTER CODE FORMATTING]: Every comment must be on its own dedicated line and never inline after code. Never place a comment and a statement on the same line. Every statement must be on its own line. Never compress multiple statements into one line. Comments must go ABOVE the code they describe, not beside it. Example WRONG: x = 1 # set x. RIGHT: # set x then x = 1 on the next line. ' +
  'CRITICAL: starterCode must be valid, runnable code with no syntax errors. Every opening bracket/brace/parenthesis must have a matching closing one. List comprehensions must be complete: [expr for var in iterable if condition]. Never split a statement across lines unless using proper Python line continuation. Test mentally: would this code run without SyntaxError? ' +
 '4. videoUrl: one relevant YouTube link. resources: 2-3 real working links strictly related to this lesson and course language (no unrelated links). ' +
  '5. Choose type based on lesson content. If the lesson is about a specific practical task (e.g. handling POST requests), prefer code_example. If it’s about understanding concepts, prefer text. video_embed if it’s best explained visually (e.g. event loop). ' +
  '6. durationMinutes: 10-20 mins. Longer for code_example, shorter for text. ' +
  '7. Ensure all content is highly relevant to the topic and course title. No generic programming lessons. ' +
  '8. No duplicate lesson titles within the same module. ' +
  '9. content (markdown): Write a full lesson explanation in Markdown format. Structure: "## What is [concept]" (clear definition), "## Why it matters" (real-world relevance), "## How it works" (step-by-step), "## Common mistakes" (2-3 pitfalls with fixes), and "## Summary" (3-4 bullet recap). Use **bold** for key terms and `inline code` for syntax. Do not repeat the lesson title as a heading. Length: 300-500 words. Language: same as course language (code examples aligned with liveEditorLanguage). ' +
  '10. [HINT]: hint must be 1-2 sentences max. It should guide the student toward the solution without revealing it. Focus on WHAT to do, not HOW exactly. Never provide the answer and never include code in the hint. ' +
  '[CONTENT FORMATTING]: Use real newlines between every section, paragraph, and list item. Never use \\n as a literal string; always use actual line breaks. Always add exactly one blank line before and after ## headings. Always add exactly one blank line before and after code blocks. Never write more than 3 sentences in one paragraph. Never dump all content as one long block of text. Use **bold** for key terms and `inline code` for any syntax or function name. ' +
  '[CODE CONSISTENCY]: starterCode and exampleCode must be about the same concept and use the same approach. exampleCode should demonstrate the concept with a complete working example. starterCode should use the same concept in a slightly different scenario where the student completes or modifies logic. Never use a completely different scenario in starterCode vs exampleCode. The student should be able to look at exampleCode and immediately understand what to do in starterCode. ' +
  '[EXAMPLE CODE UNIQUENESS]: Each code example in the lesson content must be unique; never repeat the same example twice. exampleCode must be different from any code snippet inside content. starterCode must be different from exampleCode (same concept, different scenario). If referencing a previous example, describe it in text instead of repeating code. ' +
  '[CODE DEPENDENCY ORDER]: starterCode, exampleCode, and all code snippets inside content must ONLY use concepts and syntax introduced in this lesson or taught in previous lessons within this course. Never use a function, method, or pattern before it is introduced in the outline. If a concept is needed for the example but not yet taught, simplify the example instead. This applies to starterCode, exampleCode, content code blocks, and quiz question context. Example violation: using .reduce() in module 1 lesson 2 when .reduce() is taught in module 3. When in doubt, use simpler code over complete code.';

  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: input.model,
      input: [
        { role: 'system', content: instruction },
        {
          role: 'user',
          content:
            `Course: ${input.courseTitle}\n` +
            `Topic: ${input.topic}\n` +
            `Module: ${input.moduleTitle}\n` +
            `Lesson: ${input.lessonTitle}\n` +
            `Objective: ${input.objective}\n` +
            `Module position: ${input.moduleIndex + 1} of ${input.totalModules}\n` +
            `Lesson position: ${input.lessonIndex + 1} of ${input.totalLessons}\n` +
            `Concepts taught so far: ${input.priorConcepts.join(', ')}\n` +
            'Generate full lesson details.',
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data: unknown = await res.json();
  const rawText = extractOpenAiText(data);
  const fixedText = rawText.replace(
    /"content"\s*:\s*"((?:[^"\\]|\\[\s\S])*)"/g,
    (match, contentValue) => {
      const fixed = String(contentValue || '')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '  ');
      return `"content": ${JSON.stringify(fixed)}`;
    }
  );
  const parsed = extractJsonObject(fixedText) as Record<string, unknown> | null;
  if (!parsed) return null;

  const title = clampText(String(parsed.title || input.lessonTitle), DB_TITLE_MAX);
  const description = clampText(String(parsed.description || input.objective), DB_DESC_MAX);
  const typeRaw = String(parsed.type || 'text');
  const type: OutlineLesson['type'] = typeRaw === 'code_example' || typeRaw === 'video_embed' ? typeRaw : 'text';
  const durationMinutes = Math.max(5, Number(parsed.durationMinutes || 15));
  const langRaw = String(parsed.liveEditorLanguage || input.preferredLanguage || 'python');
  const liveEditorLanguage: 'python' | 'javascript' | 'html_css' | 'sql' | 'c' =
    langRaw === 'python' || langRaw === 'javascript' || langRaw === 'html_css' || langRaw === 'sql' || langRaw === 'c'
      ? langRaw
      : input.preferredLanguage;
  const starterCodeRaw = String(parsed.starterCode || '').trim();
  const exampleCodeRaw = String(parsed.exampleCode || '').trim();
  const detected = detectCodeLanguage(starterCodeRaw);
  const finalLang = liveEditorLanguage || detected || input.preferredLanguage;
  const starterCodeNormalized = normalizeGeneratedCode(starterCodeRaw) || '';
  const prettyStarter = enforceReadableSpacing(prettifyStarterCode(starterCodeNormalized, finalLang));
  const starterCode =
    finalLang === 'javascript'
      ? sanitizeJsStarterCode(prettyStarter || '')
      : finalLang === 'c'
        ? sanitizeCStarterCode(prettyStarter || '')
        : prettyStarter || '';
  const safeStarterCode =
    finalLang === 'c' && !hasBalancedCBraces(starterCode)
      ? cStarterVariant(0).code
      : starterCode;
  const contextual = buildContextualStarter(
    finalLang,
    input.moduleTitle,
    title,
    description,
    0,
    safeStarterCode || '',
    String(parsed.expectedOutput || '').trim() || 'rendered'
  );
  const simpleStarter =
    shouldUseSimpleStarter(finalLang, safeStarterCode) ? simpleStarterForLanguage(finalLang, 0) : null;
  const shouldUseContextStarter =
    Boolean(simpleStarter) || isGenericStarter(finalLang, safeStarterCode);
  const fixCode = (raw: string) =>
    String(raw || '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '  ')
      .replace(/;(\s*)(?=[^\s])/g, ';\n')
      .replace(/(#[^\n]+)\n([^\n])/g, '$1\n\n$2')
      .replace(/(\/\/[^\n]+)\n([^\n])/g, '$1\n\n$2')
      .replace(/(\/\*[^*]*\*\/)\n([^\n])/g, '$1\n\n$2')
      .trim();
  const fixStarterCodeFormatting = (code: string, lang: string): string => {
    if (!code) return code;
    return String(code)
      .split('\n')
      .flatMap((line) => {
        const trimmed = line.trim();
        if (!trimmed) return [line];

        if (lang === 'python' || lang === 'javascript') {
          const inlineComment =
            lang === 'python'
              ? /^([^#'"]+?)\s+(#.+)$/
              : /^([^/'"]+?)\s+(\/\/.+)$/;
          const match = trimmed.match(inlineComment);
          if (match && match[1].trim() && match[2].trim()) {
            const indent = line.match(/^(\s*)/)?.[1] ?? '';
            return [`${indent}${match[2].trim()}`, `${indent}${match[1].trim()}`];
          }
        }
        return [line];
      })
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };
  const ensureNewlinesAroundSyntax = (text: string): string => {
    return String(text || '')
      .replace(/([^\n])\n```/g, '$1\n\n```')
      .replace(/```\n([^\n])/g, '```\n\n$1')
      .replace(/([^\n`])`([^`]+)`([^\n`])/g, '$1\n`$2`\n$3')
      .replace(/([^\n*])\*\*([^*]+)\*\*([^\n*])/g, '$1\n**$2**\n$3')
      .replace(/([^\n])\n([-*] )/g, '$1\n\n$2')
      .replace(/([^\n])\n(\d+\. )/g, '$1\n\n$2')
      .replace(/([^\n])\n(> )/g, '$1\n\n$2')
      .replace(/(> [^\n]+)\n([^\n>])/g, '$1\n\n$2')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };
  const fixPythonCode = (code: string): string => {
    if (!code) return code;

    const raw = String(code)
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '    ')
      .replace(/;\s*(?=\S)/g, '\n');

    const baseLines = raw.split('\n');
    const normalizedLines: string[] = [];
    let currentIndent = 0;
    let roundBalance = 0;
    let squareBalance = 0;
    let curlyBalance = 0;

    for (const line of baseLines) {
      const trimmed = line.trim();
      if (!trimmed) {
        normalizedLines.push('');
        continue;
      }

      // Move inline comments to their own line for readability.
      const pyInlineComment = trimmed.match(/^([^#'"]+?)\s+(#.+)$/);
      if (pyInlineComment && pyInlineComment[1]?.trim() && pyInlineComment[2]?.trim()) {
        normalizedLines.push(`${' '.repeat(currentIndent)}${pyInlineComment[2].trim()}`);
      }

      const codePart = pyInlineComment ? pyInlineComment[1].trim() : trimmed;

      // Dedent for continuation keywords before writing current line.
      if (/^(elif\b|else:|except\b|finally:)/.test(codePart)) {
        currentIndent = Math.max(0, currentIndent - 4);
      }

      let candidate = codePart;

      // Repair broken one-line list/set/dict comprehensions with missing spacing.
      candidate = candidate
        .replace(/\[\s*([^\]]+?)\s+for\s+/g, '[ $1 for ')
        .replace(/\{\s*([^}]+?)\s+for\s+/g, '{ $1 for ')
        .replace(/\s+if\s+([^\]]+)\]/g, ' if $1 ]');

      normalizedLines.push(`${' '.repeat(currentIndent)}${candidate}`.replace(/\s+$/g, ''));

      // Track brackets to close unbalanced structures later.
      for (const ch of candidate) {
        if (ch === '(') roundBalance += 1;
        if (ch === ')') roundBalance -= 1;
        if (ch === '[') squareBalance += 1;
        if (ch === ']') squareBalance -= 1;
        if (ch === '{') curlyBalance += 1;
        if (ch === '}') curlyBalance -= 1;
      }

      // Increase indent after block-open lines.
      if (/:$/.test(candidate) && /^(def\b|class\b|if\b|elif\b|else:|for\b|while\b|try:|except\b|finally:|with\b)/.test(candidate)) {
        currentIndent += 4;
      }
    }

    while (roundBalance > 0) {
      normalizedLines.push(`${' '.repeat(currentIndent)})`);
      roundBalance -= 1;
    }
    while (squareBalance > 0) {
      normalizedLines.push(`${' '.repeat(currentIndent)}]`);
      squareBalance -= 1;
    }
    while (curlyBalance > 0) {
      normalizedLines.push(`${' '.repeat(currentIndent)}}`);
      curlyBalance -= 1;
    }

    return normalizedLines
      .join('\n')
      .replace(/(#[^\n]+)\n([^\n#])/g, '$1\n\n$2')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  };
  const exampleCode = fixCode(normalizeGeneratedCode(exampleCodeRaw) || '');
  const formattedStarter = fixStarterCodeFormatting(safeStarterCode || '', finalLang);
  const safeStarterCodeFinal = finalLang === 'python' ? fixPythonCode(formattedStarter) : formattedStarter;
  const exampleAsStarterFormatted = fixStarterCodeFormatting(exampleCode || '', finalLang);
  const exampleAsStarter =
    finalLang === 'python' ? fixPythonCode(exampleAsStarterFormatted) : exampleAsStarterFormatted;
  const shouldAlignStarterToExample =
    Boolean(exampleAsStarter) &&
    (!safeStarterCodeFinal || shouldUseContextStarter || isGenericStarter(finalLang, safeStarterCodeFinal || ''));
  const finalStarterCode = shouldAlignStarterToExample
    ? (exampleAsStarter || safeStarterCodeFinal || contextual.code)
    : (shouldUseContextStarter ? contextual.code : safeStarterCodeFinal);
  const finalExpectedOutput = shouldAlignStarterToExample
    ? (String(parsed.expectedOutput || '').trim() || contextual.out || 'done')
    : (shouldUseContextStarter ? contextual.out : String(parsed.expectedOutput || '').trim());
  const resources = Array.isArray(parsed.resources)
    ? parsed.resources.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 4)
    : [];

 const quizRaw = Array.isArray(parsed.quizQuestions) ? parsed.quizQuestions : [];
const quizQuestions = quizRaw.map(normalizeQuizQuestion).filter(Boolean) as QuizQuestion[];

return {
  title,
  description,
  content: ensureNewlinesAroundSyntax(
    String(parsed.content || '')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '  ')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/(.)(\n?)(#{1,4} )/g, '$1\n\n$3')
      .replace(/(#{1,4} [^\n]+)\n([^\n])/g, '$1\n\n$2')
      .trim()
  ) || undefined,
  hint: String(parsed.hint || '').trim() || undefined,
  hints: Array.isArray(parsed.hints)
    ? parsed.hints.map((h) => String(h || '').trim()).filter(Boolean).slice(0, 3)
    : undefined,
  type,
  durationMinutes,
  enableLiveEditor:
    Boolean(parsed.enableLiveEditor) &&
    (type === 'code_example' || Boolean(finalStarterCode || simpleStarter?.code || safeStarterCode)),
  liveEditorLanguage: finalLang,
  starterCode: finalStarterCode || undefined,
  exampleCode: fixCode(exampleCode || '') || undefined,
  expectedOutput: finalExpectedOutput || undefined,
  videoUrl: String(parsed.videoUrl || '').trim() || undefined,
  resources,
  quizQuestions, 
};
}

export async function POST(req: Request, { params }: Params) {
  const chapterAuth = await requirePermission(req, 'course:add-chapter');
  if (chapterAuth) return chapterAuth;
  const lessonAuth = await requirePermission(req, 'course:add-lesson');
  if (lessonAuth) return lessonAuth;

  const { courseId } = await params;
  const normalizedCourseId = decodeURIComponent(courseId).trim();

  try {
    await ensureLessonLiveEditorLanguageSupportsSql();
    const body = await req.json().catch(() => ({}));
    const prompt = String(body?.prompt || '').trim();
    if (!prompt) {
      return NextResponse.json({ message: 'Prompt is required' }, { status: 400 });
    }

    const [courseRows] = await pool.query<RowDataPacket[]>(
      `SELECT id, title, teacherId FROM course WHERE id = ? LIMIT 1`,
      [normalizedCourseId]
    );
    if (courseRows.length === 0) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    const phase = Number(body?.phase || 2);
    const mode = String(body?.mode || '').trim(); // optional: outline_only | details | regenerate_lessons
    const constraints = extractGenerationConstraints(prompt);
    const profile = buildTopicProfile(`${prompt} ${String(courseRows[0].title || '')}`);
    const preferredLanguage = inferPreferredLiveEditorLanguage(
      `${prompt} ${String(courseRows[0].title || '')}`,
      profile
    );
    const apiKey = process.env.OPENAI_API_KEY;
    const model = (process.env.OPENAI_MODEL || 'gpt-5-mini').trim();

    if ((phase === 1 || mode === 'outline_only') && apiKey) {
      const outline = await generateOutlineOnlyFromAi({
        apiKey,
        model,
        prompt,
        courseTitle: String(courseRows[0].title || ''),
        constraints,
      });
      if (outline && outline.length > 0) {
        const boundedOutline = outline.slice(0, constraints.maxModules);
        return NextResponse.json({
          success: true,
          phase: 1,
          source: 'openai',
          outline: boundedOutline,
          message: 'Outline generated. Proceed to phase 2 to generate lesson details.',
        });
      }
      return NextResponse.json({
        success: true,
        phase: 1,
        source: 'fallback',
        outline: enforceModuleCount(fallbackOutline(prompt, preferredLanguage), constraints, prompt).map((m) => ({
          title: m.title,
          description: m.description,
          lessons: m.lessons.map((l) => ({ title: l.title, objective: l.description })),
        })),
        message: 'Fallback outline generated. Proceed to phase 2.',
      });
    }

    if (mode === 'regenerate_lessons' && apiKey) {
      const lessonIds = Array.isArray(body?.lessonIds)
        ? body.lessonIds.map((x: unknown) => String(x || '').trim()).filter(Boolean)
        : [];
      if (lessonIds.length === 0) {
        return NextResponse.json({ message: 'lessonIds are required for regenerate mode' }, { status: 400 });
      }
      await ensureCourseQuizSchema();
      const actor = await getRequestUser(req);
      const teacherIdFromCourse = String(courseRows[0].teacherId || '').trim();
      const actorId = String(actor?.id || '').trim();
      const questionTeacherId = teacherIdFromCourse || actorId;

      const placeholders = lessonIds.map(() => '?').join(',');
      const [rows] = await pool.query<RowDataPacket[]>(
        `
        SELECT l.id, l.title, l.description, l.moduleId, m.title AS moduleTitle
        FROM lesson l
        JOIN module m ON m.id = l.moduleId
        WHERE m.courseId = ? AND l.id IN (${placeholders})
        `,
        [normalizedCourseId, ...lessonIds]
      );

      let updated = 0;
      for (const row of rows) {
        const details = await generateLessonDetailsFromAi({
          apiKey,
          model,
          topic: prompt,
            courseTitle: String(courseRows[0].title || ''),
            moduleTitle: String(row.moduleTitle || ''),
            lessonTitle: String(row.title || ''),
            objective: String(row.description || ''),
            preferredLanguage,
            moduleIndex: 0,
            totalModules: 1,
            lessonIndex: 0,
            totalLessons: 1,
            priorConcepts: [],
          });
        if (!details) continue;
        let prepared = ensureDetailedExplanation(details);
        prepared = ensurePracticalLesson(prepared, String(row.moduleTitle || ''), 0, preferredLanguage);
        prepared = sanitizeLessonForDb(prepared);

          await pool.query(
            `
            UPDATE lesson
          SET title = ?, description = ?, content = ?, videoUrl = ?, durationMinutes = ?, type = ?, enableLiveEditor = ?, liveEditorLanguage = ?, updatedAt = NOW()
          WHERE id = ?
          `,
          [
            prepared.title,
            prepared.description || null,
            lessonToContent(prepared),
            prepared.videoUrl || null,
            prepared.durationMinutes,
            prepared.type,
            Boolean(prepared.enableLiveEditor),
            prepared.liveEditorLanguage || 'python',
            String(row.id),
            ]
          );

          await pool.query(
            `DELETE FROM course_question_bank WHERE courseId = ? AND lessonId = ?`,
            [normalizedCourseId, String(row.id)]
          );

          if (questionTeacherId && Array.isArray(prepared.quizQuestions)) {
            for (const q of prepared.quizQuestions.slice(0, 4)) {
              const options =
                q.questionType === 'written'
                  ? [String(q.writtenAnswer || q.options?.[0] || '').trim()]
                  : q.questionType === 'true_false'
                    ? ['True', 'False']
                    : (q.options || []).slice(0, 4);
              const correctIndex =
                q.questionType === 'written'
                  ? 0
                  : q.questionType === 'true_false'
                    ? Number(q.correctOptionIndex === 1 ? 1 : 0)
                    : Number(q.correctOptionIndex || 0);
              if (!q.questionText || options.length === 0) continue;

              const [qidRows] = await pool.query<RowDataPacket[]>(`SELECT UUID() AS id`);
              const questionId = String(qidRows[0].id);
              await pool.query(
                `
                INSERT INTO course_question_bank
                  (id, courseId, lessonId, teacherId, questionType, questionText, optionsJson, correctOptionIndex, createdAt, updatedAt)
                VALUES
                  (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `,
                [
                  questionId,
                  normalizedCourseId,
                  String(row.id),
                  questionTeacherId,
                  q.questionType,
                  q.questionText,
                  JSON.stringify(options),
                  correctIndex,
                ]
              );
            }
          }
          updated += 1;
        }

      return NextResponse.json({
        success: true,
        mode: 'regenerate_lessons',
        updatedLessons: updated,
      });
    }
    let modules = fallbackOutline(prompt, preferredLanguage);
    let source: 'openai' | 'fallback' = 'fallback';

    if ((phase === 2 || mode === 'details') && Array.isArray(body?.outline)) {
      const providedOutline = normalizeOutlineOnly({ modules: body.outline });
      if (providedOutline && providedOutline.length > 0) {
        modules = outlineOnlyToOutline(providedOutline, preferredLanguage);
      }
    }

if (apiKey && !(Array.isArray(body?.outline) && body.outline.length > 0)) {      const instruction =
        'Return JSON only in this shape: ' +
        '{"modules":[{"title":"","description":"","lessons":[{"title":"","description":"","type":"text|code_example|video_embed","durationMinutes":10,"enableLiveEditor":false,"liveEditorLanguage":"python|javascript|html_css|sql|c","starterCode":"","exampleCode":"","expectedOutput":"","videoUrl":"","resources":[""],"quizQuestions":[{"questionType":"multiple_choice|written|true_false","questionText":"","options":[""],"correctOptionIndex":0,"writtenAnswer":""}]}]}]}. ' +
        `Generate ${constraints.minModules} to ${constraints.maxModules} modules and 4 to 6 lessons per module. ` +
        'Write rich lesson explanations, not short bullet-only text. Each lesson description should be practical and detailed (concept + why + steps + pitfalls). ' +
        'For code lessons, set enableLiveEditor true and provide starterCode plus short expectedOutput string (plain text output, lowercase recommended). starterCode must use real line breaks and indentation, never compressed into one line, and include empty lines between logical steps. ' +
        'When a lesson explanation needs a code example, include exampleCode (5-20 lines, readable, properly formatted) so it can be rendered inside a code box. ' +
        'For javascript live-editor code, do not use require/import/process/fs or express server bootstrap; use browser-safe JavaScript only. ' +
        'Before returning, verify topical consistency: if the course is Express/Node, avoid Python-specific videos/links/examples; if Python course, avoid Node-only examples. ' +
        'Include real docs links in resources and YouTube links in videoUrl when relevant.';

      const aiRes = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          input: [
            { role: 'system', content: instruction },
            {
              role: 'user',
              content: `Create a detailed practical course outline for: ${prompt}. Course title: ${String(courseRows[0].title || '')}`,
            },
          ],
        }),
      });

      if (aiRes.ok) {
        const aiData: unknown = await aiRes.json();
        const parsed = normalizeOutline(extractJsonObject(extractOpenAiText(aiData)));
        if (parsed) {
          modules = parsed;
          source = 'openai';
        }
      }
    }

    // If phase 2 and outline exists, enrich each lesson details sequentially
    // to preserve concept dependency order.
if ((phase === 2 || mode === 'details') && apiKey && Array.isArray(body?.outline)) {
  const priorConcepts: string[] = [];
  const detailedModules: OutlineModule[] = [];

  for (let moduleIndex = 0; moduleIndex < modules.length; moduleIndex += 1) {
    const module = modules[moduleIndex];
    const detailedLessons: OutlineLesson[] = [];

    for (let lessonIndex = 0; lessonIndex < module.lessons.length; lessonIndex += 1) {
      const lesson = module.lessons[lessonIndex];
      const detailed = await generateLessonDetailsFromAi({
        apiKey,
        model,
        topic: prompt,
        courseTitle: String(courseRows[0].title || ''),
        moduleTitle: module.title,
        lessonTitle: lesson.title,
        objective: lesson.description || '',
        preferredLanguage,
        moduleIndex,
        totalModules: modules.length,
        lessonIndex,
        totalLessons: module.lessons.length,
        priorConcepts: [...priorConcepts],
      });
      detailedLessons.push(detailed ?? lesson);
      priorConcepts.push(lesson.title);
    }

    detailedModules.push({ ...module, lessons: detailedLessons });
  }

  const usedQuizKeys = new Set<string>();
  modules = detailedModules.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson) => ({
      ...lesson,
      quizQuestions: Array.isArray(lesson.quizQuestions)
        ? lesson.quizQuestions.filter((q) => {
            const key = q.questionText.toLowerCase().replace(/\s+/g, ' ').trim();
            if (usedQuizKeys.has(key)) return false;
            usedQuizKeys.add(key);
            return true;
          })
        : [],
    })),
  }));

  source = 'openai';
}
// skip enrichModules video/starter override when we already have AI-generated details
const skipEnrich = (phase === 2 || mode === 'details') && Array.isArray(body?.outline);

  modules = skipEnrich ? modules : enrichModules(modules, preferredLanguage);
  modules = enforceTopicRelevance(modules, profile);
  modules = validateAndFixLinks(modules, profile);
  modules = await keepOnlyWorkingYouTubeVideos(modules);
  modules = enforceNoDuplicates(modules);
  modules = modules.map((module) => ({
    ...module,
    lessons: module.lessons.map((lesson, idx) =>
      ensurePracticalLesson(lesson, module.title, idx, preferredLanguage)
    ),
  }));
  modules = strictSanitizeModules(modules, profile);
  if (modules.length === 0) {
      modules = strictSanitizeModules(fallbackOutline(prompt, preferredLanguage), profile);
  }
    modules = enforceModuleCount(modules, constraints, prompt);
    modules = sanitizeModulesForDb(modules);

    await ensureCourseQuizSchema();

    const actor = await getRequestUser(req);
    const teacherIdFromCourse = String(courseRows[0].teacherId || '').trim();
    const actorId = String(actor?.id || '').trim();
    const questionTeacherId = teacherIdFromCourse || actorId;

    const conn = await pool.getConnection();
    let createdModules = 0;
    let createdLessons = 0;
    let createdQuestions = 0;
    try {
      await conn.beginTransaction();

      const [orderRows] = await conn.query<RowDataPacket[]>(
        `SELECT COALESCE(MAX(orderNumber), 0) AS maxOrder FROM module WHERE courseId = ?`,
        [normalizedCourseId]
      );
      let nextModuleOrder = Number(orderRows[0]?.maxOrder || 0) + 1;

      for (const moduleItem of modules) {
        const [moduleIdRows] = await conn.query<RowDataPacket[]>(`SELECT UUID() AS id`);
        const moduleId = String(moduleIdRows[0].id);

        await conn.query(
          `
          INSERT INTO module (id, courseId, title, description, orderNumber, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, NOW(), NOW())
          `,
          [moduleId, normalizedCourseId, moduleItem.title, moduleItem.description || null, nextModuleOrder]
        );
        nextModuleOrder += 1;
        createdModules += 1;

        let lessonOrder = 1;
        for (const lessonItem of moduleItem.lessons) {
          const [lessonIdRows] = await conn.query<RowDataPacket[]>(`SELECT UUID() AS id`);
          const lessonId = String(lessonIdRows[0].id);
          const lessonContent = lessonToContent(lessonItem);

          await conn.query(
            `
            INSERT INTO lesson
              (id, moduleId, title, description, content, codeContent, videoUrl, orderNumber, durationMinutes, isPublished, type, enableLiveEditor, liveEditorLanguage, createdAt, updatedAt)
            VALUES
              (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            `,
            [
              lessonId,
              moduleId,
              lessonItem.title,
              lessonItem.description || null,
              lessonContent,
              null,
              lessonItem.videoUrl || null,
              lessonOrder,
              lessonItem.durationMinutes,
              false,
              lessonItem.type,
              Boolean(lessonItem.enableLiveEditor),
              lessonItem.liveEditorLanguage || 'python',
            ]
          );
          lessonOrder += 1;
          createdLessons += 1;

          if (questionTeacherId && Array.isArray(lessonItem.quizQuestions)) {
            for (const q of lessonItem.quizQuestions.slice(0, 4)) {
              const [qidRows] = await conn.query<RowDataPacket[]>(`SELECT UUID() AS id`);
              const questionId = String(qidRows[0].id);
              const options =
                q.questionType === 'written'
                  ? [String(q.writtenAnswer || q.options?.[0] || '').trim()]
                  : q.questionType === 'true_false'
                  ? ['True', 'False']
                  : (q.options || []).slice(0, 4);
              const correctIndex =
                q.questionType === 'written'
                  ? 0
                  : q.questionType === 'true_false'
                  ? Number(q.correctOptionIndex === 1 ? 1 : 0)
                  : Number(q.correctOptionIndex || 0);

              if (!q.questionText || options.length === 0) continue;

              await conn.query(
  `
  INSERT INTO course_question_bank
    (id, courseId, lessonId, teacherId, questionType, questionText, optionsJson, correctOptionIndex, createdAt, updatedAt)
  VALUES
    (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
  `,
  [
    questionId,
    normalizedCourseId,
    lessonId,                   
    questionTeacherId,
    q.questionType,
    q.questionText,
    JSON.stringify(options),
    correctIndex,
  ]
);
              createdQuestions += 1;
            }
          }
        }
      }

      await conn.commit();
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }

    return NextResponse.json({
      success: true,
      source,
      createdModules,
      createdLessons,
      createdQuestions,
    });
  } catch (error: any) {
    console.error('AI outline generation error:', error);
    return NextResponse.json(
      { message: 'Failed to generate course outline', error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
