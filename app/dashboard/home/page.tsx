'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useMemo, useState } from 'react';
import {
  SunIcon,
  MoonIcon,
  AcademicCapIcon,
  StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

type Lang = 'en' | 'ar';

type HomeContentResponse = {
  hero: {
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
  };
  about: {
    titleEn: string;
    titleAr: string;
    descriptionEn: string;
    descriptionAr: string;
  };
  contact: {
    email: string;
    phone: string;
    locationEn: string;
    locationAr: string;
    descriptionEn: string;
    descriptionAr: string;
  };
  featuredCourses: FeaturedCourse[];
  testimonials: {
    en: Testimonial[];
    ar: Testimonial[];
  };
};

type FeaturedCourse = {
  id: string;
  titleEn: string;
  titleAr: string;
  instructorEn: string;
  instructorAr: string;
  durationEn: string;
  durationAr: string;
  studentsTextEn: string;
  studentsTextAr: string;
  imageUrl: string;
  courseLink: string;
  price: number;
  rating: number;
  sortOrder: number;
  isActive: boolean;
};

type Testimonial = {
  id: string;
  language: Lang;
  fullName: string;
  roleTitle: string;
  content: string;
  avatarUrl: string;
  rating: number;
  sortOrder: number;
  isActive: boolean;
};

const navItemsEn = [
  { name: 'Home', id: 'home' },
  { name: 'About', id: 'about' },
  { name: 'Courses', id: 'courses' },
  { name: 'Feedback', id: 'testimonials' },
  { name: 'Contact', id: 'contact' },
];

const navItemsAr = [
  { name: 'Home', id: 'home' },
  { name: 'About', id: 'about' },
  { name: 'Courses', id: 'courses' },
  { name: 'Feedback', id: 'testimonials' },
  { name: 'Contact', id: 'contact' },
];

const SECTION_HEIGHT_CLASS = 'h-[620px]';

export default function DashboardHomeEditorPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [language, setLanguage] = useState<Lang>('en');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [content, setContent] = useState<HomeContentResponse>({
    hero: {
      titleEn: 'Learn Smarter. Build Faster.',
      titleAr: 'Learn Smarter. Build Faster.',
      descriptionEn: 'Welcome to Aivora.',
      descriptionAr: 'Welcome to Aivora.',
    },
    about: {
      titleEn: 'About Aivora',
      titleAr: 'About Aivora',
      descriptionEn: '',
      descriptionAr: '',
    },
    contact: {
      email: 'support@aivora.com',
      phone: '+970 599 123 456',
      locationEn: 'Nablus, Palestine',
      locationAr: 'Nablus, Palestine',
      descriptionEn: 'We are here to support your learning journey.',
      descriptionAr: 'We are here to support your learning journey.',
    },
    featuredCourses: [],
    testimonials: { en: [], ar: [] },
  });

  const [allCourses, setAllCourses] = useState<FeaturedCourse[]>([]);
  const [allTestimonials, setAllTestimonials] = useState<Testimonial[]>([]);

  const [newCourse, setNewCourse] = useState({
    titleEn: '',
    titleAr: '',
    instructorEn: '',
    instructorAr: '',
    durationEn: '',
    durationAr: '',
    studentsTextEn: '',
    studentsTextAr: '',
    imageUrl: '',
    courseLink: '#',
    price: 0,
    rating: 5,
    sortOrder: 0,
    isActive: true,
  });

  const [newFeedback, setNewFeedback] = useState({
    language: 'en' as Lang,
    fullName: '',
    roleTitle: '',
    content: '',
    avatarUrl: '',
    rating: 5,
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (const item of navItemsEn) {
        const el = document.getElementById(item.id);
        if (!el) continue;
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPosition >= top && scrollPosition < top + height) {
          setActiveSection(item.id);
          break;
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  async function loadData() {
    try {
      const [mainRes, coursesRes, feedbackRes] = await Promise.all([
        fetch('/api/home-content', { cache: 'no-store' }),
        fetch('/api/home-content/featured-courses', { cache: 'no-store' }),
        fetch('/api/home-content/testimonials', { cache: 'no-store' }),
      ]);

      if (mainRes.ok) {
        const mainData = await mainRes.json();
        setContent(mainData);
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json();
        setAllCourses(coursesData.items || []);
      }

      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setAllTestimonials(feedbackData.items || []);
      }
    } catch (error) {
      console.error(error);
      setMessage('Failed to load content');
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function saveAboutAndContact() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/home-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heroTitleEn: content.hero.titleEn,
          heroTitleAr: content.hero.titleAr,
          heroDescriptionEn: content.hero.descriptionEn,
          heroDescriptionAr: content.hero.descriptionAr,
          aboutTitleEn: content.about.titleEn,
          aboutTitleAr: content.about.titleAr,
          aboutDescriptionEn: content.about.descriptionEn,
          aboutDescriptionAr: content.about.descriptionAr,
          contactEmail: content.contact.email,
          contactPhone: content.contact.phone,
          contactLocationEn: content.contact.locationEn,
          contactLocationAr: content.contact.locationAr,
          contactDescriptionEn: content.contact.descriptionEn,
          contactDescriptionAr: content.contact.descriptionAr,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setMessage('About and contact updated');
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function addCourse() {
    const res = await fetch('/api/home-content/featured-courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCourse),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add course');
    setNewCourse({
      titleEn: '',
      titleAr: '',
      instructorEn: '',
      instructorAr: '',
      durationEn: '',
      durationAr: '',
      studentsTextEn: '',
      studentsTextAr: '',
      imageUrl: '',
      courseLink: '#',
      price: 0,
      rating: 5,
      sortOrder: 0,
      isActive: true,
    });
    await loadData();
  }

  async function toggleCourseDraft(item: FeaturedCourse) {
    const res = await fetch(`/api/home-content/featured-courses/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...item, isActive: !item.isActive }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update course');
    await loadData();
  }

  async function deleteCourse(id: string) {
    const res = await fetch(`/api/home-content/featured-courses/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete course');
    await loadData();
  }

  async function addFeedback() {
    const res = await fetch('/api/home-content/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFeedback),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to add feedback');
    setNewFeedback({
      language: 'en',
      fullName: '',
      roleTitle: '',
      content: '',
      avatarUrl: '',
      rating: 5,
      sortOrder: 0,
      isActive: true,
    });
    await loadData();
  }

  async function deleteFeedback(id: string) {
    const res = await fetch(`/api/home-content/testimonials/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete feedback');
    await loadData();
  }

  const isDark = mounted && theme === 'dark';
  const isArabic = language === 'ar';
  const navItems = isArabic ? navItemsAr : navItemsEn;
  const bgUrl = useMemo(() => "url('/plain2.png')", []);
  const sectionBase = `${SECTION_HEIGHT_CLASS} flex items-center justify-start px-5 sm:px-6 lg:px-8`;

  const visibleCourses = allCourses.filter((c) => c.isActive);
  const visibleFeedback = allTestimonials.filter(
    (t) => t.isActive && t.language === (isArabic ? 'ar' : 'en')
  );

  return (
    <div className="min-h-screen relative text-slate-900 dark:text-slate-100" dir="ltr">
      <div
        className="fixed inset-0 -z-10 bg-cover bg-no-repeat transition-[filter] duration-500"
        style={{
          backgroundImage: bgUrl,
          backgroundPosition: '50% 50%',
          animation: 'bgMove 18s ease-in-out infinite',
          filter: isDark ? 'brightness(0.85) saturate(1.05)' : 'brightness(1.05) saturate(1.0)',
        }}
      />
      <div className={`fixed inset-0 -z-10 ${isDark ? 'bg-black/25' : 'bg-white/20'}`} />

      <header className="sticky top-0 z-50 px-4 pt-4">
        <div className="mx-auto max-w-7xl rounded-2xl border border-stone-200/80 dark:border-slate-700/80 bg-stone-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center shrink-0">
              <AcademicCapIcon className="w-8 h-8 text-blue-950 dark:text-blue-400 mr-2" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Aivora</h1>
            </Link>

            <div className="hidden md:flex items-center justify-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })}
                  className={`text-sm font-medium transition-all px-4 py-2 rounded-full whitespace-nowrap ${
                    activeSection === item.id
                      ? 'bg-blue-950 dark:bg-blue-700 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5 text-slate-900 dark:text-white" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-slate-900 dark:text-white" />
                )}
              </button>
              <button
                onClick={() => setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'))}
                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800"
              >
                <GlobeAltIcon className="w-5 h-5 text-slate-900 dark:text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 space-y-10 md:space-y-14 pb-14 pt-6">
        <section id="home" className={sectionBase}>
          <div className="max-w-7xl grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="text-left">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black text-white">
                Ai<span className="text-blue-300">vora</span>
              </h1>
              <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-semibold text-blue-100">
                {isArabic ? content.hero.titleAr : content.hero.titleEn}
              </h2>
              <p className="mt-6 max-w-2xl text-base sm:text-lg lg:text-xl leading-8 text-slate-200">
                {isArabic ? content.hero.descriptionAr : content.hero.descriptionEn}
              </p>
            </div>
            <div className="relative flex justify-start">
              <img src="/p3.png" alt="Aivora AI" className="w-[520px] md:w-[600px] lg:w-[660px] object-contain drop-shadow-2xl" />
            </div>
          </div>
        </section>

        <section id="about" className={sectionBase}>
          <div className="max-w-7xl">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6">
              {isArabic ? content.about.titleAr : content.about.titleEn}
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-200 leading-9">
              {isArabic ? content.about.descriptionAr : content.about.descriptionEn}
            </p>

            <div className="mt-6 grid md:grid-cols-2 gap-3">
              <textarea
                rows={6}
                className="rounded-xl border border-white/20 bg-white/10 p-3 text-white placeholder:text-slate-300"
                placeholder="About paragraph (EN)"
                value={content.about.descriptionEn}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    about: { ...prev.about, descriptionEn: e.target.value },
                  }))
                }
              />
              <textarea
                rows={6}
                className="rounded-xl border border-white/20 bg-white/10 p-3 text-white placeholder:text-slate-300"
                placeholder="About paragraph (AR)"
                value={content.about.descriptionAr}
                onChange={(e) =>
                  setContent((prev) => ({
                    ...prev,
                    about: { ...prev.about, descriptionAr: e.target.value },
                  }))
                }
              />
            </div>
            <button
              onClick={saveAboutAndContact}
              disabled={saving}
              className="mt-4 px-6 py-3 rounded-xl bg-blue-950 hover:bg-blue-700 text-white font-semibold"
            >
              {saving ? 'Saving...' : 'Save About + Contact'}
            </button>
            {message && <p className="mt-3 text-sm text-blue-200">{message}</p>}
          </div>
        </section>

        <section id="courses" className="px-5 sm:px-6 lg:px-8 py-20">
          <div className="max-w-7xl">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-8">Popular Courses</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {visibleCourses.map((course) => (
                <div key={course.id} className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg overflow-hidden">
                  <div className="h-40 overflow-hidden">
                    <img src={course.imageUrl} alt={course.titleEn} className="w-full h-full object-cover" />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-blue-200 mb-1">
                      {isArabic ? course.instructorAr : course.instructorEn}
                    </p>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {isArabic ? course.titleAr : course.titleEn}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-slate-200 mb-3">
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4 text-blue-300" />
                        {isArabic ? course.durationAr : course.durationEn}
                      </span>
                      <span className="flex items-center gap-1">
                        <UserGroupIcon className="w-4 h-4 text-blue-300" />
                        {isArabic ? course.studentsTextAr : course.studentsTextEn}
                      </span>
                      <span className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        {course.rating}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-300 font-bold">${course.price}</span>
                      <button
                        onClick={() => toggleCourseDraft(course).catch((e) => setMessage(e.message))}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-200 text-xs"
                      >
                        Draft
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-white font-semibold mb-3">Add New Popular Course</p>
              <div className="grid md:grid-cols-3 gap-2">
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Title EN" value={newCourse.titleEn} onChange={(e) => setNewCourse((s) => ({ ...s, titleEn: e.target.value }))} />
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Title AR" value={newCourse.titleAr} onChange={(e) => setNewCourse((s) => ({ ...s, titleAr: e.target.value }))} />
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Image URL" value={newCourse.imageUrl} onChange={(e) => setNewCourse((s) => ({ ...s, imageUrl: e.target.value }))} />
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Instructor EN" value={newCourse.instructorEn} onChange={(e) => setNewCourse((s) => ({ ...s, instructorEn: e.target.value }))} />
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Instructor AR" value={newCourse.instructorAr} onChange={(e) => setNewCourse((s) => ({ ...s, instructorAr: e.target.value }))} />
                <input type="number" className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Price" value={newCourse.price} onChange={(e) => setNewCourse((s) => ({ ...s, price: Number(e.target.value || 0) }))} />
              </div>
              <button
                onClick={() => addCourse().catch((e) => setMessage(e.message))}
                className="mt-3 px-4 py-2 rounded-lg bg-blue-950 text-white"
              >
                Add Course
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-white font-semibold mb-2">Draft Courses</p>
              <div className="space-y-2">
                {allCourses
                  .filter((c) => !c.isActive)
                  .map((course) => (
                    <div key={course.id} className="flex items-center justify-between rounded-lg bg-white/5 p-2">
                      <span className="text-slate-200">{course.titleEn}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleCourseDraft(course).catch((e) => setMessage(e.message))}
                          className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 text-xs"
                        >
                          Publish
                        </button>
                        <button
                          onClick={() => deleteCourse(course.id).catch((e) => setMessage(e.message))}
                          className="px-3 py-1 rounded-lg bg-red-500/20 text-red-200 text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="px-5 sm:px-6 lg:px-8 py-20">
          <div className="max-w-7xl">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-8">Feedback</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {visibleFeedback.map((t) => (
                <div key={t.id} className="p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <img src={t.avatarUrl || 'https://via.placeholder.com/120'} alt={t.fullName} className="w-12 h-12 rounded-full border-2 border-blue-300" />
                    <div>
                      <h4 className="font-bold text-white text-base">{t.fullName}</h4>
                      <p className="text-xs text-slate-300">{t.roleTitle}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-200 leading-6 italic">&quot;{t.content}&quot;</p>
                  <button
                    onClick={() => deleteFeedback(t.id).catch((e) => setMessage(e.message))}
                    className="mt-3 px-3 py-1 rounded-lg bg-red-500/20 text-red-200 text-xs"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-white font-semibold mb-3">Add Feedback</p>
              <div className="grid md:grid-cols-3 gap-2">
                <select className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" value={newFeedback.language} onChange={(e) => setNewFeedback((s) => ({ ...s, language: e.target.value as Lang }))}>
                  <option value="en">EN</option>
                  <option value="ar">AR</option>
                </select>
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Name" value={newFeedback.fullName} onChange={(e) => setNewFeedback((s) => ({ ...s, fullName: e.target.value }))} />
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Role" value={newFeedback.roleTitle} onChange={(e) => setNewFeedback((s) => ({ ...s, roleTitle: e.target.value }))} />
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Avatar URL" value={newFeedback.avatarUrl} onChange={(e) => setNewFeedback((s) => ({ ...s, avatarUrl: e.target.value }))} />
                <textarea className="rounded-lg bg-white/10 border border-white/20 p-2 text-white md:col-span-2" placeholder="Feedback text" value={newFeedback.content} onChange={(e) => setNewFeedback((s) => ({ ...s, content: e.target.value }))} />
              </div>
              <button
                onClick={() => addFeedback().catch((e) => setMessage(e.message))}
                className="mt-3 px-4 py-2 rounded-lg bg-blue-950 text-white"
              >
                Add Feedback
              </button>
            </div>
          </div>
        </section>

        <section id="contact" className="px-5 sm:px-6 lg:px-8 py-20">
          <div className="max-w-7xl">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white mb-8">Contact</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg">
                <EnvelopeIcon className="w-7 h-7 text-blue-300 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Email</h3>
                <p className="text-blue-200">{content.contact.email}</p>
              </div>
              <div className="p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg">
                <PhoneIcon className="w-7 h-7 text-blue-300 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Phone</h3>
                <p className="text-blue-200">{content.contact.phone}</p>
              </div>
              <div className="p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg">
                <MapPinIcon className="w-7 h-7 text-blue-300 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Location</h3>
                <p className="text-blue-200">{isArabic ? content.contact.locationAr : content.contact.locationEn}</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-white/20 bg-white/10 p-4">
              <p className="text-white font-semibold mb-3">Edit Contact</p>
              <div className="grid md:grid-cols-2 gap-2">
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Email" value={content.contact.email} onChange={(e) => setContent((s) => ({ ...s, contact: { ...s.contact, email: e.target.value } }))} />
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Phone" value={content.contact.phone} onChange={(e) => setContent((s) => ({ ...s, contact: { ...s.contact, phone: e.target.value } }))} />
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Location EN" value={content.contact.locationEn} onChange={(e) => setContent((s) => ({ ...s, contact: { ...s.contact, locationEn: e.target.value } }))} />
                <input className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Location AR" value={content.contact.locationAr} onChange={(e) => setContent((s) => ({ ...s, contact: { ...s.contact, locationAr: e.target.value } }))} />
                <textarea className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Description EN" value={content.contact.descriptionEn} onChange={(e) => setContent((s) => ({ ...s, contact: { ...s.contact, descriptionEn: e.target.value } }))} />
                <textarea className="rounded-lg bg-white/10 border border-white/20 p-2 text-white" placeholder="Description AR" value={content.contact.descriptionAr} onChange={(e) => setContent((s) => ({ ...s, contact: { ...s.contact, descriptionAr: e.target.value } }))} />
              </div>
              <button
                onClick={saveAboutAndContact}
                disabled={saving}
                className="mt-3 px-4 py-2 rounded-lg bg-blue-950 text-white"
              >
                {saving ? 'Saving...' : 'Save Contact'}
              </button>
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        @keyframes bgMove {
          0% { background-position: 50% 50%; }
          50% { background-position: 60% 45%; }
          100% { background-position: 50% 50%; }
        }
      `}</style>
    </div>
  );
}
