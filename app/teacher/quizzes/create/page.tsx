"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  BrainCircuit,
  Clock,
  Users,
  Award,
  FileText,
  HelpCircle,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";

export default function CreateQuizPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    course: "",
    description: "",
    type: "quiz",
    timeLimit: 30,
    attemptsAllowed: 1,
    dueDate: "",
    status: "draft",
    questions: [] as any[],
  });

  const [currentQuestion, setCurrentQuestion] = useState({
    text: "",
    type: "multiple-choice",
    options: ["", "", "", ""],
    correctAnswer: 0,
    points: 1,
  });

  const courses = [
    "Advanced Python Programming",
    "Web Development with React",
    "Data Structures & Algorithms",
    "AI Fundamentals",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Quiz data:", formData);
    router.push("/teacher/quizzes");
  };

  const addQuestion = () => {
    if (currentQuestion.text.trim()) {
      setFormData({
        ...formData,
        questions: [...formData.questions, { ...currentQuestion }],
      });
      setCurrentQuestion({
        text: "",
        type: "multiple-choice",
        options: ["", "", "", ""],
        correctAnswer: 0,
        points: 1,
      });
    }
  };

  const removeQuestion = (index: number) => {
    setFormData({
      ...formData,
      questions: formData.questions.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/teacher/quizzes"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Quiz
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Design engaging assessments for your students
            </p>
          </div>
        </div>

        {/* AI Generator - أعلى بعد الـ header */}
        <div className="bg-blue-950 rounded-xl p-6 md:p-8 text-white shadow-md mb-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="bg-white/10 p-4 rounded-xl">
                <BrainCircuit className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Generate Quiz with AI</h2>
                <p className="text-blue-200 mt-2 max-w-2xl text-base">
                  Describe your quiz topic, number of questions, difficulty, and let AI create everything for you instantly.
                </p>
              </div>
            </div>
            <button className="bg-white text-blue-950 px-6 py-3.5 rounded-xl font-medium hover:bg-gray-100 transition-colors shadow-md hover:shadow-lg whitespace-nowrap">
              Try AI Generator
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 space-y-10">
            {/* Basic Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quiz Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="e.g. Python OOP Midterm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quiz Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  >
                    <option value="quiz">Regular Quiz</option>
                    <option value="midterm">Midterm Exam</option>
                    <option value="final">Final Exam</option>
                    <option value="practice">Practice Test</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    min="1"
                    placeholder="e.g. 60"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Attempts Allowed
                  </label>
                  <input
                    type="number"
                    value={formData.attemptsAllowed}
                    onChange={(e) => setFormData({ ...formData, attemptsAllowed: Number(e.target.value) })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    min="1"
                    placeholder="e.g. 1 (unlimited if 0)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    placeholder="Brief description of the quiz purpose and instructions"
                  />
                </div>
              </div>
            </section>

            {/* Questions Section */}
            <section>
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Questions
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.questions.length} questions added
                </span>
              </div>

              {/* Add Question Form */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 space-y-6">
                <h3 className="font-medium text-gray-700 dark:text-gray-300 text-lg">
                  Add New Question
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Text <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={currentQuestion.text}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, text: e.target.value })}
                      placeholder="Enter your question here..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Question Type
                    </label>
                    <select
                      value={currentQuestion.type}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    >
                      <option value="multiple-choice">Multiple Choice</option>
                      <option value="true-false">True/False</option>
                      <option value="short-answer">Short Answer</option>
                    </select>
                  </div>
                </div>

                {/* Multiple Choice Options */}
                {currentQuestion.type === "multiple-choice" && (
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Answer Options
                    </label>
                    {currentQuestion.options.map((option, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={currentQuestion.correctAnswer === idx}
                          onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: idx })}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...currentQuestion.options];
                            newOptions[idx] = e.target.value;
                            setCurrentQuestion({ ...currentQuestion, options: newOptions });
                          }}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* True/False */}
                {currentQuestion.type === "true-false" && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Correct Answer
                    </label>
                    <div className="flex items-center gap-8">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="trueFalse"
                          checked={currentQuestion.correctAnswer === 0}
                          onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 0 })}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">True</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="trueFalse"
                          checked={currentQuestion.correctAnswer === 1}
                          onChange={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: 1 })}
                          className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-gray-700 dark:text-gray-300">False</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Points & Add Button */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <div className="w-full sm:w-32">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Points
                    </label>
                    <input
                      type="number"
                      value={currentQuestion.points}
                      onChange={(e) => setCurrentQuestion({ ...currentQuestion, points: Number(e.target.value) })}
                      min="1"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={addQuestion}
                    disabled={!currentQuestion.text.trim()}
                    className="
                      flex-1 sm:flex-none px-6 py-3 rounded-xl
                      bg-blue-600 hover:bg-blue-700
                      text-white font-medium
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center justify-center gap-2
                    "
                  >
                    <Plus className="w-5 h-5" />
                    Add Question
                  </button>
                </div>
              </div>

              {/* Added Questions List */}
              {formData.questions.length > 0 && (
                <div className="space-y-4 pt-6">
                  <h3 className="font-medium text-gray-700 dark:text-gray-300 text-lg">
                    Added Questions ({formData.questions.length})
                  </h3>
                  <div className="space-y-3">
                    {formData.questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1 pr-4">
                          <p className="font-medium text-gray-800 dark:text-white">{q.text}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <HelpCircle className="w-4 h-4" />
                              {q.type === "multiple-choice"
                                ? "Multiple Choice"
                                : q.type === "true-false"
                                ? "True/False"
                                : "Short Answer"}
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              {q.points} points
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeQuestion(idx)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                className="
                  flex-1 flex items-center justify-center gap-2
                  py-3.5 px-6 rounded-xl
                  bg-blue-950 hover:bg-blue-900
                  text-white font-medium
                  shadow-md hover:shadow-lg
                  transition-all duration-200
                  active:scale-98
                "
              >
                <Save className="w-5 h-5" />
                Create Quiz
              </button>

              <Link
                href="/teacher/quizzes"
                className="
                  flex-1 flex items-center justify-center gap-2
                  py-3.5 px-6 rounded-xl
                  border border-gray-300 dark:border-gray-600
                  text-gray-700 dark:text-gray-300 font-medium
                  hover:bg-gray-50 dark:hover:bg-gray-800
                  transition-all duration-200
                "
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