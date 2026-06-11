"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, X, Plus, Trash2, AlertCircle, Sparkles } from "lucide-react";

type CourseOption = { id: string; name: string };
type ModuleOption = { id: string; title: string };

type QuestionDraft = {
  questionType: "multiple_choice" | "written" | "true_false";
  text: string;
  options: string[];
  writtenAnswer: string;
  correctAnswer: number | null;
};

type StoredQuestion = {
  id: string;
  moduleId?: string | null;
  questionType?: "multiple_choice" | "written" | "true_false";
  questionText: string;
  options: string[];
  correctOptionIndex: number;
};

type TeacherCoursesResponse = {
  courses?: CourseOption[];
  message?: string;
};

type QuestionBankResponse = {
  questions?: StoredQuestion[];
  message?: string;
};

export default function CreateQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [modules, setModules] = useState<ModuleOption[]>([]);
  const [queuedQuestions, setQueuedQuestions] = useState<QuestionDraft[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<StoredQuestion[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiLanguage, setAiLanguage] = useState<"en" | "ar">("en");
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [mcqPct, setMcqPct] = useState<number>(60);
  const [trueFalsePct, setTrueFalsePct] = useState<number>(20);
  const [writtenPct, setWrittenPct] = useState<number>(20);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const shortenLabel = (value: string, max = 42) => {
    const text = String(value || "").trim();
    if (text.length <= max) return text;
    return `${text.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
  };

  const [currentQuestion, setCurrentQuestion] = useState<QuestionDraft>({
    questionType: "multiple_choice",
    text: "",
    options: ["", "", "", ""],
    writtenAnswer: "",
    correctAnswer: null,
  });

  const readJsonResponse = async (res: Response) => {
    const raw = await res.text();
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      if (!res.ok) {
        throw new Error(`Request failed (${res.status}). The server returned a non-JSON response.`);
      }
      throw new Error("Server returned an invalid response format.");
    }
  };

  useEffect(() => {
    const initialCourseId = searchParams.get("courseId") || "";
    if (initialCourseId) {
      setCourseId(initialCourseId);
    }
  }, [searchParams]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/teacher/courses", { cache: "no-store" });
        const data = (await readJsonResponse(res)) as TeacherCoursesResponse;
        if (!res.ok) {
          throw new Error(data.message || "Failed to load courses");
        }
        const mapped = (data.courses || []).map((course) => ({
          id: course.id,
          name: course.name,
        }));
        setCourses(mapped);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load courses");
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    const loadCourseLessons = async () => {
      if (!courseId) {
        setModules([]);
        setModuleId("");
        return;
      }
      try {
        const res = await fetch(`/api/courses/${encodeURIComponent(courseId)}/content`, { cache: "no-store" });
        const data = await readJsonResponse(res);
        if (!res.ok) {
          throw new Error(data.message || "Failed to load course chapters");
        }
        const modulesFromApi: Array<{ id?: string; title?: string }> = Array.isArray(data.modules)
          ? data.modules
          : [];
        const mapped: ModuleOption[] = modulesFromApi.map((moduleItem) => ({
          id: String(moduleItem.id || ''),
          title: String(moduleItem.title || 'Untitled chapter'),
        }));
        setModules(mapped.filter((item) => item.id));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load course chapters");
      }
    };

    loadCourseLessons();
  }, [courseId]);

  useEffect(() => {
    const loadQuestionBank = async () => {
      if (!courseId) {
        setSavedQuestions([]);
        return;
      }

      try {
        setLoadingSaved(true);
        const query = new URLSearchParams({ courseId });
        if (moduleId) query.set("moduleId", moduleId);
        const res = await fetch(`/api/teacher/question-bank?${query.toString()}`, {
          cache: "no-store",
        });
        const data = (await readJsonResponse(res)) as QuestionBankResponse;
        if (!res.ok) {
          throw new Error(data.message || "Failed to load question bank");
        }

        setSavedQuestions(data.questions || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load question bank");
      } finally {
        setLoadingSaved(false);
      }
    };

    loadQuestionBank();
  }, [courseId, moduleId]);

  const addQuestion = () => {
    const text = currentQuestion.text.trim();
    if (!text) {
      setError("Question text is required");
      return;
    }

    if (currentQuestion.questionType === "written") {
      if (!currentQuestion.writtenAnswer.trim()) {
        setError("Please provide the written true answer");
        return;
      }
    } else if (currentQuestion.questionType === "true_false") {
      if (currentQuestion.correctAnswer !== 0 && currentQuestion.correctAnswer !== 1) {
        setError("Please select True or False as the correct answer");
        return;
      }
    } else {
      const options = currentQuestion.options.map((item) => item.trim()).filter(Boolean);
      if (options.length < 2) {
        setError("Please provide at least 2 options");
        return;
      }
      if (
        currentQuestion.correctAnswer === null ||
        currentQuestion.correctAnswer < 0 ||
        currentQuestion.correctAnswer >= options.length
      ) {
        setError("Please select a valid correct answer");
        return;
      }
    }

    setQueuedQuestions((prev) => [
      ...prev,
      {
        questionType: currentQuestion.questionType,
        text,
        options:
          currentQuestion.questionType === "true_false"
            ? ["True", "False"]
            : currentQuestion.options.map((item) => item.trim()).filter(Boolean),
        writtenAnswer:
          currentQuestion.questionType === "written" ? currentQuestion.writtenAnswer.trim() : "",
        correctAnswer:
          currentQuestion.questionType === "written"
            ? 0
            : currentQuestion.questionType === "true_false"
              ? currentQuestion.correctAnswer === 1
                ? 1
                : 0
              : currentQuestion.correctAnswer,
      },
    ]);

    setCurrentQuestion({
      questionType: "multiple_choice",
      text: "",
      options: ["", "", "", ""],
      writtenAnswer: "",
      correctAnswer: null,
    });
    setError(null);
    setSuccess("Question added to local queue only. Click Save to Question Bank to persist it.");
  };

  const removeQueuedQuestion = (index: number) => {
    setQueuedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSingleQueuedQuestion = async (index: number) => {
    setError(null);
    setSuccess(null);

    if (!courseId) {
      setError("Please select a course");
      return;
    }

    const question = queuedQuestions[index];
    if (!question) return;

    try {
      setSaving(true);
      const res = await fetch("/api/teacher/question-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          moduleId: moduleId || null,
          questionType: question.questionType,
          questionText: question.text,
          options: question.options,
          writtenAnswer: question.writtenAnswer,
          correctOptionIndex: Number(question.correctAnswer),
        }),
      });

      const data = (await readJsonResponse(res)) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || "Failed to save question");
      }

      setQueuedQuestions((prev) => prev.filter((_, i) => i !== index));

      const refreshQuery = new URLSearchParams({ courseId });
      if (moduleId) refreshQuery.set("moduleId", moduleId);
      const refreshRes = await fetch(`/api/teacher/question-bank?${refreshQuery.toString()}`, { cache: "no-store" });
      const refreshData = (await readJsonResponse(refreshRes)) as QuestionBankResponse;
      if (refreshRes.ok) {
        setSavedQuestions(refreshData.questions || []);
      }

      setSuccess("Question saved to question bank");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const deleteSavedQuestion = async (questionId: string) => {
    try {
      const res = await fetch(`/api/teacher/question-bank/${encodeURIComponent(questionId)}`, {
        method: "DELETE",
      });
      const data = (await readJsonResponse(res)) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete question");
      }

      setSavedQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setSuccess("Question deleted from bank");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete question");
    }
  };

  const generateWithAi = async () => {
    setError(null);
    setSuccess(null);

    if (!courseId) {
      setError("Please select a course first");
      return;
    }

    try {
      setGeneratingAi(true);
      const res = await fetch("/api/teacher/question-bank/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          moduleId: moduleId || null,
          count: aiCount,
          language: aiLanguage,
          difficulty: aiDifficulty,
          distribution: {
            mcqPct,
            trueFalsePct,
            writtenPct,
          },
        }),
      });
      const data = (await readJsonResponse(res)) as {
        message?: string;
        questions?: Array<{
          questionType: "multiple_choice" | "written" | "true_false";
          questionText: string;
          options: string[];
          writtenAnswer?: string;
          correctOptionIndex: number;
        }>;
      };
      if (!res.ok) {
        throw new Error(data.message || "Failed to generate AI questions");
      }

      const generated = (data.questions || []).map((q) => ({
        questionType: q.questionType,
        text: q.questionText,
        options: Array.isArray(q.options) ? q.options : [],
        writtenAnswer:
          q.questionType === "written" ? (q.writtenAnswer || q.options?.[0] || "") : "",
        correctAnswer:
          q.questionType === "written"
            ? 0
            : q.questionType === "true_false"
              ? q.correctOptionIndex === 1
                ? 1
                : 0
              : Number(q.correctOptionIndex),
      })) as QuestionDraft[];

      if (generated.length === 0) {
        throw new Error("AI returned no valid questions");
      }

      setQueuedQuestions((prev) => [...prev, ...generated]);
      setSuccess(`${generated.length} AI question${generated.length > 1 ? "s" : ""} added to queue`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate AI questions");
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!courseId) {
      setError("Please select a course");
      return;
    }

    if (queuedQuestions.length === 0) {
      setError(null);
      setSuccess("No queued questions to save. The questions listed in Saved Question Bank are already saved.");
      return;
    }

    try {
      setSaving(true);
      for (const question of queuedQuestions) {
        const res = await fetch("/api/teacher/question-bank", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseId,
            moduleId: moduleId || null,
            questionType: question.questionType,
            questionText: question.text,
            options: question.options,
            writtenAnswer: question.writtenAnswer,
            correctOptionIndex: Number(question.correctAnswer),
          }),
        });

        const data = (await readJsonResponse(res)) as { message?: string };
        if (!res.ok) {
          throw new Error(data.message || "Failed to save question");
        }
      }

      const refreshQuery = new URLSearchParams({ courseId });
      if (moduleId) refreshQuery.set("moduleId", moduleId);
      const refreshRes = await fetch(`/api/teacher/question-bank?${refreshQuery.toString()}`, { cache: "no-store" });
      const refreshData = (await readJsonResponse(refreshRes)) as QuestionBankResponse;
      if (refreshRes.ok) {
        setSavedQuestions(refreshData.questions || []);
      }

      const count = queuedQuestions.length;
      setQueuedQuestions([]);
      setSuccess(`${count} question${count > 1 ? "s" : ""} saved to question bank`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save questions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/teacher/courses"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Question Bank</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Select a course, add questions, and save them for randomized student quizzes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setModuleId("");
                setSuccess(null);
                setError(null);
              }}
              className="w-full max-w-full p-2.5 sm:p-3 pr-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-sm sm:text-base text-gray-900 dark:text-white"
              required
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {shortenLabel(course.name, 52)}
                </option>
              ))}
            </select>

            {courseId && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quiz Scope
                </label>
                <select
                  value={moduleId}
                  onChange={(e) => setModuleId(e.target.value)}
                  className="w-full max-w-full p-2.5 sm:p-3 pr-9 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-sm sm:text-base text-gray-900 dark:text-white"
                >
                  <option value="">Final course quiz (all chapters)</option>
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {shortenLabel(module.title, 42)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {moduleId
                    ? "Chapter quiz: student needs at least 5 questions in this chapter."
                    : "Final course quiz: student needs at least 10 questions in the course bank."}
                </p>
              </div>
            )}
          </div>

          <div className="admin-surface relative overflow-hidden bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Add Question</h2>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Generate Questions with AI</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    AI will create questions from this course modules and lesson content.
                  </p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-[42%] sm:w-auto p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
                  >
                    <option value={3}>3 questions</option>
                    <option value={5}>5 questions</option>
                    <option value={8}>8 questions</option>
                    <option value={10}>10 questions</option>
                  </select>
                  <button
                    type="button"
                    onClick={generateWithAi}
                    disabled={!courseId || generatingAi}
                    className="inline-flex flex-1 sm:flex-none justify-center items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition"
                  >
                    <Sparkles className="w-4 h-4" />
                    {generatingAi ? "Generating..." : "Generate with AI"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Generation Language
                  </label>
                  <select
                    value={aiLanguage}
                    onChange={(e) => setAiLanguage(e.target.value === "ar" ? "ar" : "en")}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="en">English</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) =>
                      setAiDifficulty(
                        e.target.value === "easy" || e.target.value === "hard" ? e.target.value : "medium"
                      )
                    }
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 flex items-end">
                  Question-type mix (MCQ / T-F / Written)
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    MCQ %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={mcqPct}
                    onChange={(e) => setMcqPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    True/False %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={trueFalsePct}
                    onChange={(e) => setTrueFalsePct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Written %
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={writtenPct}
                    onChange={(e) => setWrittenPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Format
              </label>
              <select
                value={currentQuestion.questionType}
                onChange={(e) => {
                  const selectedType =
                    e.target.value === "written"
                      ? "written"
                      : e.target.value === "true_false"
                        ? "true_false"
                        : "multiple_choice";
                  setCurrentQuestion((prev) => ({
                    ...prev,
                    questionType: selectedType,
                    options: selectedType === "true_false" ? ["True", "False"] : ["", "", "", ""],
                    correctAnswer: selectedType === "true_false" ? 0 : null,
                  }));
                }}
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-gray-900 dark:text-white"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True / False</option>
                <option value="written">Written Answer</option>
              </select>
            </div>

            <textarea
              id="question-text"
              value={currentQuestion.text}
              onChange={(e) => setCurrentQuestion((prev) => ({ ...prev, text: e.target.value }))}
              placeholder="Enter question text (press Enter for new line)"
              rows={4}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-gray-900 dark:text-white"
            />

            {currentQuestion.questionType === "written" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  True Answer (Written) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={currentQuestion.writtenAnswer}
                  onChange={(e) =>
                    setCurrentQuestion((prev) => ({ ...prev, writtenAnswer: e.target.value }))
                  }
                  placeholder="Type the exact written answer"
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-gray-900 dark:text-white"
                />
              </div>
            ) : currentQuestion.questionType === "true_false" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Correct Answer (True / False) <span className="text-red-500">*</span>
                </label>
                <select
                  value={currentQuestion.correctAnswer === null ? "" : String(currentQuestion.correctAnswer)}
                  onChange={(e) =>
                    setCurrentQuestion((prev) => ({
                      ...prev,
                      correctAnswer: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="portal-surface w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="">Select True or False</option>
                  <option value="0">True</option>
                  <option value="1">False</option>
                </select>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const nextOptions = [...currentQuestion.options];
                          nextOptions[idx] = e.target.value;
                          setCurrentQuestion((prev) => ({ ...prev, options: nextOptions }));
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-gray-900 dark:text-white"
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Correct Answer (True Answer) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={currentQuestion.correctAnswer === null ? "" : String(currentQuestion.correctAnswer)}
                    onChange={(e) =>
                      setCurrentQuestion((prev) => ({
                        ...prev,
                        correctAnswer: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900/60 text-gray-900 dark:text-white"
                  >
                    <option value="">Select the correct answer</option>
                    {currentQuestion.options.map((option, idx) => (
                      <option key={idx} value={idx} disabled={!option.trim()}>
                        Option {idx + 1}: {option.trim() || "(empty)"}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

              <button
              type="button"
              onClick={addQuestion}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm rounded-lg transition flex items-center gap-1.5 sm:gap-2"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Queue Question (Not Saved)
            </button>
          </div>

          <div className="admin-surface bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Ai Queued Questions</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{queuedQuestions.length} queued</span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Queued questions are local only. They are not saved to DB until you click "Save to Question Bank" or
              "Save All Queued Questions".
            </p>

            {queuedQuestions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No queued questions yet.</p>
            ) : (
              queuedQuestions.map((q, idx) => (
                <div key={`${q.text}-${idx}`} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white whitespace-pre-wrap">{q.text}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Correct answer: {q.questionType === "written"
                          ? q.writtenAnswer || "N/A"
                          : q.correctAnswer !== null
                            ? q.options[q.correctAnswer] || "N/A"
                            : "N/A"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeQueuedQuestion(idx)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => saveSingleQueuedQuestion(idx)}
                      disabled={saving || !courseId}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      <Save className="w-4 h-4" />
                      Save to Question Bank
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="admin-surface bg-white/85 dark:bg-slate-900/75 backdrop-blur rounded-2xl shadow-md border border-slate-200 dark:border-slate-800 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Saved Question Bank</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{savedQuestions.length} saved</span>
            </div>

            {loadingSaved ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Loading saved questions...</p>
            ) : savedQuestions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No saved questions for this course yet.</p>
            ) : (
              savedQuestions.map((q) => (
                <div key={q.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white whitespace-pre-wrap">{q.questionText}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Correct answer: {q.questionType === "written"
                          ? q.options[0] || "N/A"
                          : q.options[q.correctOptionIndex] || "N/A"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSavedQuestion(q.id)}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
              {success}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || queuedQuestions.length === 0}
              className="flex-1 py-2 sm:py-3 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4 sm:w-5 sm:h-5" />
              {saving ? "Saving..." : "Save All Queued Questions"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/teacher/courses")}
              className="flex-1 py-2 sm:py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium transition flex items-center justify-center gap-1.5 sm:gap-2"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
