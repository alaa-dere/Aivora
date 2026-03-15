export type CourseStatus = "draft" | "published" | "archived";

export type Course = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: "beginner" | "intermediate" | "advanced";
  price: number;
  teacherName: string;
  status: CourseStatus;
  enrolledCount: number;
  createdAt: string;
};

const STORAGE_KEY = "aivora_courses_v1";

const seedCourses: Course[] = [
  {
    id: "C-1001",
    title: "HTML & CSS",
    description: "Learn to build responsive websites from scratch using HTML and CSS.",
    category: "Web",
    level: "beginner",
    price: 15,
    teacherName: "Alaa Dere",
    status: "published",
    enrolledCount: 320,
    createdAt: "2026-01-10",
  },
];

export function loadCourses(): Course[] {
  if (typeof window === "undefined") return seedCourses;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCourses));
    return seedCourses;
  }

  try {
    return JSON.parse(raw) as Course[];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedCourses));
    return seedCourses;
  }
}

export function saveCourses(courses: Course[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

/** ✅ NEW: get single course by id */
export function getCourseById(id: string): Course | undefined {
  return loadCourses().find((c) => c.id === id);
}

/** ✅ NEW: update course fields (later for edit/publish/content) */
export function updateCourse(
  id: string,
  patch: Partial<Omit<Course, "id" | "createdAt">>
): Course[] {
  const courses = loadCourses();
  const next: Course[] = courses.map((c) =>
    c.id === id ? { ...c, ...patch } : c
  );
  saveCourses(next);
  return next;
}
