"use client";

import { useEffect, useMemo, useState } from "react";
import { getCourseById, type Course } from "@/lib/courses-store";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CourseDetailsClient({ id }: { id: string }) {
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const c = getCourseById(id);
    if (c) setCourse(c);
  }, [id]);

  const stats = useMemo(() => {
    if (!course) return null;
    return {
      completionRate: course.status === "published" ? 62 : 0,
      avgScore: course.status === "published" ? 74 : 0,
      revenue: course.status === "published" ? course.enrolledCount * course.price : 0,
    };
  }, [course]);

  if (!course || !stats) return <div className="p-10 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground">
            Course details, content, students, quizzes, and AI insights.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{course.id}</Badge>
          <Badge>{course.status}</Badge>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Enrolled</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{course.enrolledCount}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">${stats.revenue}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.completionRate}%</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Avg Score</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{stats.avgScore}%</CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Course Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div><span className="text-muted-foreground">Category:</span> {course.category}</div>
              <div><span className="text-muted-foreground">Level:</span> {course.level}</div>
              <div><span className="text-muted-foreground">Teacher:</span> {course.teacherName}</div>
              <div><span className="text-muted-foreground">Price:</span> ${course.price}</div>
              <div><span className="text-muted-foreground">Created:</span> {course.createdAt}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
              <p className="text-sm text-muted-foreground">
                Videos, PDFs, slides (mock for now).
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Week 1: Introduction</div>
                  <div className="text-muted-foreground">video-intro.mp4</div>
                </div>
                <Badge variant="secondary">Video</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Week 2: Basics PDF</div>
                  <div className="text-muted-foreground">basics.pdf</div>
                </div>
                <Badge variant="secondary">PDF</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Slides</div>
                  <div className="text-muted-foreground">week-1-slides.pptx</div>
                </div>
                <Badge variant="secondary">Slides</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <p className="text-sm text-muted-foreground">Enrollment list (mock).</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Batool Ahmad</div>
                  <div className="text-muted-foreground">Progress: 65%</div>
                </div>
                <Badge>Active</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Sara Omar</div>
                  <div className="text-muted-foreground">Progress: 100%</div>
                </div>
                <Badge variant="secondary">Completed</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quizzes">
          <Card>
            <CardHeader>
              <CardTitle>Quizzes</CardTitle>
              <p className="text-sm text-muted-foreground">Quiz list & performance (mock).</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Quiz 1: Basics</div>
                  <div className="text-muted-foreground">Avg: 72% • Attempts: 210</div>
                </div>
                <Badge variant="secondary">Published</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Quiz 2: Advanced</div>
                  <div className="text-muted-foreground">Avg: 61% • Attempts: 180</div>
                </div>
                <Badge variant="secondary">Published</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai">
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>AI Insights</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Teaching recommendations (mock).
                </p>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>• 70% of students missed Question 3 in Quiz 1.</div>
                <div>• Unit 2 has the lowest completion rate.</div>
                <div>• Suggest adding more examples for async concepts.</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">Next month revenue prediction</div>
                <div className="text-3xl font-bold">${Math.round(stats.revenue * 1.12)}</div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Based on trend + enrollments (mock).
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}