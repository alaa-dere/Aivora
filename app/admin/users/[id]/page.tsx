import { UserProfileClient } from "@/components/admin/user-profile/user-profile-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserDetailsPage({ params }: PageProps) {
  const { id } = await params;
  return <UserProfileClient id={id} />;
}