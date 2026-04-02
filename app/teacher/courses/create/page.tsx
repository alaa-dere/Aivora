"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  X,
  Code,
  Braces,
  Server,
  Cpu,
  Globe,
  Github,
} from "lucide-react";

export default function CreateCoursePage() {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    longDescription: "",
    category: "programming",
    language: "javascript",
    level: "beginner",
    duration: "",
    price: "",
    image: "",
    githubRepo: "",
    prerequisites: "",
    status: "draft",
  });

  const [imagePreview, setImagePreview] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Course data:", formData);
    // هنا بتروحي للـ backend أو تحفظي في state
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setFormData({ ...formData, image: url });
    setImagePreview(url);
  };

  const programmingLanguages = [
    { value: "javascript", label: "JavaScript", icon: Braces },
    { value: "python", label: "Python", icon: Code },
    { value: "java", label: "Java", icon: Cpu },
    { value: "csharp", label: "C#", icon: Server },
    { value: "cpp", label: "C++", icon: Code },
    { value: "php", label: "PHP", icon: Globe },
    { value: "ruby", label: "Ruby", icon: Code },
    { value: "go", label: "Go", icon: Server },
    { value: "rust", label: "Rust", icon: Cpu },
    { value: "typescript", label: "TypeScript", icon: Braces },
    { value: "swift", label: "Swift", icon: Globe },
    { value: "kotlin", label: "Kotlin", icon: Cpu },
  ];

  const levels = [
    { value: "beginner", label: "Beginner" },
    { value: "intermediate", label: "Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "all-levels", label: "All Levels" },
  ];

  const categories = [
    { value: "web-dev", label: "Web Development" },
    { value: "mobile-dev", label: "Mobile Development" },
    { value: "data-science", label: "Data Science" },
    { value: "machine-learning", label: "Machine Learning" },
    { value: "devops", label: "DevOps" },
    { value: "cybersecurity", label: "Cybersecurity" },
    { value: "game-dev", label: "Game Development" },
    { value: "algorithms", label: "Algorithms & Data Structures" },
    { value: "database", label: "Database" },
    { value: "cloud", label: "Cloud Computing" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/teacher/courses"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create New Course
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Fill in the details to publish your course
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="portal-surface bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 md:p-8 space-y-10">
            {/* Basic Information */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="e.g. Advanced Python Programming"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="e.g. CS401"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Programming Details */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                Programming Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Programming Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  >
                    {programmingLanguages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  >
                    {levels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  >
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (hours) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="e.g. 40"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="0 for free"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GitHub Repo (optional)
                  </label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.githubRepo}
                      onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                      className="portal-surface w-full pl-10 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Course Image */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                Course Image
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={handleImageChange}
                    className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    placeholder="https://example.com/course-image.jpg"
                  />
                </div>

                {imagePreview && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Preview
                    </label>
                    <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <Image
                        src={imagePreview}
                        alt="Course preview"
                        fill
                        className="object-cover"
                        onError={() => setImagePreview("")}
                      />
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Descriptions */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                Course Content
              </h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Short Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    placeholder="Brief overview that appears on course cards"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Description
                  </label>
                  <textarea
                    value={formData.longDescription}
                    onChange={(e) => setFormData({ ...formData, longDescription: e.target.value })}
                    rows={8}
                    className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    placeholder="Detailed learning outcomes, what students will build, tools used, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prerequisites
                  </label>
                  <textarea
                    value={formData.prerequisites}
                    onChange={(e) => setFormData({ ...formData, prerequisites: e.target.value })}
                    rows={3}
                    className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                    placeholder="Required prior knowledge or skills"
                  />
                </div>
              </div>
            </section>

            {/* Status */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700">
                Publishing Status
              </h2>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="portal-surface w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                >
                  <option value="draft">Draft (not visible to students)</option>
                  <option value="active">Active (published and available)</option>
                </select>
              </div>
            </section>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                className="
                  flex-1 flex items-center justify-center gap-2
                  py-3.5 px-6 rounded-xl
                  bg-blue-50 text-blue-700 border border-blue-200
                  shadow-sm hover:bg-blue-100
                  font-medium
                  transition-all duration-200
                  active:scale-98
                "
              >
                <Save className="w-5 h-5" />
                Create Course
              </button>
              <Link
                href="/teacher/courses"
                className="
                  flex-1 flex items-center justify-center gap-2
                  py-3.5 px-6 rounded-xl
                  border border-gray-300 dark:border-gray-600
                  text-gray-700 dark:text-gray-300 font-medium
                  hover:bg-white dark:hover:bg-gray-800
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
