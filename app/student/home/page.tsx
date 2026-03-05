import Link from 'next/link';
import { Users, Clock, Award, Star, BookOpen } from 'lucide-react';

export default function HomePage() {
  const featuredCourses = [
    {
      id: 1,
      title: "Complete Web Development Bootcamp",
      price: 199,
      image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2070",
    },
    {
      id: 2,
      title: "Machine Learning & AI Fundamentals",
      price: 249,
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2070",
    },
    {
      id: 3,
      title: "UI/UX Design Masterclass 2025",
      price: 149,
      image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=2070",
    },
    {
      id: 4,
      title: "Digital Marketing & Growth Hacking",
      price: 179,
      image: "https://images.unsplash.com/photo-1556155099-490a1ba16284?auto=format&fit=crop&q=80&w=2070",
    },
    {
      id: 5,
      title: "Python for Data Science",
      price: 189,
      image: "https://images.unsplash.com/photo-1526379095098-400b3c5e9b6c?auto=format&fit=crop&q=80&w=2070",
    },
    {
      id: 6,
      title: "iOS App Development with Swift",
      price: 229,
      image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=2070",
    },
    {
      id: 7,
      title: "Graphic Design Fundamentals",
      price: 139,
      image: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=2070",
    },
    {
      id: 8,
      title: "Business Analytics & Strategy",
      price: 199,
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070",
    },
  ];

  const features = [
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: "5,000+ Students",
      description: "Join a global community of learners",
    },
    {
      icon: <Clock className="w-8 h-8 text-blue-600" />,
      title: "Learn at Your Pace",
      description: "Recorded lessons available anytime, anywhere",
    },
    {
      icon: <Award className="w-8 h-8 text-blue-600" />,
      title: "Certified Courses",
      description: "Earn recognized certificates upon completion",
    },
    {
      icon: <Star className="w-8 h-8 text-blue-600" />,
      title: "Real Reviews",
      description: "All courses rated by past students",
    },
  ];

  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen font-sans">
      {/* Hero Section - with updated image */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=2070"
            alt="Students studying together"
            className="w-full h-full object-cover brightness-50 scale-105 animate-slow-zoom"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-blue-950/40 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 drop-shadow-2xl leading-tight">
            Unlock Your Potential with Aivora
          </h1>
          <p className="text-base md:text-xl text-gray-200 max-w-3xl mx-auto drop-shadow-lg">
            Professional courses, expert instructors, and recognized certificates — all in one place.
          </p>
        </div>
      </section>

      {/* About Section */}
      <section className="py-12 px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
            <BookOpen className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            About Aivora
          </h2>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            Aivora is an online learning platform dedicated to helping individuals gain in-demand skills. 
            We partner with industry experts to bring you high-quality courses in web development, data science, design, marketing, and more. 
            Whether you're starting your career or looking to advance, Aivora provides the tools you need to succeed.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Why Choose Aivora?
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            A comprehensive learning platform combining quality and flexibility
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="text-center p-5 rounded-2xl bg-gray-50 dark:bg-gray-800 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses - فقط صورة، عنوان، سعر */}
      <section id="featured" className="py-16 px-6 md:px-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center text-gray-900 dark:text-white mb-4">
            Featured Courses
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 text-center mb-12 max-w-3xl mx-auto">
            Choose from the top-rated courses loved by students
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            {featuredCourses.map((course) => (
              <div
                key={course.id}
                className="group bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 hover:-translate-y-1"
              >
                <div className="relative h-36 md:h-40 overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>

                <div className="p-3 md:p-4">
                  <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {course.title}
                  </h3>

                  <div className="flex items-center justify-between">
                    <span className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                      ${course.price}
                    </span>
                    <Link
                      href={`/courses/${course.id}`}
                      className="px-3 py-1.5 md:px-4 md:py-2 rounded-lg bg-blue-600 text-white text-xs md:text-sm font-medium hover:bg-blue-700 transition"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/courses"
              className="inline-block px-10 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg md:text-xl font-bold shadow-lg hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-300"
            >
              View All Courses
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}