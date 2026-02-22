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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  loadUsers,
  saveUsers,
  type UserRow,
  type Role,
  type Status,
} from "@/lib/users-store";

function StatusBadge({ status }: { status: Status }) {
  if (status === "active") return <Badge>Active</Badge>;
  return <Badge variant="destructive">Blocked</Badge>;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tab, setTab] = useState<Role>("student");
  const [query, setQuery] = useState("");

  // Add user form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<Role>("student");

  // ✅ load from localStorage once
  useEffect(() => {
    setUsers(loadUsers());
  }, []);

  const filtered = useMemo(() => {
    const list = users.filter((u) => u.role === tab);

    if (!query.trim()) return list;
    const q = query.toLowerCase();

    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.id.toLowerCase().includes(q)
    );
  }, [users, tab, query]);

  function addUser() {
    const name = newName.trim();
    const email = newEmail.trim().toLowerCase();
    if (!name || !email) return;

    const prefix = newRole === "student" ? "U-1" : "U-2";
    const id = `${prefix}${Math.floor(1000 + Math.random() * 9000)}`;

    const next: UserRow[] = [
      {
        id,
        name,
        email,
        role: newRole,
        status: "active",
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...users,
    ];

    setUsers(next);
    saveUsers(next);

    setNewName("");
    setNewEmail("");
    setNewRole("student");
  }

 function toggleBlock(id: string) {
  const next: UserRow[] = users.map((u) =>
    u.id === id
      ? {
          ...u,
          status: (u.status === "active" ? "blocked" : "active") as Status,
        }
      : u
  );

  setUsers(next);
  saveUsers(next);
}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage students and teachers in Aivora.
          </p>
        </div>

        {/* Add user modal */}
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add User</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add new user</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Name</div>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Full name"
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Email</div>
                <Input
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium">Role</div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={newRole === "student" ? "default" : "outline"}
                    onClick={() => setNewRole("student")}
                  >
                    Student
                  </Button>
                  <Button
                    type="button"
                    variant={newRole === "teacher" ? "default" : "outline"}
                    onClick={() => setNewRole("teacher")}
                  >
                    Teacher
                  </Button>
                </div>
              </div>

              <Button className="w-full" onClick={addUser}>
                Create
              </Button>

              <p className="text-xs text-muted-foreground">
                Stored locally (localStorage) for now.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Role)}>
          <TabsList>
            <TabsTrigger value="student">Students</TabsTrigger>
            <TabsTrigger value="teacher">Teachers</TabsTrigger>
          </TabsList>
        </Tabs>

        <Input
          className="md:max-w-sm"
          placeholder="Search by name, email, or ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-lg border bg-background">
        <table className="w-full text-sm">
          <thead className="text-muted-foreground">
            <tr className="border-b">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Email</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Created</th>
              <th className="text-right py-3 px-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="py-3 px-4 font-medium">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-primary hover:underline"
                  >
                    {u.id}
                  </Link>
                </td>
                <td className="py-3 px-4">{u.name}</td>
                <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                <td className="py-3 px-4">
                  <StatusBadge status={u.status} />
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {u.createdAt}
                </td>
                <td className="py-3 px-4 text-right">
                  <Button
                    variant={u.status === "active" ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleBlock(u.id)}
                  >
                    {u.status === "active" ? "Block" : "Unblock"}
                  </Button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td
                  className="py-10 px-4 text-center text-muted-foreground"
                  colSpan={6}
                >
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}