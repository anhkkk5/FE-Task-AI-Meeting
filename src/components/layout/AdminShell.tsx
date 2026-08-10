"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LayoutDashboard, LogOut, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AdminShellProps = { children: ReactNode; title?: string };

const navItems = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Người dùng", icon: Users },
  { href: "/admin/workspaces", label: "Workspaces", icon: Building2 },
];

export function AdminShell({ children, title }: AdminShellProps) {
  const { user, isLoading, logoutUser } = useAuth(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && user && !user.isSystemAdmin) router.replace("/dashboard");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6f9fb]">
        <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          Đang kiểm tra quyền truy cập...
        </div>
      </div>
    );
  }
  if (!user.isSystemAdmin) return null;

  const initial = (user.fullName || user.email).charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#f6f9fb] text-[#173247]">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[#dce8ef] bg-white">
        <div className="flex h-[76px] items-center gap-3 border-b border-[#e6eef3] px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-extrabold">AgileFlow AI</p>
            <p className="text-xs font-medium text-slate-500">Quản trị hệ thống</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Chức năng chính</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200" : "text-slate-600 hover:bg-slate-50 hover:text-brand-800"}`}>
                <Icon className="h-[18px] w-[18px]" />{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-[#e6eef3] p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-[#e1eaf0] bg-[#f9fbfc] p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{initial}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{user.fullName}</p>
              <p className="truncate text-[11px] text-slate-500">{user.email}</p>
            </div>
            <button onClick={() => void logoutUser()} title="Đăng xuất" className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-[76px] items-center border-b border-[#dce8ef] bg-white/95 px-7 backdrop-blur">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-700">Admin Console</p>
            <p className="mt-0.5 text-sm font-bold text-[#173247]">{title || "Quản trị hệ thống"}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-800"><ShieldCheck className="h-4 w-4" /> System Admin</span>
        </header>
        <main className="mx-auto max-w-[1500px] p-7">{children}</main>
      </div>
    </div>
  );
}
