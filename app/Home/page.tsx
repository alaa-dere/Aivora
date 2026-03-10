'use client';
import Image from "next/image";

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { FaInstagram } from "react-icons/fa";
import { useEffect, useMemo, useState } from 'react';
import {
  SunIcon,
  MoonIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

const navItemsEn = [
  { name: 'Home', id: 'home' },
  { name: 'About', id: 'about' },
  { name: 'Courses', id: 'courses' },
  { name: 'Feedback', id: 'testimonials' },
  { name: 'Contact', id: 'contact' },
];

const navItemsAr = [
  { name: 'الرئيسية', id: 'home' },
  { name: 'عنا', id: 'about' },
  { name: 'الدورات', id: 'courses' },
  { name: 'آراء الطلاب', id: 'testimonials' },
  { name: 'اتصل بنا', id: 'contact' },
];

const featuredCoursesEn = [
  {
    id: 1,
    title: 'Full-Stack Web Development',
    price: 199,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2070',
    instructor: 'John Doe',
    duration: '8 Weeks',
    students: '1.2k',
    rating: '4.9',
  },
  {
    id: 2,
    title: 'Machine Learning Basics',
    price: 249,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2070',
    instructor: 'Sara Ahmed',
    duration: '10 Weeks',
    students: '980',
    rating: '4.8',
  },
  {
    id: 3,
    title: 'UI/UX Design Masterclass',
    price: 149,
    image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=2070',
    instructor: 'Maria Lopez',
    duration: '6 Weeks',
    students: '860',
    rating: '4.7',
  },
  {
    id: 4,
    title: 'Digital Marketing 2025',
    price: 179,
    image: 'https://images.unsplash.com/photo-1556155099-490a1ba16284?auto=format&fit=crop&q=80&w=2070',
    instructor: 'Ahmed Ali',
    duration: '7 Weeks',
    students: '1.5k',
    rating: '4.9',
  },
];

const featuredCoursesAr = [
  {
    id: 1,
    title: 'تطوير الويب الكامل',
    price: 199,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2070',
    instructor: 'جون دو',
    duration: '8 أسابيع',
    students: '1.2 ألف',
    rating: '4.9',
  },
  {
    id: 2,
    title: 'أساسيات التعلم الآلي',
    price: 249,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2070',
    instructor: 'سارة أحمد',
    duration: '10 أسابيع',
    students: '980',
    rating: '4.8',
  },
  {
    id: 3,
    title: 'دورة ماجستير تصميم واجهة وتجربة المستخدم',
    price: 149,
    image: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=2070',
    instructor: 'ماريا لوبيز',
    duration: '6 أسابيع',
    students: '860',
    rating: '4.7',
  },
  {
    id: 4,
    title: 'التسويق الرقمي 2025',
    price: 179,
    image: 'https://images.unsplash.com/photo-1556155099-490a1ba16284?auto=format&fit=crop&q=80&w=2070',
    instructor: 'أحمد علي',
    duration: '7 أسابيع',
    students: '1.5 ألف',
    rating: '4.9',
  },
];

const testimonialsEn = [
  {
    name: 'Sarah Mohammed',
    role: 'Full-Stack Developer',
    content: 'Aivora changed my career completely!',
    avatar: 'https://images.unsplash.com/photo-1494790108777-223d9d6b9f4f?auto=format&fit=crop&q=80&w=200',
    rating: 5,
  },
  {
    name: 'Omar Hassan',
    role: 'Data Scientist',
    content: 'Best platform for practical learning.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    rating: 5,
  },
  {
    name: 'Lina Khalil',
    role: 'UI/UX Designer',
    content: 'Amazing projects and feedback.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    rating: 4.8,
  },
];

const testimonialsAr = [
  {
    name: 'سارة محمد',
    role: 'مطورة Full-Stack',
    content: 'أيفورا غيرت مسيرتي المهنية بالكامل!',
    avatar: 'https://images.unsplash.com/photo-1494790108777-223d9d6b9f4f?auto=format&fit=crop&q=80&w=200',
    rating: 5,
  },
  {
    name: 'عمر حسن',
    role: 'عالم بيانات',
    content: 'أفضل منصة للتعلم العملي والتطبيقي.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    rating: 5,
  },
  {
    name: 'لينا خليل',
    role: 'مصممة واجهات وتجربة مستخدم',
    content: 'مشاريع رائعة وملاحظات مفيدة جداً.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    rating: 4.8,
  },
];

const SECTION_HEIGHT_CLASS = 'h-[620px]';
const SCROLL_PANEL_HEIGHT_CLASS = 'h-[500px]';

export default function HomePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [language, setLanguage] = useState<'en' | 'ar'>('en');

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

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');
  const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'ar' : 'en'));

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const isDark = mounted && theme === 'dark';
  const isArabic = language === 'ar';

  const navItems = isArabic ? navItemsAr : navItemsEn;
  const featuredCourses = isArabic ? featuredCoursesAr : featuredCoursesEn;
  const testimonials = isArabic ? testimonialsAr : testimonialsEn;

  const bgUrl = useMemo(() => {
    return isDark ? "url('/plain2dd.png')" : "url('/plain2.png')";
  }, [isDark]);

  const sectionBase = `${SECTION_HEIGHT_CLASS} flex items-center justify-center px-5 sm:px-6 lg:px-8`;

  return (
    <div className="min-h-screen relative text-slate-900 dark:text-slate-100" dir="ltr">
      {/* Background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-no-repeat transition-[filter] duration-500"
        style={{
          backgroundImage: bgUrl,
          backgroundPosition: '50% 50%',
          animation: 'bgMove 18s ease-in-out infinite',
          filter: isDark ? 'brightness(0.85) saturate(1.05)' : 'brightness(1.05) saturate(1.0)',
        }}
      />

      <div
        className={`fixed inset-0 -z-10 transition-opacity duration-500 ${
          isDark ? 'bg-black/25' : 'bg-white/20'
        }`}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 px-4 pt-4">
        <div className="mx-auto max-w-7xl rounded-2xl border border-stone-200/80 dark:border-slate-700/80 bg-stone-50/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-lg px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
           {/* Logo */}
<Link href="/" className="flex items-center shrink-0">
 <Image
  src="/alaa.png"
  alt="Aivora Logo"
  width={100}
  height={35}
className="h-7 w-auto dark:brightness-100 brightness-25"/>
</Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center justify-center gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={`text-sm font-medium transition-all px-4 py-2 rounded-full whitespace-nowrap ${
                    activeSection === item.id
                      ? 'bg-blue-950 dark:bg-blue-700 text-white shadow-sm'
                      : 'text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.name}
                </button>
              ))}
            </div>

            {/* Right side buttons */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (
                  <SunIcon className="w-5 h-5 text-slate-900 dark:text-white" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-slate-900 dark:text-white" />
                )}
              </button>

              <button
                onClick={toggleLanguage}
                className="p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Toggle language"
                title={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
              >
                <GlobeAltIcon className="w-5 h-5 text-slate-900 dark:text-white" />
              </button>

              <Link href="/login">
                <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white">
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">{isArabic ? 'تسجيل الدخول' : 'Login'}</span>
                </button>
              </Link>
            </div>
          </div>

          {/* Mobile Nav */}
          <div className="mt-3 flex md:hidden overflow-x-auto gap-2 pb-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className={`text-xs font-medium transition-all px-3 py-2 rounded-full whitespace-nowrap ${
                  activeSection === item.id
                    ? 'bg-blue-950 dark:bg-blue-700 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="relative z-10 space-y-10 md:space-y-14 pb-14 pt-6">
        {/* Home Section */}
        <section id="home" className={sectionBase}>
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div className="text-center md:text-left">
              <p className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/10 text-blue-100 text-sm md:text-base font-medium backdrop-blur-md border border-white/20 shadow-md">
                {isArabic ? 'مرحباً بك في أيفورا' : 'Welcome to Aivora'}
              </p>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] tracking-tight text-white drop-shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
                Ai<span className="text-blue-300">vora</span>
              </h1>

              <h2 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-semibold text-blue-100">
                {isArabic ? 'تعلم أذكى. بنِ أسرع.' : 'Learn Smarter. Build Faster.'}
              </h2>

              <p className="mt-6 max-w-2xl mx-auto md:mx-0 text-base sm:text-lg lg:text-xl leading-8 text-slate-200">
                {isArabic
                  ? 'أيفورا منصة تعلم حديثة تساعد الطلاب والمحترفين على إتقان الذكاء الاصطناعي والبرمجة والمهارات الرقمية من خلال دورات عملية ومشاريع حقيقية ومسار تعليمي واضح.'
                  : 'Aivora is a modern learning platform that helps students and professionals master AI, programming, and digital skills through practical courses, real projects, and a clear learning path.'}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center md:items-start gap-4 justify-center md:justify-start">
                <button
                  onClick={() => scrollTo('courses')}
                  className="px-8 py-4 rounded-2xl bg-blue-950 dark:bg-blue-700 hover:bg-blue-500 text-white text-lg font-semibold shadow-[0_10px_30px_rgba(37,99,235,0.35)] transition-all duration-300 hover:-translate-y-1"
                >
                  {isArabic ? 'استكشف الدورات' : 'Explore Courses'}
                </button>

                <button
                  onClick={() => scrollTo('about')}
                  className="px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-lg font-semibold border border-white/20 backdrop-blur-md shadow-lg transition-all duration-300"
                >
                  {isArabic ? 'تعرف أكثر' : 'Learn More'}
                </button>
              </div>
            </div>

            <div className="relative flex justify-center md:justify-end">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] rounded-full bg-blue-400/20 blur-3xl" />
              </div>
              <img
                src="/p3.png"
                alt="Aivora AI"
                 className="w-[520px] md:w-[600px] lg:w-[660px] object-contain drop-shadow-2xl -mt-90 ml-20"
              />
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className={sectionBase}>
           <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-10 lg:gap-16 items-start">

           <div className="text-left md:col-span-2">
            <p className="text-blue-300 text-sm tracking-widest uppercase mb-4 text-center md:text-left">
              
              {isArabic ? 'عن أيفورا' : 'About Aivora'}
            </p>

            <h2 className="text-5xl md:text-6xl font-black text-white text-center md:text-left tracking-tight leading-tight mb-8">
              {isArabic ? 'اكتشف' : 'Discover'}{' '}
                <span className="text-blue-300">{isArabic ? 'أيفورا' : 'Aivora'}</span>

            </h2>

            <p
  className={`mt-6 w-full text-base sm:text-lg lg:text-xl text-slate-200 leading-9 ${
    isArabic ? 'text-right' : 'text-left'
  }`}
>
  {isArabic ? (
    <>
      أيفورا هي منصة تعلم ذكية مدعومة بالذكاء الاصطناعي، مصممة لدعم الطلاب وتحسين تجربتهم التعليمية. 
      تهدف المنصة إلى جعل التعلم أسهل وأكثر تفاعلية من خلال تقديم أدوات متقدمة تساعد الطلاب على فهم مواد الدورات بشكل أفضل وتطوير مهاراتهم خطوة بخطوة.
      <br /><br />
      أيفورا توفر للطلاب الوصول إلى مسارات تعلم منظمة، مساعدة فورية بالذكاء الاصطناعي، اختبارات تفاعلية، 
      وأدوات تساعد في تلخيص محتوى الدورات وتتبع التقدم الأكاديمي. كما تسمح للطلاب بممارسة مهاراتهم في الوقت الفعلي 
      وتلقي دعم مستمر طوال رحلتهم التعليمية.
      <br /><br />
      من خلال هذه الميزات، تهدف أيفورا إلى خلق بيئة تعلم حديثة تساعد الطلاب على التعلم بفعالية أكبر 
      وتوفر لهم الأدوات اللازمة لتحقيق النجاح الأكاديمي وتطوير مهارات جاهزة لسوق العمل المستقبلي.
    </>
  ) : (
    <>
      Aivora is an intelligent learning platform powered by artificial intelligence, designed to support students 
      and enhance their learning experience. The platform aims to make learning easier and more interactive 
      by providing advanced tools that help students understand course materials better and develop their skills 
      step by step.
      <br /><br />
      Aivora gives students access to structured learning paths, instant AI assistance, interactive quizzes, 
      and tools that help summarize course content and track academic progress. It also allows students to practice 
      their skills in real time and receive continuous support throughout their learning journey.
      <br /><br />
      Through these features, Aivora aims to create a modern learning environment that helps students learn more 
      effectively and provides them with the tools they need to achieve academic success and develop future-ready skills.
    </>
  )}
</p>
</div>
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="px-5 sm:px-6 lg:px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-12">
              <div>
                <p className="text-blue-300 text-sm tracking-[0.25em] uppercase mb-3">
                  {isArabic ? 'استكشف التعلم' : 'Explore Learning'}
                </p>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight text-white">
                 {isArabic ? 'الشائعة' : 'Popular'}{' '}
                <span className="text-blue-300">{isArabic ? 'الدورات' : 'Courses'}</span>
                  
                </h2>
              </div>

              <Link
                href="Home/courses"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-950 dark:bg-blue-700 hover:bg-blue-500 text-white text-sm sm:text-base font-semibold shadow-[0_10px_30px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-1"
              >
                {isArabic ? 'عرض جميع الدورات' : 'View All Courses'}
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {featuredCourses.map((course) => (
                <div
                  key={course.id}
                  className="group rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="h-40 overflow-hidden">
                    <img
                      src={course.image}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-blue-200 mb-2 font-medium">
                      {isArabic ? 'بواسطة' : 'By'} {course.instructor}
                    </p>
                    <h3 className="text-lg font-bold text-white mb-3 leading-snug">{course.title}</h3>
                    <div className="flex items-center justify-between text-sm text-slate-200 mb-4">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4 text-blue-300" />
                        {course.duration}
                      </div>
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="w-4 h-4 text-blue-300" />
                        {course.students}
                      </div>
                      <div className="flex items-center gap-1">
                        <StarIcon className="w-4 h-4 text-yellow-400" />
                        {course.rating}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-black text-blue-300">${course.price}</span>
                      <Link
                        href={`/courses/${course.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white/10 hover:bg-blue-600 text-white text-sm font-semibold border border-white/15 transition-all duration-300"
                      >
                        {isArabic ? 'عرض' : 'View'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="px-5 sm:px-6 lg:px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-14">
              <p className="text-blue-300 text-sm tracking-[0.25em] uppercase mb-3">
                {isArabic ? 'أصوات الطلاب' : 'Student Voices'}
              </p>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white">
                {isArabic ? 'الطلاب' : 'Student'}{' '}
                <span className="text-blue-300">{isArabic ? 'تعليقات' : 'Feedback'}</span>
                
              </h2>
              <p className="mt-4 text-slate-200 max-w-2xl text-lg">
                {isArabic
                  ? 'اسمع ما يقوله طلابنا عن تجربتهم في التعلم مع أيفورا.'
                  : 'Hear what our students say about their experience learning with Aivora.'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="group p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-12 h-12 rounded-full border-2 border-blue-300"
                    />
                    <div>
                      <h4 className="font-bold text-white text-base">{t.name}</h4>
                      <p className="text-xs text-slate-300">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-400'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-slate-200 leading-6 italic">"{t.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="px-5 sm:px-6 lg:px-8 py-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-14">
              <p className="text-blue-300 text-sm tracking-[0.25em] uppercase mb-3">
                {isArabic ? 'ابق على اتصال' : 'Get In Touch'}
              </p>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-white">
                {isArabic ? 'اتصل بـ' : 'Contact'}{' '}
                <span className="text-blue-300">{isArabic ? 'أيفورا' : 'Aivora'}</span>
              </h2>
              <p className="mt-4 text-slate-200 max-w-2xl text-lg leading-8">
                {isArabic
                  ? 'نحن هنا لدعم رحلتك التعليمية. تواصل معنا في أي وقت للأسئلة أو الإرشاد أو التعاون.'
                  : 'We’re here to support your learning journey. Reach out to us anytime for questions, guidance, or collaboration.'}
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="group p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-5 group-hover:bg-blue-600/30 transition">
                  <EnvelopeIcon className="w-7 h-7 text-blue-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {isArabic ? 'البريد الإلكتروني' : 'Email'}
                </h3>
                <p className="text-slate-300 text-sm leading-7 mb-2">
                  {isArabic
                    ? 'أرسل أسئلتك في أي وقت وسيرد فريقنا عليك.'
                    : 'Send us your questions anytime and our team will get back to you.'}
                </p>
<a
  href="https://mail.google.com/mail/?view=cm&fs=1&to=alaadere35@gmail.com"
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-200 font-medium hover:underline"
>
  click here to email us
</a>
            </div>

              <div className="group p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-5 group-hover:bg-blue-600/30 transition">
                  <PhoneIcon className="w-7 h-7 text-blue-300" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {isArabic ? 'الهاتف' : 'Phone'}
                </h3>
                <p className="text-slate-300 text-sm leading-7 mb-2">
                  {isArabic
                    ? 'تحدث مع فريق الدعم للحصول على مساعدة سريعة.'
                    : 'Talk to our support team for quick help and direct assistance.'}
                </p>
<a
  href="https://wa.me/972597889750"
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-200 font-medium hover:underline"
>
  +972 597 889 750
</a>
            </div>

              <div className="group p-6 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-lg shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">

  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 flex items-center justify-center mb-5 group-hover:bg-blue-600/30 transition">
    <FaInstagram className="w-7 h-7 text-blue-300" />
  </div>

  <h3 className="text-2xl font-bold text-white mb-3">
    {isArabic ? 'إنستغرام' : 'Instagram'}
  </h3>

  <p className="text-slate-300 text-sm leading-7 mb-2">
    {isArabic
      ? 'تابعنا على إنستغرام لمعرفة آخر التحديثات.'
      : 'Follow us on Instagram for the latest updates.'}
  </p>

  <a
    href="https://www.instagram.com/aivora_gb/"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-200 font-medium hover:underline"
  >
    @aivora_gb
  </a>

</div>
            </div>
          </div>
        </section>
      </main>

      <style jsx global>{`
        @keyframes bgMove {
          0% {
            background-position: 50% 50%;
          }
          50% {
            background-position: 60% 45%;
          }
          100% {
            background-position: 50% 50%;
          }
        }
      `}</style>
    </div>
  );
}