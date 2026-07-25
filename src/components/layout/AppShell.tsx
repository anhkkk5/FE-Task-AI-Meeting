"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Boxes,
  FolderKanban,
  CheckSquare,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronDown,
  User as UserIcon
} from "lucide-react";
import { ProjectAssistantChatbot } from "@/features/project-assistant/components/ProjectAssistantChatbot";
import { getHandovers } from "@/features/shift-handovers/api/shift-handovers.api";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

type AppShellProps = {
  children: ReactNode;
  workspaceId?: string;
  projectId?: string;
  title?: string;
};

const LAST_WORKSPACE_KEY = "agile_ai_last_active_workspace_id";

export function AppShell({
  children,
  workspaceId,
  projectId,
  title,
}: AppShellProps) {
  const { user, isLoading, logoutUser } = useAuth(true);
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const routeWorkspaceId = workspaceId || (params.workspaceId as string);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>("");
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [pendingHandovers, setPendingHandovers] = useState(0);

  // Load Workspaces and resolve active workspace ID
  const loadWorkspaces = useCallback(async () => {
    try {
      const res = await getMyWorkspaces("ACTIVE");
      const items = res.data.items;
      setWorkspaces(items);

      let targetId = routeWorkspaceId;

      if (!targetId && typeof window !== "undefined") {
        const savedId = localStorage.getItem(LAST_WORKSPACE_KEY);
        if (savedId && items.some((item) => item.id === savedId)) {
          targetId = savedId;
        } else if (items.length > 0) {
          targetId = items[0].id;
        }
      }

      if (targetId) {
        setSelectedWorkspaceId(targetId);
        const current = items.find((workspace) => workspace.id === targetId);
        setCurrentWorkspace(current ?? null);

        if (typeof window !== "undefined") {
          localStorage.setItem(LAST_WORKSPACE_KEY, targetId);
        }
      }
    } catch (error) {
      console.error("Load workspaces error:", error);
    }
  }, [routeWorkspaceId]);

  useEffect(() => {
    if (user) {
      void loadWorkspaces();
    }
  }, [user, loadWorkspaces]);

  const activeWorkspaceId = routeWorkspaceId || selectedWorkspaceId;

  useEffect(() => {
    if (!user || !activeWorkspaceId || !projectId) {
      setPendingHandovers(0);
      return;
    }

    let cancelled = false;
    getHandovers(activeWorkspaceId, projectId, {
      memberId: user.id,
      status: "PENDING",
      page: 1,
      limit: 100,
    })
      .then((response) => {
        if (cancelled) return;
        const received = response.data.items.filter(
          (handover) => handover.receiverId === user.id,
        );
        setPendingHandovers(received.length);
      })
      .catch(() => {
        if (!cancelled) setPendingHandovers(0);
      });

    return () => {
      cancelled = true;
    };
  }, [activeWorkspaceId, projectId, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">
            Đang tải ứng dụng...
          </p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userInitial = user.fullName
    ? user.fullName.charAt(0).toUpperCase()
    : "U";

  // Breadcrumbs calculation
  const breadcrumbs = [{ label: "Workspaces", href: "/workspaces" }];

  if (pathname === "/profile") {
    breadcrumbs.push({ label: "Trang cá nhân", href: "/profile" });
  }

  if (currentWorkspace) {
    breadcrumbs.push({
      label: currentWorkspace.name,
      href: `/workspaces/${currentWorkspace.id}`,
    });
  }

  if (projectId) {
    breadcrumbs.push({
      label: "Projects",
      href: `/workspaces/${activeWorkspaceId}/projects`,
    });
    breadcrumbs.push({
      label: title || "Project",
      href: `/workspaces/${activeWorkspaceId}/projects/${projectId}`,
    });

    const section = [
      ["/sprints", "Backlog"],
      ["/tasks", "Board"],
      ["/daily-updates", "Cập nhật hằng ngày"],
      ["/meetings", "Cuộc họp"],
      ["/shift-handovers", "Bàn giao"],
      ["/ai-reports", "Báo cáo AI"],
      ["/assistant", "Trợ lý dự án"],
    ].find(([segment]) => pathname.includes(segment));

    if (section) {
      breadcrumbs.push({
        label: section[1],
        href: pathname,
      });
    }
  } else if (pathname.includes("/members")) {
    breadcrumbs.push({
      label: "Thành viên",
      href: `/workspaces/${activeWorkspaceId}/members`,
    });
  } else if (pathname.includes("/settings")) {
    breadcrumbs.push({
      label: "Settings",
      href: `/workspaces/${activeWorkspaceId}/settings`,
    });
  } else if (pathname.includes("/projects")) {
    breadcrumbs.push({
      label: "Projects",
      href: `/workspaces/${activeWorkspaceId}/projects`,
    });
  }

  // Smart resolution for global navigation items
  const globalNavItems = [
    { 
      name: "Dashboard", 
      icon: LayoutDashboard, 
      href: "/dashboard", 
      active: pathname === "/dashboard" 
    },
    { 
      name: "Workspaces", 
      icon: Boxes, 
      href: "/workspaces", 
      active: pathname === "/workspaces" || pathname === "/workspaces/create"
    },
    { 
      name: "Projects", 
      icon: FolderKanban, 
      href: activeWorkspaceId ? `/workspaces/${activeWorkspaceId}/projects` : "/workspaces",
      active: pathname.includes("/projects") 
    },
    { 
      name: "Tasks", 
      icon: CheckSquare, 
      href: activeWorkspaceId && projectId 
        ? `/workspaces/${activeWorkspaceId}/projects/${projectId}/tasks` 
        : activeWorkspaceId 
        ? `/workspaces/${activeWorkspaceId}/projects` 
        : "/workspaces",
      active: pathname.includes("/tasks") 
    },
    { 
      name: "Calendar", 
      icon: Calendar, 
      href: activeWorkspaceId && projectId 
        ? `/workspaces/${activeWorkspaceId}/projects/${projectId}/meetings` 
        : activeWorkspaceId 
        ? `/workspaces/${activeWorkspaceId}/projects` 
        : "/workspaces",
      active: pathname.includes("/meetings") 
    },
    { 
      name: "Teams", 
      icon: Users, 
      href: activeWorkspaceId ? `/workspaces/${activeWorkspaceId}/members` : "/workspaces",
      active: pathname.includes("/members") 
    },
    { 
      name: "Reports", 
      icon: BarChart3, 
      href: activeWorkspaceId && projectId 
        ? `/workspaces/${activeWorkspaceId}/projects/${projectId}/ai-reports/personal` 
        : activeWorkspaceId 
        ? `/workspaces/${activeWorkspaceId}/projects` 
        : "/workspaces",
      active: pathname.includes("/ai-reports") 
    },
    { 
      name: "Settings", 
      icon: Settings, 
      href: activeWorkspaceId ? `/workspaces/${activeWorkspaceId}/settings` : "/profile",
      active: pathname.includes("/settings") || pathname === "/profile" 
    },
  ];

  // Project Tabs (if inside a specific Project)
  const projectTabs =
    projectId && activeWorkspaceId
      ? [
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}`,
            label: "Chi tiết",
            active: pathname === `/workspaces/${activeWorkspaceId}/projects/${projectId}`,
          },
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/sprints`,
            label: "Backlog",
            active: pathname.includes("/sprints"),
          },
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/tasks`,
            label: "Board",
            active: pathname.includes("/tasks") && !pathname.includes("/sprints"),
          },
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/daily-updates/me`,
            label: "Cập nhật hằng ngày",
            active: pathname.includes("/daily-updates"),
          },
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/meetings`,
            label: "Cuộc họp",
            active: pathname.includes("/meetings"),
          },
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/shift-handovers`,
            label: "Bàn giao",
            active: pathname.includes("/shift-handovers"),
            badge: pendingHandovers,
          },
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/ai-reports/personal`,
            label: "Báo cáo AI",
            active: pathname.includes("/ai-reports"),
          },
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/assistant`,
            label: "Trợ lý dự án",
            active: pathname.includes("/assistant"),
          },
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/settings`,
            label: "Cài đặt dự án",
            active: pathname.includes("/settings"),
          },
        ]
      : [];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] font-sans text-slate-800 selection:bg-blue-500 selection:text-white">
      {/* Sidebar - Matching Nexus Enterprise Dashboard Style */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white md:flex justify-between">
        <div className="flex flex-col min-h-0 overflow-y-auto">
          {/* Brand Logo Header */}
          <div className="p-6 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  Nexus Enterprise
                </h1>
                <p className="text-[11px] font-medium text-slate-400">
                  Agile Workspace
                </p>
              </div>
            </Link>
          </div>

          {/* Active Workspace Switcher */}
          <div className="p-3 border-b border-slate-100">
            <label className="mb-1 block px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Không gian làm việc
            </label>
            <select
              className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-xs font-semibold text-slate-800 outline-none hover:bg-slate-100 focus:bg-white focus:border-blue-500 transition cursor-pointer"
              value={activeWorkspaceId || ""}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "create") {
                  router.push("/workspaces/create");
                } else if (value) {
                  setSelectedWorkspaceId(value);
                  if (typeof window !== "undefined") {
                    localStorage.setItem(LAST_WORKSPACE_KEY, value);
                  }
                  router.push(`/workspaces/${value}`);
                }
              }}
            >
              <option value="" disabled>
                Chọn Workspace
              </option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
              <option value="create">+ Tạo Workspace mới</option>
            </select>
          </div>

          {/* Main Sidebar Navigation Menu */}
          <nav className="p-3 space-y-1">
            {globalNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition duration-150 ${
                    item.active
                      ? "bg-blue-50 text-blue-600 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${item.active ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Bar at bottom of sidebar */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition">
            <Link href="/profile" className="flex items-center gap-2.5 min-w-0 flex-1">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-800">
                  {user.fullName}
                </p>
                <p className="truncate text-[10px] text-slate-400 font-medium">
                  {user.email}
                </p>
              </div>
            </Link>
            <button
              onClick={() => void logoutUser()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
              title="Đăng xuất"
              type="button"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Right Content Section */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 border-b border-slate-200/80 bg-white px-6 flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden lg:flex items-center w-full max-w-sm">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search tasks, people, or projects..."
                className="w-full h-9 pl-9 pr-4 rounded-xl bg-slate-100/80 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition border border-transparent"
              />
            </div>

            {/* Breadcrumbs Navigation */}
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500 font-medium">
              {breadcrumbs.map((crumb, index) => (
                <span
                  key={`${crumb.href}-${index}`}
                  className="flex min-w-0 items-center gap-1.5"
                >
                  {index > 0 ? <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" /> : null}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="truncate font-bold text-slate-900">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="truncate hover:text-blue-600 transition"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Right Action Icons & User Dropdown */}
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </button>

            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition">
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="h-6 w-[1px] bg-slate-200 mx-1" />

            <div className="relative">
              <button
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition"
                onClick={() => setShowUserDropdown((value) => !value)}
                type="button"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {userInitial}
                  </div>
                )}
                <span className="hidden max-w-32 truncate text-xs font-bold text-slate-700 md:inline">
                  {user.fullName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserDropdown ? (
                <div className="absolute right-0 z-50 mt-2 w-56 rounded-2xl border border-slate-100 bg-white py-1.5 shadow-xl shadow-slate-900/10">
                  <div className="border-b border-slate-100 px-4 py-2.5">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {user.fullName}
                    </p>
                    <p className="truncate text-[11px] text-slate-400 font-medium">
                      {user.email}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    Trang cá nhân
                  </Link>
                  <button
                    onClick={() => void logoutUser()}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                    type="button"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    Đăng xuất
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        {/* Project Sub-navigation Tabs (If active project) */}
        {projectId && activeWorkspaceId ? (
          <section className="shrink-0 border-b border-slate-200/80 bg-white">
            <div className="px-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm shadow-blue-500/20">
                  {title ? title.charAt(0).toUpperCase() : "P"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-extrabold text-slate-900">
                      {title || "Dự án"}
                    </h2>
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-blue-600 border border-blue-100">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-1 overflow-x-auto px-6">
              {projectTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`whitespace-nowrap border-b-2 px-3.5 py-2.5 text-xs font-bold transition ${
                    tab.active
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-slate-500 hover:bg-slate-800"
                  }`}
                >
                  {tab.label}
                  {tab.badge ? (
                    <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto bg-[#f8fafc] p-6">
          {children}
        </main>
      </div>

      <ProjectAssistantChatbot
        workspaceId={activeWorkspaceId}
        projectId={projectId}
      />
    </div>
  );
}
