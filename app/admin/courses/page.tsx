"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { loadCourses, saveCourses, type Course, type CourseStatus } from "../../../lib/courses-store";

function StatusBadge({ status }: { status: CourseStatus }) {
  if (status === "published") return <Badge>Published</Badge>;
  if (status === "draft") return <Badge variant="secondary">Draft</Badge>;
  return <Badge variant="destructive">Archived</Badge>;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [query, setQuery] = useState("");

  // Add course form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Web");
  const [level, setLevel] = useState<Course["level"]>("beginner");
  const [price, setPrice] = useState<number>(0);
  const [teacherName, setTeacherName] = useState("Alaa Dere");

  useEffect(() => {
    setCourses(loadCourses());
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return courses;
    const q = query.toLowerCase();
    return courses.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.teacherName.toLowerCase().includes(q)
    );
  }, [courses, query]);

  function addCourse() {
    const t = title.trim();
    if (!t) return;

    const id = `C-${Math.floor(1000 + Math.random() * 9000)}`;

    const next: Course[] = [
      {
        id,
        title: t,
        category: category.trim() || "General",
        level,
        price: Number(price) || 0,
        teacherName: teacherName.trim() || "Unknown",
        status: "draft",
        enrolledCount: 0,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...courses,
    ];

    setCourses(next);
    saveCourses(next);

    setTitle("");
    setPrice(0);
  }

  function togglePublish(id: string) {
    const next: Course[] = courses.map((c) =>
      c.id === id
        ? {
            ...c,
            status: (c.status === "published" ? "draft" : "published") as CourseStatus,
          }
        : c
    );

    setCourses(next);
    saveCourses(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Courses</h1>
          <p className="text-muted-foreground">
            Create and manage courses in Aivora.
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Course</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create course</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Title</div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Course title"
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Category</div>
                <Input value={category} onChange={(e) => setCategory(e.target.value)} />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Teacher</div>
                <Input value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Level</div>
                  <select
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={level}
                    onChange={(e) => setLevel(e.target.value as Course["level"])}
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium">Price ($)</div>
                  <Input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <Button className="w-full" onClick={addCourse}>
                Create (Draft)
              </Button>

              <p className="text-xs text-muted-foreground">
                Stored locally (localStorage) for now.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Input
        className="md:max-w-sm"
        placeholder="Search by title, id, category, teacher..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="overflow-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">Title</th>
              <th className="text-left py-3 px-4">Teacher</th>
              <th className="text-left py-3 px-4">Level</th>
              <th className="text-left py-3 px-4">Price</th>
              <th className="text-left py-3 px-4">Enrolled</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="py-3 px-4 font-medium">
                  <Link href={`/admin/courses/${c.id}`} className="text-primary hover:underline">
                    {c.id}
                  </Link>
                </td>
                <td className="py-3 px-4">{c.title}</td>
                <td className="py-3 px-4 text-muted-foreground">{c.teacherName}</td>
                <td className="py-3 px-4">{c.level}</td>
                <td className="py-3 px-4">${c.price}</td>
                <td className="py-3 px-4">{c.enrolledCount}</td>
                <td className="py-3 px-4">
                  <StatusBadge status={c.status} />
                </td>
                <td className="py-3 px-4 text-right">
                  <Button size="sm" variant="outline" onClick={() => togglePublish(c.id)}>
                    {c.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td className="py-10 px-4 text-center text-muted-foreground" colSpan={8}>
                  No courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}