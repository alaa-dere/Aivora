"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, X, Code, Braces, Server, Cpu, Globe, Github } from "lucide-react";

export default function CreateCoursePage() {
  const router = useRouter();
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
    status: "draft"
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Course data:", formData);
    router.push("/teacher/courses");
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
    <div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header مع زر الرجوع */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/teacher/courses"
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">
              Create New Programming Course
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Fill in the details to create a new tech course
            </p>
          </div>
        </div>

        {/* فورم إنشاء الكورس - يأخذ العرض الكامل */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 space-y-8">
            
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Basic Information
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* اسم الكورس */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Advanced Python Programming"
                    required
                  />
                </div>

                {/* كود الكورس */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. CS401"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Programming Details */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Programming Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Programming Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Programming Language <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    {programmingLanguages.map(lang => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </select>
                </div>

                {/* Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    {levels.map(level => (
                      <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Duration (in hours) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. 40"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="0 for free"
                  />
                </div>

                {/* GitHub Repository */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    GitHub Repository URL
                  </label>
                  <div className="relative">
                    <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="url"
                      value={formData.githubRepo}
                      onChange={(e) => setFormData({...formData, githubRepo: e.target.value})}
                      className="w-full pl-10 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="https://github.com/username/repo"
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Course Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({...formData, image: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="https://example.com/image.jpg"
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
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Course Content
              </h2>

              {/* Short Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Short Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Brief description of the course (will appear in course cards)"
                  required
                />
              </div>

              {/* Full Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Description
                </label>
                <textarea
                  value={formData.longDescription}
                  onChange={(e) => setFormData({...formData, longDescription: e.target.value})}
                  rows={6}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="Detailed description of what students will learn, prerequisites, outcomes, etc."
                />
              </div>

              {/* Prerequisites */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prerequisites
                </label>
                <textarea
                  value={formData.prerequisites}
                  onChange={(e) => setFormData({...formData, prerequisites: e.target.value})}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  placeholder="What students need to know before taking this course"
                />
              </div>
            </div>

            {/* أزرار الحفظ والإلغاء */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#1E40AF] text-white font-medium transition flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                Create Course
              </button>
              <Link
                href="/teacher/courses"
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