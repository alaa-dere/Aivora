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
  type: 'text' | 'code_example' | 'video_embed';
  durationMinutes: number;
  enableLiveEditor?: boolean;
  liveEditorLanguage?: 'python' | 'javascript' | 'html_css';
  starterCode?: string;
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

function sanitizeLessonForDb(lesson: OutlineLesson): OutlineLesson {
  return {
    ...lesson,
    title: clampText(lesson.title, DB_TITLE_MAX),
    description: clampText(lesson.description || '', DB_DESC_MAX),
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

function detectCodeLanguage(code: string): 'python' | 'javascript' | null {
  const src = String(code || '').trim();
  if (!src) return null;
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
  if (jsScore === pyScore) return null;
  return jsScore > pyScore ? 'javascript' : 'python';
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

function normalizeVideoForTopic(url: string | undefined, topicText: string): string | undefined {
  if (!url) return undefined;
  const lower = url.toLowerCase();
  const topic = topicText.toLowerCase();
  const isNodeTopic = /express|node|api|backend|javascript|js/.test(topic);
  const isPythonTopic = /python|flask|django/.test(topic);
  const hasPythonHint = /python|pyodide|django|flask/.test(lower);
  const hasNodeHint = /node|express|rest-api|javascript|js/.test(lower);

  if (isNodeTopic && hasPythonHint && !hasNodeHint) return undefined;
  if (isPythonTopic && hasNodeHint && !hasPythonHint) return undefined;
  return url;
}

function defaultVideoForTopic(topicText: string): string {
  const topic = topicText.toLowerCase();
  if (/express|node|api|backend|javascript|js/.test(topic)) {
    return 'https://www.youtube.com/watch?v=l8WPWK9mS5M';
  }
  if (/python|flask|django/.test(topic)) {
    return 'https://www.youtube.com/watch?v=rfscVS0vtbw';
  }
  return 'https://www.youtube.com/watch?v=PkZNo7MFNFg';
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
  chunks.push(`Lesson: ${lesson.title}`);
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

  if (lesson.enableLiveEditor && lesson.starterCode) {
    chunks.push('Live Coding Task:');
    chunks.push('Run the starter code, then complete the TODOs.');
    chunks.push(`{{starter:\n${lesson.starterCode}\n}}`);
    if (lesson.expectedOutput) {
      chunks.push(`{{answer: ${lesson.expectedOutput}}}`);
    }
  }

  return dedupeTextBlocks(chunks.join('\n\n'));
}

function fallbackOutline(prompt: string): OutlineModule[] {
  const idea = conciseTopicFromPrompt(prompt);
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
          liveEditorLanguage: 'javascript',
          starterCode: 'const users = [{ id: 1, name: "Ali" }, { id: 2, name: "Lina" }];\nconst result = users.map((u) => u.name.toLowerCase()).join(",");\nconsole.log(result);',
          expectedOutput: 'ali,lina',
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
      const detected = detectCodeLanguage(starterCode || '');
      const langRaw = String(lessonObj.liveEditorLanguage || '').trim();
      const liveLang: 'python' | 'javascript' | 'html_css' =
        langRaw === 'javascript' || langRaw === 'html_css' ? langRaw : detected || 'python';

      lessons.push({
        title: lessonTitle,
        description: String(lessonObj.description || '').trim(),
        type,
        durationMinutes: Number.isFinite(duration) ? duration : 10,
        enableLiveEditor: Boolean(lessonObj.enableLiveEditor),
        liveEditorLanguage: liveLang,
        starterCode: liveLang === 'javascript' && starterCode ? sanitizeJsStarterCode(starterCode) : starterCode,
        expectedOutput: String(lessonObj.expectedOutput || '').trim() || undefined,
        videoUrl: String(lessonObj.videoUrl || '').trim() || undefined,
        resources,
        quizQuestions,
      });
    }

    if (lessons.length === 0) continue;
    modules.push({ title, description, lessons });
  }

  return modules.length > 0 ? modules.slice(0, 8) : null;
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

  return modules.length > 0 ? modules.slice(0, 8) : null;
}

function outlineOnlyToOutline(modules: OutlineOnlyModule[]): OutlineModule[] {
  return modules.map((m) => ({
    title: m.title,
    description: m.description,
    lessons: m.lessons.map((l, idx) => ({
      title: l.title,
      description: l.objective,
      type: idx % 3 === 1 ? 'code_example' : 'text',
      durationMinutes: 15,
      enableLiveEditor: false,
      liveEditorLanguage: 'javascript',
      resources: [],
      quizQuestions: [],
    })),
  }));
}

function ensurePracticalLesson(lesson: OutlineLesson, moduleTitle: string, lessonIndex: number): OutlineLesson {
  const lowerTitle = `${moduleTitle} ${lesson.title}`.toLowerCase();
  const jsPreferred = /node|javascript|js|backend|api|express|next/.test(lowerTitle);
  const inferredFromStarter = detectCodeLanguage(String(lesson.starterCode || ''));
  const language: 'python' | 'javascript' | 'html_css' =
    inferredFromStarter || (jsPreferred ? 'javascript' : 'python');

  const starterCode =
    language === 'javascript'
      ? 'const users = [{ id: 1, name: "Ali" }, { id: 2, name: "Lina" }];\n// TODO: print names in lowercase as comma-separated values\nconst result = users.map((u) => u.name.toLowerCase()).join(",");\nconsole.log(result);'
      : 'print("Hello, Backend World!")\n# TODO: print your Python version';
  const expectedOutput = language === 'javascript' ? 'ali,lina' : 'hello, backend world!';

  const resources = (lesson.resources || []).filter(Boolean);
  if (resources.length === 0) {
    resources.push(
      jsPreferred ? 'https://expressjs.com/' : 'https://docs.python.org/3/',
      'https://developer.mozilla.org/en-US/docs/Learn'
    );
  }

  const quizQuestions = Array.isArray(lesson.quizQuestions) ? lesson.quizQuestions.slice(0, 4) : [];

  const withVideoUrl =
    normalizeVideoForTopic(lesson.videoUrl, lowerTitle) || defaultVideoForTopic(lowerTitle);
function enforceQuizMatchesOutput(lesson: OutlineLesson): OutlineLesson {
  if (!lesson.enableLiveEditor || !lesson.expectedOutput) return lesson;
  const expected = lesson.expectedOutput.trim().toLowerCase();
  if (!Array.isArray(lesson.quizQuestions) || lesson.quizQuestions.length === 0) {
    return {
      ...lesson,
      quizQuestions: [
        {
          questionType: 'multiple_choice',
          questionText: 'What will the console print when you run this code?',
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
      return { ...q, options: opts, correctOptionIndex: q.correctOptionIndex ?? 0 };
    }),
  };
}
  return {
    ...lesson,
    type: lesson.type === 'video_embed' && lessonIndex % 2 === 0 ? 'code_example' : lesson.type,
    enableLiveEditor: true,
    liveEditorLanguage:
      lesson.liveEditorLanguage === 'html_css'
        ? 'html_css'
        : inferredFromStarter || lesson.liveEditorLanguage || language,
    starterCode: lesson.starterCode
      ? ((inferredFromStarter || lesson.liveEditorLanguage) === 'javascript'
          ? sanitizeJsStarterCode(lesson.starterCode)
          : lesson.starterCode)
      : starterCode,
    expectedOutput: lesson.expectedOutput || expectedOutput,
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

function enrichModules(modules: OutlineModule[]): OutlineModule[] {
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
  ensureDetailedExplanation(ensurePracticalLesson(lesson, module.title, lessonIndex))
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
  const fixed: OutlineModule[] = [];
  for (const module of modules) {
    const lessons: OutlineLesson[] = [];
    for (const lesson of module.lessons) {
      const resources = (lesson.resources || []).filter((u) => /^https?:\/\//i.test(u));
      const approved: string[] = [];
      for (const link of resources.slice(0, 6)) {
        const lower = link.toLowerCase();
        const blocked = profile.blockedKeywords.some((k) => lower.includes(k));
        if (blocked) continue;
        if (isUrlFormatValid(link)) approved.push(link);
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
          const variant = lang === 'javascript' ? jsStarterVariant(counter) : pyStarterVariant(counter);
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

  return cleaned.slice(0, 8);
}

async function generateOutlineOnlyFromAi(input: {
  apiKey: string;
  model: string;
  prompt: string;
  courseTitle: string;
}): Promise<OutlineOnlyModule[] | null> {
 const instruction =
  'Return JSON only: {"modules":[{"title":"","description":"","lessons":[{"title":"","objective":""}]}]}. ' +
  '4-5 modules, 4-5 lessons each. ' +
  'Each lesson title must be specific and action-oriented (e.g. "Handle POST requests with body-parser"). ' +
  'Objective = one sentence: what the student will be able to DO after this lesson. ' +
  'No duplicate lesson titles. Lessons must progress logically from basics to advanced. ' +
  'Topic-specific only — no generic programming lessons.';

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
          content: `Create OUTLINE ONLY for: ${input.prompt}. Course title: ${input.courseTitle}`,
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
}): Promise<OutlineLesson | null> {
 const instruction =
  'Return JSON only: {"title":"","description":"","type":"text|code_example|video_embed","durationMinutes":10,"enableLiveEditor":false,"liveEditorLanguage":"javascript","starterCode":"","expectedOutput":"","videoUrl":"","resources":[""],"quizQuestions":[{"questionType":"multiple_choice","questionText":"","options":[""],"correctOptionIndex":0}]}. ' +
  'Rules: ' +
  '1. description = 60-80 words MAX. Cover: what+why+pitfall. No filler. ' +
  '2. enableLiveEditor=true only for code_example type. starterCode must be browser-safe JS (no require/import/process/express()). expectedOutput = exact console.log output, lowercase, no punctuation. ' +
'3. quizQuestions: exactly 1 question PER lesson if neededthat has enableLiveEditor=true. The question MUST be about the starter code output — ask "What will the console print when you run this code?" or "What is the expected output?". The correct answer (correctOptionIndex) must exactly match the expectedOutput value. Wrong options must be plausible but clearly incorrect variations. If enableLiveEditor=false, quizQuestions=[].' + 
 '4. videoUrl: one relevant YouTube link. resources: 2-3 real working links (MDN/Express docs/Node docs only). ' +
  '5. Choose type based on lesson content. If the lesson is about a specific practical task (e.g. handling POST requests), prefer code_example. If it’s about understanding concepts, prefer text. video_embed if it’s best explained visually (e.g. event loop). ' +
  '6. durationMinutes: 10-20 mins. Longer for code_example, shorter for text. ' +
  '7. Ensure all content is highly relevant to the topic and course title. No generic programming lessons. ' +
  '8. No duplicate lesson titles within the same module.';

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
            `Course: ${input.courseTitle}\nTopic: ${input.topic}\nModule: ${input.moduleTitle}\n` +
            `Lesson: ${input.lessonTitle}\nObjective: ${input.objective}\n` +
            'Generate full lesson details.',
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const data: unknown = await res.json();
  const parsed = extractJsonObject(extractOpenAiText(data)) as Record<string, unknown> | null;
  if (!parsed) return null;

  const title = clampText(String(parsed.title || input.lessonTitle), DB_TITLE_MAX);
  const description = clampText(String(parsed.description || input.objective), DB_DESC_MAX);
  const typeRaw = String(parsed.type || 'text');
  const type: OutlineLesson['type'] = typeRaw === 'code_example' || typeRaw === 'video_embed' ? typeRaw : 'text';
  const durationMinutes = Math.max(5, Number(parsed.durationMinutes || 15));
  const langRaw = String(parsed.liveEditorLanguage || 'javascript');
  const liveEditorLanguage: 'python' | 'javascript' | 'html_css' =
    langRaw === 'python' || langRaw === 'html_css' ? langRaw : 'javascript';
  const starterCodeRaw = String(parsed.starterCode || '').trim();
  const detected = detectCodeLanguage(starterCodeRaw);
  const finalLang = detected || liveEditorLanguage;
  const starterCode = finalLang === 'javascript' ? sanitizeJsStarterCode(starterCodeRaw) : starterCodeRaw;
  const resources = Array.isArray(parsed.resources)
    ? parsed.resources.map((x) => String(x || '').trim()).filter(Boolean).slice(0, 4)
    : [];

  return {
    title,
    description,
    type,
    durationMinutes,
    enableLiveEditor: Boolean(parsed.enableLiveEditor) && (type === 'code_example' || Boolean(starterCode)),
    liveEditorLanguage: finalLang,
    starterCode: starterCode || undefined,
    expectedOutput: String(parsed.expectedOutput || '').trim() || undefined,
    videoUrl: String(parsed.videoUrl || '').trim() || undefined,
    resources,
    quizQuestions: [],
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
    const profile = buildTopicProfile(`${prompt} ${String(courseRows[0].title || '')}`);
    const apiKey = process.env.OPENAI_API_KEY;
    const model = (process.env.OPENAI_MODEL || 'gpt-5-mini').trim();

    if ((phase === 1 || mode === 'outline_only') && apiKey) {
      const outline = await generateOutlineOnlyFromAi({
        apiKey,
        model,
        prompt,
        courseTitle: String(courseRows[0].title || ''),
      });
      if (outline && outline.length > 0) {
        return NextResponse.json({
          success: true,
          phase: 1,
          source: 'openai',
          outline,
          message: 'Outline generated. Proceed to phase 2 to generate lesson details.',
        });
      }
      return NextResponse.json({
        success: true,
        phase: 1,
        source: 'fallback',
        outline: fallbackOutline(prompt).map((m) => ({
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
        });
        if (!details) continue;
        let prepared = ensureDetailedExplanation(details);
        prepared = ensurePracticalLesson(prepared, String(row.moduleTitle || ''), 0);
        prepared = stripLiveCompilerLikeQuestions(prepared);
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
        updated += 1;
      }

      return NextResponse.json({
        success: true,
        mode: 'regenerate_lessons',
        updatedLessons: updated,
      });
    }
    let modules = fallbackOutline(prompt);
    let source: 'openai' | 'fallback' = 'fallback';

    if ((phase === 2 || mode === 'details') && Array.isArray(body?.outline)) {
      const providedOutline = normalizeOutlineOnly({ modules: body.outline });
      if (providedOutline && providedOutline.length > 0) {
        modules = outlineOnlyToOutline(providedOutline);
      }
    }

if (apiKey && !(Array.isArray(body?.outline) && body.outline.length > 0)) {      const instruction =
        'Return JSON only in this shape: ' +
        '{"modules":[{"title":"","description":"","lessons":[{"title":"","description":"","type":"text|code_example|video_embed","durationMinutes":10,"enableLiveEditor":false,"liveEditorLanguage":"python|javascript|html_css","starterCode":"","expectedOutput":"","videoUrl":"","resources":[""],"quizQuestions":[{"questionType":"multiple_choice|written|true_false","questionText":"","options":[""],"correctOptionIndex":0,"writtenAnswer":""}]}]}]}. ' +
        'Generate 3 to 5 modules and 4 to 6 lessons per module. ' +
        'Write rich lesson explanations, not short bullet-only text. Each lesson description should be practical and detailed (concept + why + steps + pitfalls). ' +
        'For code lessons, set enableLiveEditor true and provide starterCode plus short expectedOutput string (plain text output, lowercase recommended). ' +
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

    // If phase 2 and outline exists, enrich each lesson details individually for better quality.
    // Phase 2: generate all lesson details in PARALLEL for speed
if ((phase === 2 || mode === 'details') && apiKey && Array.isArray(body?.outline)) {
  const detailedModules: OutlineModule[] = await Promise.all(
    modules.map(async (module) => {
      const detailedLessons = await Promise.all(
        module.lessons.map(async (lesson) => {
          const detailed = await generateLessonDetailsFromAi({
            apiKey,
            model,
            topic: prompt,
            courseTitle: String(courseRows[0].title || ''),
            moduleTitle: module.title,
            lessonTitle: lesson.title,
            objective: lesson.description || '',
          });
          return detailed ?? lesson;
        })
      );
      return { ...module, lessons: detailedLessons };
    })
  );

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

modules = skipEnrich ? modules : enrichModules(modules);    modules = enforceTopicRelevance(modules, profile);
    modules = validateAndFixLinks(modules, profile);
    modules = enforceNoDuplicates(modules);
    modules = strictSanitizeModules(modules, profile);
    if (modules.length === 0) {
      modules = strictSanitizeModules(fallbackOutline(prompt), profile);
    }
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
                  (id, courseId, teacherId, questionType, questionText, optionsJson, correctOptionIndex, createdAt, updatedAt)
                VALUES
                  (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `,
                [
                  questionId,
                  normalizedCourseId,
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
