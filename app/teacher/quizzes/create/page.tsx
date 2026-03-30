"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, X, Plus, Trash2, AlertCircle } from "lucide-react";

type CourseOption = { id: string; name: string };

type QuestionDraft = {
  questionType: "multiple_choice" | "written";
  text: string;
  options: string[];
  writtenAnswer: string;
  correctAnswer: number | null;
};

type StoredQuestion = {
  id: string;
  questionType?: "multiple_choice" | "written";
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
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [queuedQuestions, setQueuedQuestions] = useState<QuestionDraft[]>([]);
  const [savedQuestions, setSavedQuestions] = useState<StoredQuestion[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currentQuestion, setCurrentQuestion] = useState<QuestionDraft>({
    questionType: "multiple_choice",
    text: "",
    options: ["", "", "", ""],
    writtenAnswer: "",
    correctAnswer: null,
  });

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
        const data = (await res.json()) as TeacherCoursesResponse;
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
    const loadQuestionBank = async () => {
      if (!courseId) {
        setSavedQuestions([]);
        return;
      }

      try {
        setLoadingSaved(true);
        const res = await fetch(`/api/teacher/question-bank?courseId=${encodeURIComponent(courseId)}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as QuestionBankResponse;
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
  }, [courseId]);

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
        options: currentQuestion.options.map((item) => item.trim()).filter(Boolean),
        writtenAnswer: currentQuestion.writtenAnswer.trim(),
        correctAnswer: currentQuestion.correctAnswer,
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
    setSuccess(null);
  };

  const removeQueuedQuestion = (index: number) => {
    setQueuedQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteSavedQuestion = async (questionId: string) => {
    try {
      const res = await fetch(`/api/teacher/question-bank/${encodeURIComponent(questionId)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete question");
      }

      setSavedQuestions((prev) => prev.filter((q) => q.id !== questionId));
      setSuccess("Question deleted from bank");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete question");
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
      setError("Add at least one question before saving");
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
            questionType: question.questionType,
            questionText: question.text,
            options: question.options,
            writtenAnswer: question.writtenAnswer,
            correctOptionIndex: Number(question.correctAnswer),
          }),
        });

        const data = (await res.json()) as { message?: string };
        if (!res.ok) {
          throw new Error(data.message || "Failed to save question");
        }
      }

      const refreshRes = await fetch(
        `/api/teacher/question-bank?courseId=${encodeURIComponent(courseId)}`,
        { cache: "no-store" }
      );
      const refreshData = (await refreshRes.json()) as QuestionBankResponse;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/teacher/quizzes"
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
          <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm dark:border-blue-800 dark:bg-gray-800 space-y-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => {
                setCourseId(e.target.value);
                setSuccess(null);
                setError(null);
              }}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              required
            >
              <option value="">Select a course</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>

            {courseId && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Minimum required for student quiz: 10 questions in this course bank.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm dark:border-blue-800 dark:bg-gray-800 space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Add Question</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Question Format
              </label>
              <select
                value={currentQuestion.questionType}
                onChange={(e) =>
                  setCurrentQuestion((prev) => ({
                    ...prev,
                    questionType: e.target.value === "written" ? "written" : "multiple_choice",
                    correctAnswer: null,
                  }))
                }
                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="written">Written Answer</option>
              </select>
            </div>

            <textarea
              id="question-text"
              value={currentQuestion.text}
              onChange={(e) => setCurrentQuestion((prev) => ({ ...prev, text: e.target.value }))}
              placeholder="Enter question text (press Enter for new line)"
              rows={4}
              className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
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
                        className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Queue Question
            </button>
          </div>

          <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm dark:border-blue-800 dark:bg-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Queued Questions</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{queuedQuestions.length} queued</span>
            </div>

            {queuedQuestions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No queued questions yet.</p>
            ) : (
              queuedQuestions.map((q, idx) => (
                <div key={`${q.text}-${idx}`} className="p-4 rounded-xl border border-blue-100 dark:border-blue-800">
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
                </div>
              ))
            )}
          </div>

          <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm dark:border-blue-800 dark:bg-gray-800 space-y-4">
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
                <div key={q.id} className="p-4 rounded-xl border border-blue-100 dark:border-blue-800">
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
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-medium transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? "Saving..." : "Save Queued Questions"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/teacher/quizzes")}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Back
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
