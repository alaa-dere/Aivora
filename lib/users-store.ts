export type Role = "student" | "teacher";
export type Status = "active" | "blocked";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: Status;
  createdAt: string;
};

const STORAGE_KEY = "aivora_users_v1";

const seedUsers: UserRow[] = [
  { id: "U-1001", name: "Batool Ahmad", email: "batool@student.com", role: "student", status: "active", createdAt: "2026-02-01" },
  { id: "U-1002", name: "Sara Omar", email: "sara@student.com", role: "student", status: "active", createdAt: "2026-02-05" },
  { id: "U-2001", name: "Alaa Dere", email: "alaa@teacher.com", role: "teacher", status: "active", createdAt: "2026-01-20" },
  { id: "U-2002", name: "Mohammad Y.", email: "mohammad@teacher.com", role: "teacher", status: "blocked", createdAt: "2026-01-12" },
];

export function loadUsers(): UserRow[] {
  if (typeof window === "undefined") return seedUsers;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedUsers));
    return seedUsers;
  }

  try {
    return JSON.parse(raw) as UserRow[];
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seedUsers));
    return seedUsers;
  }
}

export function saveUsers(users: UserRow[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function getUserById(id: string): UserRow | undefined {
  return loadUsers().find((u) => u.id === id);
}

export function updateUser(
  id: string,
  patch: Partial<Pick<UserRow, "name" | "email" | "status">>
): UserRow[] {
  const users = loadUsers();

  const next: UserRow[] = users.map((u) =>
    u.id === id
      ? {
          ...u,
          ...patch,
          status: (patch.status ?? u.status) as Status,
        }
      : u
  );

  saveUsers(next);
  return next;
}