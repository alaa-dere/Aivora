"use client";

import { useEffect, useMemo, useState } from "react";
import { getUserById, updateUser, type UserRow } from "@/lib/users-store";
import { StudentProfileView, type StudentProfile } from "./student-profile-view";
import { TeacherProfileView, type TeacherProfile } from "./teacher-profile-view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function UserProfileClient({ id }: { id: string }) {
  const [row, setRow] = useState<UserRow | null>(null);

  // edit form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const u = getUserById(id);
    if (u) {
      setRow(u);
      setName(u.name);
      setEmail(u.email);
    }
  }, [id]);

  const profile = useMemo(() => {
    if (!row) return null;

    if (row.role === "student") {
      const student: StudentProfile = {
        role: "student",
        id: row.id,
        name: row.name,
        email: row.email,
        status: row.status,
        walletBalance: 35,
        courses: [
          { title: "HTML & CSS", progress: 100, status: "completed" },
          { title: "JavaScript", progress: 70, status: "active" },
        ],
        certificates: [{ title: "HTML & CSS", issuedAt: "2026-02-10", code: "CERT-111" }],
        ai: { strengths: ["CSS", "UI"], weaknesses: ["Async JS"], predictedScore: 82 },
      };
      return student;
    }

    const teacher: TeacherProfile = {
      role: "teacher",
      id: row.id,
      name: row.name,
      email: row.email,
      status: row.status,
      coursesCreated: [
        { title: "React Basics", students: 120, completion: 70, avgScore: 78 },
        { title: "JavaScript", students: 200, completion: 60, avgScore: 69 },
      ],
      earnings: { month: 620, total: 4100 },
      ai: { recommendations: ["الوحدة 3 أصعب وحدة", "أضف أمثلة أكثر على async/await"] },
    };
    return teacher;
  }, [row]);

  function onSave() {
    if (!row) return;

    const nextUsers = updateUser(row.id, { name: name.trim(), email: email.trim().toLowerCase() });
    const updated = nextUsers.find((u) => u.id === row.id) ?? null;
    setRow(updated);
  }

  function toggleBlock() {
    if (!row) return;

    const nextUsers = updateUser(row.id, { status: row.status === "active" ? "blocked" : "active" });
    const updated = nextUsers.find((u) => u.id === row.id) ?? null;
    setRow(updated);
  }

  if (!row || !profile) return <div className="p-10 text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">Edit</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Name</div>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Email</div>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <Button className="w-full" onClick={onSave}>
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant={row.status === "active" ? "destructive" : "default"} onClick={toggleBlock}>
          {row.status === "active" ? "Block" : "Unblock"}
        </Button>
      </div>

      {profile.role === "student" ? (
        <StudentProfileView user={profile} />
      ) : (
        <TeacherProfileView user={profile} />
      )}
    </div>
  );
}