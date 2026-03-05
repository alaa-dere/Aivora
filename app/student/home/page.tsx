'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { StarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon
 } from '@heroicons/react/24/outline';

// Navigation items
const navItems = [
  { name: 'Home', id: 'home' },
  { name: 'About', id: 'about' },
  { name: 'Courses', id: 'courses' },
  { name: 'Feedback', id: 'testimonials' },
  { name: 'Contact', id: 'contact' },
];

// Featured Courses (مختصرة شوية)
const featuredCourses = [
  {
    id: 1,
    title: "Full-Stack Web Development",
    price: 199,
    image: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=2070",
    instructor: "John Doe",
  },
  {
    id: 2,
    title: "Machine Learning Basics",
    price: 249,
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2070",
    instructor: "Sara Ahmed",
  },
  {
    id: 3,
    title: "UI/UX Design Masterclass",
    price: 149,
    image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&q=80&w=2070",
    instructor: "Maria Lopez",
  },
  {
    id: 4,
    title: "Digital Marketing 2025",
    price: 179,
    image: "https://images.unsplash.com/photo-1556155099-490a1ba16284?auto=format&fit=crop&q=80&w=2070",
    instructor: "Ahmed Ali",
  },
];

// Testimonials (مختصرة)
const testimonials = [
  {
    name: "Sarah Mohammed",
    role: "Full-Stack Developer",
    content: "Aivora changed my career completely!",
    avatar: "https://images.unsplash.com/photo-1494790108777-223d9d6b9f4f?auto=format&fit=crop&q=80&w=200",
    rating: 5,
  },
  {
    name: "Omar Hassan",
    role: "Data Scientist",
    content: "Best platform for practical learning.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    rating: 5,
  },
  {
    name: "Lina Khalil",
    role: "UI/UX Designer",
    content: "Amazing projects and feedback.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    rating: 4.8,
  },
];

export default function HomePage() {
  const [activeSection, setActiveSection] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 80;
      for (const item of navItems) {
        const el = document.getElementById(item.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen text-white relative">
      {/* خلفية ثابتة أزرق بحري ناعم وأفتح */}
      <div
        className="fixed inset-0 bg-cover bg-center z-[-1]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=2070')",
          filter: "brightness(0.65) contrast(1.05) saturate(0.95)",
        }}
      />

      {/* Navigation Bar - صغير جدًا، ناعم، شفاف */}
      <nav className="sticky top-0 z-40 bg-black/20 backdrop-blur-xl border-b border-white/5 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex justify-center space-x-6 md:space-x-10">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={`relative text-sm md:text-base font-medium transition-all duration-300 px-3 py-1.5 rounded-full ${
                activeSection === item.id
                  ? 'text-white bg-white/10 shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content - قصير جدًا */}
      <main className="relative z-10 pt-6 space-y-8 md:space-y-12">
        {/* Home - صغير جدًا */}
        <section id="home" className="min-h-[35vh] flex items-center justify-center py-8 px-6">
          <div className="text-center max-w-3xl mx-auto bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
              Learn Without Limits with Aivora
            </h1>
            <p className="text-base md:text-lg text-gray-200 mb-6">
              Professional courses • Expert instructors • Certificates
            </p>
            <button
              onClick={() => scrollTo('courses')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-base font-medium shadow-lg hover:shadow-blue-500/40 hover:-translate-y-1 transition-all"
            >
              Explore Courses
            </button>
          </div>
        </section>

        {/* About - صغير جدًا */}
        <section id="about" className="min-h-[35vh] flex items-center py-8 px-6">
          <div className="max-w-3xl mx-auto bg-black/30 backdrop-blur-xl rounded-2xl p-8 border border-white/10 shadow-xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">About Aivora</h2>
            <p className="text-base md:text-lg text-gray-200 leading-relaxed">
              Aivora is your modern platform for high-quality online courses in tech, design, and business.
            </p>
          </div>
        </section>

        {/* Courses - أكبر شوية */}
        <section id="courses" className="min-h-[60vh] flex items-center py-12 px-6 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-10">Featured Courses</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {featuredCourses.map((course) => (
                <div key={course.id} className="bg-black/30 backdrop-blur-lg rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition border border-white/10">
                  <div className="h-48 overflow-hidden">
                    <img src={course.image} alt={course.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">{course.title}</h3>
                    <p className="text-sm text-gray-300 mb-3">By {course.instructor}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold text-blue-400">${course.price}</span>
                      <Link href={`/courses/${course.id}`} className="bg-blue-600/80 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition text-sm">
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feedback */}
        <section id="testimonials" className="min-h-[60vh] flex items-center py-12 px-6 bg-black/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-10">What Students Say</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((t) => (
                <div key={t.name} className="bg-black/30 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-white/10 hover:shadow-xl transition">
                  <div className="flex items-center gap-3 mb-4">
                    <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full border-2 border-blue-500/40" />
                    <div>
                      <h4 className="font-bold text-white text-base">{t.name}</h4>
                      <p className="text-xs text-gray-300">{t.role}</p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`w-4 h-4 ${i < t.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500'}`}
                      />
                    ))}
                  </div>
                  <p className="text-sm italic text-gray-200">"{t.content}"</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="min-h-[60vh] flex items-center py-12 px-6 bg-black/20 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-white mb-8">Get In Touch</h2>
            <p className="text-lg text-gray-200 mb-10">We're here to help you start learning today.</p>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="p-6 rounded-2xl bg-black/30 backdrop-blur-lg border border-white/10 shadow-lg">
                <EnvelopeIcon className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Email</h3>
                <p className="text-gray-200 text-sm">support@aivora.com</p>
              </div>
              <div className="p-6 rounded-2xl bg-black/30 backdrop-blur-lg border border-white/10 shadow-lg">
                <PhoneIcon className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Phone</h3>
                <p className="text-gray-200 text-sm">+970 599 123 456</p>
              </div>
              <div className="p-6 rounded-2xl bg-black/30 backdrop-blur-lg border border-white/10 shadow-lg">
                <MapPinIcon className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Location</h3>
                <p className="text-gray-200 text-sm">Nablus, Palestine</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}