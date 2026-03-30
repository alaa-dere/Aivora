"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, Save, X, Plus, Trash2, BrainCircuit,
  Clock, Users, Award, FileText, HelpCircle, CheckCircle, XCircle, AlertCircle
} from "lucide-react";

export default function CreateQuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    title: "",
    courseId: "",
    moduleId: "",
    description: "",
    type: "quiz",
    timeLimit: 30,
    attemptsAllowed: 1,
    dueDate: "",
    status: "draft",
    questions: [] as any[]
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    type: "multiple-choice", // multiple-choice, true-false, short-answer
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 1
  });

  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);
  const [modules, setModules] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await fetch("/api/teacher/courses", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) return;
        const list = (data.courses || []).map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        setCourses(list);
      } catch (error) {
        console.error("Failed to load courses", error);
      }
    };

    loadCourses();
  }, []);

  useEffect(() => {
    const courseId = searchParams.get("courseId") || "";
    const moduleId = searchParams.get("moduleId") || "";
    if (courseId) {
      setFormData((prev) => ({ ...prev, courseId }));
    }
    if (moduleId) {
      setFormData((prev) => ({ ...prev, moduleId }));
    }
  }, [searchParams]);

  useEffect(() => {
    const loadModules = async () => {
      if (!formData.courseId) {
        setModules([]);
        return;
      }
      try {
        const res = await fetch(`/api/courses/${formData.courseId}/content`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) return;
        const list = (data.modules || []).map((m: any) => ({
          id: m.id,
          title: m.title,
        }));
        setModules(list);
      } catch (error) {
        console.error("Failed to load modules", error);
      }
    };

    loadModules();
  }, [formData.courseId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Quiz data:", formData);
    router.push("/teacher/quizzes");
  };

  const addQuestion = () => {
    if (currentQuestion.text.trim()) {
      setFormData({
        ...formData,
        questions: [...formData.questions, currentQuestion]
      });
      setCurrentQuestion({
        text: "",
        type: "multiple-choice",
        options: ["", "", "", ""],
        correctAnswer: 0,
        points: 1
      });
    }
  };

  const removeQuestion = (index: number) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6 transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        {/* Header مع زر الرجوع */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            href="/teacher/quizzes"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Create New Quiz
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Fill in the details below to create a new quiz.
            </p>
          </div>
        </div>

        {/* Quick Actions (same style as course content) */}
        <div className="rounded-xl border border-blue-900 bg-blue-950 p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950 mb-6">
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
          <p className="text-sm text-blue-200 mt-1">Shortcuts to build quizzes faster.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              {
                icon: Plus,
                title: "Create Quiz",
                desc: "Start a new quiz",
                onClick: () => {},
              },
              {
                icon: BrainCircuit,
                title: "AI Generator",
                desc: "Generate questions",
                onClick: () => router.push("/teacher/quizzes/create?ai=1"),
              },
              {
                icon: FileText,
                title: "Question Bank",
                desc: "Build & reuse",
                onClick: () => router.push("/teacher/quizzes/create?bank=1"),
              },
              {
                icon: Award,
                title: "Results",
                desc: "View performance",
                onClick: () => router.push("/teacher/quizzes"),
              },
            ].map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className="
                  flex flex-col items-center text-center p-3
                  bg-white/5
                  rounded-lg border border-blue-800/70 dark:border-gray-700
                  hover:bg-white/10 dark:hover:bg-gray-800
                  hover:border-blue-700/80 dark:hover:border-gray-600
                  transition-all duration-200
                "
              >
                <div className="p-2 bg-blue-900/60 dark:bg-gray-800 rounded-md mb-2">
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-medium text-white text-xs">{action.title}</p>
                <p className="text-[11px] text-blue-100/80 mt-1">{action.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* فورم إنشاء الكويز */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm dark:border-blue-800 dark:bg-gray-800 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Basic Information
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quiz Title */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quiz Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Python OOP Midterm"
                    required
                  />
                </div>

                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.courseId}
                    onChange={(e) =>
                      setFormData({ ...formData, courseId: e.target.value, moduleId: "" })
                    }
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Module Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Module <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.moduleId}
                    onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                    disabled={!formData.courseId}
                  >
                    <option value="">Select a module</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quiz Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quiz Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="quiz">Regular Quiz</option>
                    <option value="midterm">Midterm Exam</option>
                    <option value="final">Final Exam</option>
                    <option value="practice">Practice Test</option>
                  </select>
                </div>

                {/* Time Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    min="1"
                  />
                </div>

                {/* Attempts Allowed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attempts Allowed
                  </label>
                  <input
                    type="number"
                    value={formData.attemptsAllowed}
                    onChange={(e) => setFormData({...formData, attemptsAllowed: parseInt(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    min="1"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>

                {/* Description */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                    placeholder="Brief description of the quiz"
                  />
                </div>
              </div>
            </div>

            {/* Questions Section */}
            <div className="rounded-xl border border-blue-200 bg-white p-5 shadow-sm dark:border-blue-800 dark:bg-gray-800 space-y-6">
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Questions
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.questions.length} questions added
                </span>
              </div>

              {/* Add Question Form */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-4">
                <h3 className="font-medium text-gray-700 dark:text-gray-300">Add New Question</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {/* Question Text */}
                  <div className="lg:col-span-2">
                    <input
                      type="text"
                      value={currentQuestion.text}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, text: e.target.value})}
                      placeholder="Enter question text"
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  {/* Question Type */}
                  <div>
                    <select
                      value={currentQuestion.type}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, type: e.target.value})}
                      className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="short-answer">Short Answer</option>
                    </select>
                  </div>
                </div>

                {/* Options for Multiple Choice */}
                {currentQuestion.type === 'multiple-choice' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Answer Options</p>
                    {currentQuestion.options.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === idx}
                          onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: idx})}
                          className="w-4 h-4 text-blue-600"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[idx] = e.target.value;
                            setCurrentQuestion({...currentQuestion, options: newOptions});
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* True/False Options */}
                {currentQuestion.type === 'true-false' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="trueFalse"
                        checked={currentQuestion.correctAnswer === 0}
                        onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: 0})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">True</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="trueFalse"
                        checked={currentQuestion.correctAnswer === 1}
                        onChange={() => setCurrentQuestion({...currentQuestion, correctAnswer: 1})}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">False</span>
                    </div>
                  </div>
                )}

                {/* Points */}
                <div className="flex items-center gap-4">
                  <div className="w-32">
                    <input
                      type="number"
                      value={currentQuestion.points}
                      onChange={(e) => setCurrentQuestion({...currentQuestion, points: parseInt(e.target.value)})}
                      placeholder="Points"
                      min="1"
                      className="w-full p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addQuestion}
                    disabled={!currentQuestion.text.trim()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Question
                  </button>
                </div>
              </div>

              {/* Questions List */}
              {formData.questions.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300">Added Questions</h3>
                  {formData.questions.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 dark:text-white">{q.text}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>{q.type === 'multiple-choice' ? 'Multiple Choice' : q.type === 'true-false' ? 'True/False' : 'Short Answer'}</span>
                          <span>•</span>
                          <span>{q.points} points</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(idx)}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* أزرار الحفظ والإلغاء */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-medium transition flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Create Quiz
              </button>
              <Link
                href="/teacher/quizzes"
                className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
