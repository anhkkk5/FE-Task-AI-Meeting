"use client";

import Link from "next/link";
import { useParams, useRouter, usePathname } from "next/navigation";
import { ReactNode, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";

type AppShellProps = {
  children: ReactNode;
  workspaceId?: string;
  projectId?: string;
  title?: string;
};

export function AppShell({ children, workspaceId, projectId, title }: AppShellProps) {
  const { user, isLoading, logoutUser } = useAuth(true);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const activeWorkspaceId = workspaceId || (params.workspaceId as string);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Load danh sách workspaces để hiển thị ở Sidebar
  const loadWorkspaces = useCallback(async () => {
    try {
      const res = await getMyWorkspaces("ACTIVE");
      setWorkspaces(res.data.items);
      
      if (activeWorkspaceId) {
        const current = res.data.items.find(w => w.id === activeWorkspaceId);
        if (current) setCurrentWorkspace(current);
      }
    } catch (error) {
      console.error("Load workspaces error:", error);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (user) {
      void loadWorkspaces();
    }
  }, [user, loadWorkspaces]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
          <p className="text-sm font-medium text-zinc-600">Đang tải ứng dụng...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userInitial = user.fullName ? user.fullName.charAt(0).toUpperCase() : "U";

  // Tạo breadcrumbs điều hướng động
  const breadcrumbs = [
    { label: "Workspaces", href: "/workspaces" }
  ];

  if (pathname === "/profile") {
    breadcrumbs.push({
      label: "Trang cá nhân",
      href: "/profile"
    });
  }

  if (currentWorkspace) {
    breadcrumbs.push({
      label: currentWorkspace.name,
      href: `/workspaces/${currentWorkspace.id}`
    });
  }

  if (projectId) {
    breadcrumbs.push({
      label: "Projects",
      href: `/workspaces/${activeWorkspaceId}/projects`
    });
    breadcrumbs.push({
      label: title || "Project Detail",
      href: `/workspaces/${activeWorkspaceId}/projects/${projectId}`
    });
    if (pathname.includes("/sprints")) {
      breadcrumbs.push({
        label: "Sprints",
        href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/sprints`
      });
    }
    if (pathname.includes("/tasks")) {
      breadcrumbs.push({
        label: "Tasks",
        href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/tasks`
      });
    }
    if (pathname.includes("/daily-updates")) {
      breadcrumbs.push({
        label: "Daily Updates",
        href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/daily-updates/me`
      });
    }
    if (pathname.includes("/meetings")) {
      breadcrumbs.push({
        label: "Meetings",
        href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/meetings`
      });
    }
    if (pathname.includes("/board")) {
      breadcrumbs.push({
        label: "Board",
        href: pathname
      });
    }
  } else if (pathname.includes("/members")) {
    breadcrumbs.push({
      label: "Members",
      href: `/workspaces/${activeWorkspaceId}/members`
    });
  } else if (pathname.includes("/settings")) {
    breadcrumbs.push({
      label: "Settings",
      href: `/workspaces/${activeWorkspaceId}/settings`
    });
  } else if (pathname.includes("/projects")) {
    breadcrumbs.push({
      label: "Projects",
      href: `/workspaces/${activeWorkspaceId}/projects`
    });
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-50 text-zinc-950 font-sans">
      {/* SIDEBAR (Jira style) */}
      <aside className="hidden w-64 flex-col bg-zinc-50 text-zinc-600 md:flex border-r border-zinc-200 shrink-0 select-none shadow-sm">
        {/* Brand Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-zinc-200 bg-white/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-black shadow-md shadow-blue-500/25">
            A
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-900 tracking-wide leading-none">Agile AI</h1>
            <span className="text-[10px] text-blue-600 font-bold tracking-wider uppercase mt-0.5 block">Project Manager</span>
          </div>
        </div>

        {/* Workspace Selector */}
        <div className="px-4 py-4 border-b border-zinc-200/50 bg-white/20">
          <label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 px-2 block mb-1.5">
            Không gian làm việc
          </label>
          <div className="relative">
            <select
              className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 pr-8 text-xs font-semibold text-zinc-700 outline-none appearance-none cursor-pointer hover:border-zinc-300 transition shadow-sm"
              value={activeWorkspaceId || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "create") {
                  router.push("/workspaces/create");
                } else if (val) {
                  router.push(`/workspaces/${val}`);
                }
              }}
            >
              <option value="" disabled>-- Chọn Workspace --</option>
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
              <option value="create">+ Tạo Workspace mới...</option>
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 space-y-1 px-2.5 py-3 overflow-y-auto">
          {activeWorkspaceId ? (
            <>
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 px-3 block pt-1 pb-1.5">
                Quản lý dự án
              </label>
              <Link
                href={`/workspaces/${activeWorkspaceId}`}
                className={`flex h-9 items-center gap-3 rounded-lg px-3 text-xs font-semibold transition-all ${
                  pathname === `/workspaces/${activeWorkspaceId}`
                    ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 rounded-l-none"
                    : "hover:bg-zinc-100/70 text-zinc-600 hover:text-zinc-950"
                }`}
              >
                <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
                Tổng quan
              </Link>
              <Link
                href={`/workspaces/${activeWorkspaceId}/projects`}
                className={`flex h-9 items-center gap-3 rounded-lg px-3 text-xs font-semibold transition-all ${
                  pathname.includes("/projects")
                    ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 rounded-l-none"
                    : "hover:bg-zinc-100/70 text-zinc-600 hover:text-zinc-950"
                }`}
              >
                <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Dự án (Projects)
              </Link>
              <Link
                href={`/workspaces/${activeWorkspaceId}/members`}
                className={`flex h-9 items-center gap-3 rounded-lg px-3 text-xs font-semibold transition-all ${
                  pathname.includes("/members")
                    ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 rounded-l-none"
                    : "hover:bg-zinc-100/70 text-zinc-600 hover:text-zinc-950"
                }`}
              >
                <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Thành viên
              </Link>
              <Link
                href={`/workspaces/${activeWorkspaceId}/settings`}
                className={`flex h-9 items-center gap-3 rounded-lg px-3 text-xs font-semibold transition-all ${
                  pathname.includes("/settings")
                    ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 rounded-l-none"
                    : "hover:bg-zinc-100/70 text-zinc-600 hover:text-zinc-950"
                }`}
              >
                <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Cài đặt Workspace
              </Link>
            </>
          ) : null}

          <label className="text-[9px] font-extrabold uppercase tracking-widest text-zinc-400 px-3 block pt-5 pb-1.5">
            Tổng quan hệ thống
          </label>
          <Link
            href="/workspaces"
            className={`flex h-9 items-center gap-3 rounded-lg px-3 text-xs font-semibold transition-all ${
              pathname === "/workspaces"
                ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 rounded-l-none"
                : "hover:bg-zinc-100/70 text-zinc-600 hover:text-zinc-950"
            }`}
          >
            <svg className="h-4.5 w-4.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Tất cả Workspaces
          </Link>
        </nav>

        {/* User Info (Bottom) */}
        <div className="border-t border-zinc-200 p-4 bg-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-8 w-8 shrink-0 rounded-full object-cover border border-zinc-200 shadow-sm"
              />
            ) : (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold text-xs shadow-inner">
                {userInitial}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-zinc-800">{user.fullName}</p>
              <p className="truncate text-[10px] text-zinc-500">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => void logoutUser()}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-zinc-200/60 text-zinc-500 hover:text-zinc-900 transition"
            title="Đăng xuất"
          >
            <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white/80 backdrop-blur-md px-6 shadow-sm z-10">
          {/* Breadcrumbs / Page Title */}
          <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            {breadcrumbs.map((crumb, idx) => (
              <span key={crumb.href} className="flex items-center gap-2">
                {idx > 0 && (
                  <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="font-semibold text-zinc-900">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-zinc-900 transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </div>

          {/* Header Actions & Profile */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 rounded-full p-1 hover:bg-zinc-100 transition outline-none"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm">
                    {userInitial}
                  </div>
                )}
                <span className="hidden text-xs font-semibold text-zinc-700 md:inline">
                  {user.fullName}
                </span>
                <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg shadow-zinc-100/80 z-50">
                  <div className="border-b border-zinc-100 px-4 py-2 text-xs">
                    <p className="font-semibold text-zinc-900">{user.fullName}</p>
                    <p className="text-zinc-500 break-all">{user.email}</p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition border-b border-zinc-100"
                  >
                    <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Trang cá nhân
                  </Link>
                  <button
                    onClick={() => void logoutUser()}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* PROJECT SUB-HEADER (Jira style) */}
        {projectId && activeWorkspaceId && (
          <div className="bg-white border-b border-zinc-200 px-6 pt-5 pb-0 shrink-0 shadow-sm z-0">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/10">
                  {title ? title.charAt(0).toUpperCase() : "P"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-900 leading-tight">{title || "Dự án"}</h2>
                    <span className="inline-block rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 font-mono">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-medium font-mono mt-0.5">Project ID: {projectId}</p>
                </div>
              </div>
            </div>
            
            {/* Tab Bar Navigation */}
            <div className="flex gap-6 text-xs font-semibold text-zinc-500">
              <Link
                href={`/workspaces/${activeWorkspaceId}/projects/${projectId}`}
                className={`pb-3.5 border-b-2 transition-all ${
                  pathname === `/workspaces/${activeWorkspaceId}/projects/${projectId}`
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent hover:text-zinc-950 hover:border-zinc-300"
                }`}
              >
                Chi tiết
              </Link>
              <Link
                href={`/workspaces/${activeWorkspaceId}/projects/${projectId}/sprints`}
                className={`pb-3.5 border-b-2 transition-all ${
                  pathname.includes("/sprints")
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent hover:text-zinc-950 hover:border-zinc-300"
                }`}
              >
                Backlog
              </Link>
              <Link
                href={`/workspaces/${activeWorkspaceId}/projects/${projectId}/tasks`}
                className={`pb-3.5 border-b-2 transition-all ${
                  pathname.includes("/tasks") && !pathname.includes("/sprints")
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent hover:text-zinc-950 hover:border-zinc-300"
                }`}
              >
                Bảng công việc (Board)
              </Link>
              <Link
                href={`/workspaces/${activeWorkspaceId}/projects/${projectId}/daily-updates/me`}
                className={`pb-3.5 border-b-2 transition-all ${
                  pathname.includes("/daily-updates")
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent hover:text-zinc-950 hover:border-zinc-300"
                }`}
              >
                Daily Updates
              </Link>
              <Link
                href={`/workspaces/${activeWorkspaceId}/projects/${projectId}/meetings`}
                className={`pb-3.5 border-b-2 transition-all ${
                  pathname.includes("/meetings")
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent hover:text-zinc-950 hover:border-zinc-300"
                }`}
              >
                Meetings
              </Link>
              <Link
                href={`/workspaces/${activeWorkspaceId}/members`}
                className={`pb-3.5 border-b-2 transition-all ${
                  pathname.includes("/members")
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent hover:text-zinc-950 hover:border-zinc-300"
                }`}
              >
                Thành viên Workspace
              </Link>
              <Link
                href={`/workspaces/${activeWorkspaceId}/projects/${projectId}/settings`}
                className={`pb-3.5 border-b-2 transition-all ${
                  pathname.includes("/settings")
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent hover:text-zinc-950 hover:border-zinc-300"
                }`}
              >
                Cài đặt dự án
              </Link>
            </div>
          </div>
        )}

        {/* CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-zinc-50/50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
