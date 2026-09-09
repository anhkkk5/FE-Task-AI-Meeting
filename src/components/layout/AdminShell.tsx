"use client";

import { Building2, LayoutDashboard, LogOut, Menu, ShieldCheck, Users, X } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isLoading && user && !user.isSystemAdmin) router.replace("/dashboard");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-sm font-semibold text-slate-500">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          Đang kiểm tra quyền truy cập...
        </div>
      </div>
    );
  }
  if (!user.isSystemAdmin) return null;

  const initial = (user.fullName || user.email).charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Backdrop */}
      {isMobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* Aside Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out md:sticky md:top-0 md:translate-x-0
          ${isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
          ${isDesktopCollapsed ? "md:hidden" : "md:flex md:w-64"}
          w-72 max-w-[85vw] shrink-0
        `}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-200 px-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-base font-extrabold truncate">AgileFlow AI</p>
              <p className="text-xs font-medium text-slate-500 truncate">Quản trị hệ thống</p>
            </div>
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setIsMobileOpen(false);
              } else {
                setIsDesktopCollapsed(true);
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Đóng menu"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">Chức năng chính</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50 hover:text-blue-600"}`}>
                <Icon className="h-[18px] w-[18px]" />{item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{initial}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold">{user.fullName}</p>
              <p className="truncate text-[11px] text-slate-500">{user.email}</p>
            </div>
            <button onClick={() => void logoutUser()} title="Đăng xuất" className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-[76px] items-center border-b border-slate-200 bg-white/95 px-4 sm:px-7 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setIsMobileOpen((prev) => !prev);
                } else {
                  setIsDesktopCollapsed((prev) => !prev);
                }
              }}
              className="p-2 -ml-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition active:scale-95"
              title="Đóng / mở menu"
              aria-label="Đóng / mở menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">Admin Console</p>
              <p className="mt-0.5 text-sm font-bold text-slate-900">{title || "Quản trị hệ thống"}</p>
            </div>
          </div>
          <span className="ml-auto inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hidden sm:inline-flex"><ShieldCheck className="h-4 w-4" /> System Admin</span>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
