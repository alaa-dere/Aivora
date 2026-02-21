import type { ReactNode } from "react";
import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";

function NavItem({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="block rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted transition"
    >
      {label}
    </Link>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 flex-col border-r bg-background">
          <div className="h-14 px-4 flex items-center border-b">
            <div className="font-bold text-lg text-blue-600">Aivora</div>
          </div>

          <nav className="p-2 space-y-1">
            <NavItem href="/admin" label="Dashboard" />
            <NavItem href="/admin/users" label="Users" />
            <NavItem href="/admin/courses" label="Courses" />
            <NavItem href="/admin/finance" label="Finance" />
          </nav>

          <div className="mt-auto p-4 text-xs text-muted-foreground">
            v1.0 • Admin Panel
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1">
          {/* Topbar */}
          <header className="h-14 border-b bg-background flex items-center justify-between px-4">
            <div className="font-semibold">Admin Panel</div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-muted-foreground">admin@demo.com</div>
              <ModeToggle />
            </div>
          </header>

          <main className="p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}