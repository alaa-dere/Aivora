import { redirect } from 'next/navigation';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function TeacherCourseContentPage({ params }: PageProps) {
  const { id } = await params;
  redirect(`/dashboard/courses/${encodeURIComponent(id)}/content`);
}

