"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import {
  BarChart3,
  Building2,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type AdminShellProps = {
  children: ReactNode;
  title?: string;
};

export function AdminShell({ children, title }: AdminShellProps) {
  const { user, isLoading, logoutUser } = useAuth(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && user && !user.isSystemAdmin) {
      router.replace("/dashboard");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          <p className="text-sm font-medium text-slate-400">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  if (!user.isSystemAdmin) {
    return null;
  }

  const navItems = [
    {
      href: "/admin",
      label: "Tổng quan",
      icon: LayoutDashboard,
      exact: true,
    },
    {
      href: "/admin/users",
      label: "Quản lý Users",
      icon: Users,
    },
    {
      href: "/admin/workspaces",
      label: "Quản lý Workspaces",
      icon: Building2,
    },
  ];

  const userInitial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "A";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 z-20">
        {/* Logo */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-black text-white text-sm tracking-tight">Admin Panel</p>
            <p className="text-[10px] text-slate-500 font-medium">AgileFlow AI</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 pt-2 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-600">
            Quản trị hệ thống
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-800 mt-4">
            <p className="px-3 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-600">
              Điều hướng
            </p>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              Quay lại App
            </Link>
          </div>
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t border-slate-800">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold text-white truncate">{user.fullName}</p>
              <p className="text-[10px] text-slate-500 font-medium truncate">{user.email}</p>
            </div>
            <button
              onClick={() => void logoutUser()}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition shrink-0"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-sm px-6 flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Admin
            </span>
            {title ? (
              <>
                <span className="text-slate-700">/</span>
                <span className="text-sm font-extrabold text-white">{title}</span>
              </>
            ) : null}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="rounded-full bg-blue-600/10 border border-blue-600/30 px-3 py-1 text-[11px] font-extrabold text-blue-400">
              🛡️ Quản trị viên hệ thống
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950">{children}</main>
      </div>
    </div>
  );
}
