"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Boxes,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Radio,
  Search,
  Settings,
  Sparkles,
  User as UserIcon,
  Users,
} from "lucide-react";
import { getMeetings } from "@/features/meetings/api/meetings.api";
import { getMyWork } from "@/features/my-work/api/my-work.api";
import { ProjectAssistantChatbot } from "@/features/project-assistant/components/ProjectAssistantChatbot";
import { getHandovers } from "@/features/shift-handovers/api/shift-handovers.api";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils/relative-time";

type AppShellProps = {
  children: ReactNode;
  workspaceId?: string;
  projectId?: string;
  title?: string;
};

type RealNotification = {
  id: string;
  title: string;
  description: string;
  link: string;
  timestamp?: string | null;
  type: "task" | "handover" | "meeting";
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [realNotifications, setRealNotifications] = useState<RealNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [pendingHandovers, setPendingHandovers] = useState(0);

  const loadWorkspaces = useCallback(async () => {
    try {
      const res = await getMyWorkspaces("ACTIVE");
      setWorkspaces(res.data.items);
    } catch (error) {
      console.error("Load workspaces error:", error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      void loadWorkspaces();
    }
  }, [user, loadWorkspaces]);

  const activeWorkspaceId = routeWorkspaceId ?? "";

  const currentWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null,
    [workspaces, activeWorkspaceId],
  );

  useEffect(() => {
    if (activeWorkspaceId && typeof window !== "undefined") {
      localStorage.setItem(LAST_WORKSPACE_KEY, activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  // Load REAL notification items dynamically for current user
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    const notifs: RealNotification[] = [];

    try {
      // 1. Fetch user's assigned tasks
      const myWork = await getMyWork(user.id);
      myWork.tasks.slice(0, 4).forEach((t) => {
        notifs.push({
          id: `task-${t.id}`,
          title: "Phân công công việc",
          description: `[${t.projectKeyCode || "PRJ"}] ${t.title} (${t.projectName || "Dự án"})`,
          link: `/workspaces/${t.workspaceId}/projects/${t.projectId}/tasks`,
          timestamp: t.createdAt,
          type: "task",
        });
      });

      // 2. Fetch pending handovers if inside project
      if (activeWorkspaceId && projectId) {
        const handoversRes = await getHandovers(activeWorkspaceId, projectId, {
          memberId: user.id,
          status: "PENDING",
          limit: 5,
        });

        const received = handoversRes.data.items.filter(
          (h) => h.receiverId === user.id,
        );
        setPendingHandovers(received.length);

        received.forEach((h) => {
          notifs.push({
            id: `handover-${h.id}`,
            title: "Yêu cầu bàn giao ca mới",
            description: `Bạn có yêu cầu bàn giao ca cần xác nhận từ đồng nghiệp`,
            link: `/workspaces/${activeWorkspaceId}/projects/${projectId}/shift-handovers`,
            timestamp: h.createdAt,
            type: "handover",
          });
        });

        // 3. Fetch upcoming meetings
        const meetingsRes = await getMeetings(activeWorkspaceId, projectId, {
          limit: 3,
        });

        meetingsRes.data.items.forEach((m) => {
          notifs.push({
            id: `meeting-${m.id}`,
            title: "Cuộc họp sắp diễn ra",
            description: `${m.title} - Ngày: ${m.meetingDate}`,
            link: `/workspaces/${activeWorkspaceId}/projects/${projectId}/meetings/${m.id}`,
            timestamp: m.startTime,
            type: "meeting",
          });
        });
      }
    } catch {
      // ignore
    }

    setRealNotifications(notifs);
  }, [user, activeWorkspaceId, projectId]);

  useEffect(() => {
    if (user) {
      void loadNotifications();
    }
  }, [user, loadNotifications]);

  const unreadCount = useMemo(() => {
    return realNotifications.filter((n) => !readIds.has(n.id)).length;
  }, [realNotifications, readIds]);

  const handleNotificationClick = (item: RealNotification) => {
    setReadIds((prev) => new Set(prev).add(item.id));
    setShowNotificationDropdown(false);
    router.push(item.link);
  };

  const handleMarkAllRead = () => {
    const allIds = new Set(realNotifications.map((n) => n.id));
    setReadIds(allIds);
  };

  if (isLoading && !user) {
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

  const breadcrumbs: { label: string; href: string }[] = [];

  if (pathname.startsWith("/dashboard")) {
    breadcrumbs.push({ label: "Dashboard", href: "/dashboard" });
  } else if (pathname.startsWith("/my-work")) {
    breadcrumbs.push({ label: "Văn phòng của tôi", href: "/my-work" });
  } else if (pathname.startsWith("/workspaces")) {
    breadcrumbs.push({ label: "Workspaces", href: "/workspaces" });

    if (currentWorkspace) {
      breadcrumbs.push({
        label: currentWorkspace.name,
        href: `/workspaces/${currentWorkspace.id}`,
      });
    }

    if (projectId) {
      breadcrumbs.push({
        label: title ?? "Dự án",
        href: activeWorkspaceId
          ? `/workspaces/${activeWorkspaceId}/projects/${projectId}`
          : "#",
      });
    }

    if (pathname.includes("/members")) {
      breadcrumbs.push({ label: "Thành viên", href: "#" });
    } else if (pathname.includes("/sprints")) {
      breadcrumbs.push({ label: "Backlog", href: "#" });
    } else if (pathname.includes("/tasks")) {
      breadcrumbs.push({ label: "Board", href: "#" });
    } else if (pathname.includes("/analytics")) {
      breadcrumbs.push({ label: "Thống kê & Biểu đồ", href: "#" });
    } else if (pathname.includes("/meetings")) {
      breadcrumbs.push({ label: "Cuộc họp", href: "#" });
    } else if (pathname.includes("/settings")) {
      breadcrumbs.push({ label: "Cài đặt", href: "#" });
    }
  }

  const workspaceNavItems = activeWorkspaceId
    ? [
        {
          name: "Tổng quan",
          icon: LayoutDashboard,
          href: `/workspaces/${activeWorkspaceId}`,
          active: pathname === `/workspaces/${activeWorkspaceId}`,
        },
        {
          name: "Dự án",
          icon: FolderKanban,
          href: `/workspaces/${activeWorkspaceId}/projects`,
          active: pathname.includes("/projects"),
        },
        {
          name: "Thành viên",
          icon: Users,
          href: `/workspaces/${activeWorkspaceId}/members`,
          active: pathname.includes("/members"),
        },
        {
          name: "Cài đặt",
          icon: Settings,
          href: `/workspaces/${activeWorkspaceId}/settings`,
          active:
            pathname === `/workspaces/${activeWorkspaceId}/settings` ||
            (pathname.includes("/settings") && !projectId),
        },
      ]
    : [];

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
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/analytics`,
            label: "Thống kê & Biểu đồ",
            active: pathname.includes("/analytics"),
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
            active:
              pathname === `/workspaces/${activeWorkspaceId}/projects/${projectId}/settings`,
          },
        ]
      : [];

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc]">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 z-20">
        <div>
          {/* Top Logo */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 font-black text-base">
                ✨
              </div>
              <span className="font-black text-slate-900 text-lg tracking-tight">
                AgileFlow AI
              </span>
            </Link>
          </div>

          {/* Workspace Selector Dropdown */}
          <div className="p-3">
            <div className="relative">
              <span className="block px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Không gian làm việc
              </span>
              <select
                value={activeWorkspaceId}
                onChange={(e) => {
                  const wsId = e.target.value;
                  if (wsId) {
                    router.push(`/workspaces/${wsId}`);
                  } else {
                    router.push("/workspaces");
                  }
                }}
                className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-bold text-slate-800 outline-none hover:bg-slate-50 focus:border-blue-500 transition cursor-pointer appearance-none truncate"
              >
                <option value="">Chưa chọn workspace</option>
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 bottom-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Main Navigation Links */}
          <nav className="px-3 space-y-1">
            <Link
              href="/dashboard"
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                pathname === "/dashboard"
                  ? "bg-blue-50 text-blue-600 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className={`w-4 h-4 ${pathname === "/dashboard" ? "text-blue-600" : "text-slate-400"}`} />
              <span>Dashboard</span>
            </Link>

            <Link
              href="/my-work"
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                pathname === "/my-work"
                  ? "bg-blue-50 text-blue-600 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <CheckSquare className={`w-4 h-4 ${pathname === "/my-work" ? "text-blue-600" : "text-slate-400"}`} />
              <span>Việc của tôi</span>
            </Link>

            <Link
              href="/workspaces"
              className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                pathname === "/workspaces" && !activeWorkspaceId
                  ? "bg-blue-50 text-blue-600 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Boxes className={`w-4 h-4 ${pathname === "/workspaces" && !activeWorkspaceId ? "text-blue-600" : "text-slate-400"}`} />
              <span>Workspaces</span>
            </Link>

            {/* Admin link - only for System Admins */}
            {user.isSystemAdmin ? (
              <Link
                href="/admin"
                className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                  pathname.startsWith("/admin")
                    ? "bg-blue-50 text-blue-600 font-bold shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Sparkles className={`w-4 h-4 ${pathname.startsWith("/admin") ? "text-blue-600" : "text-slate-400"}`} />
                <span className="flex items-center gap-1.5">
                  Quản trị hệ thống
                  <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[9px] font-black text-white leading-none">
                    ADMIN
                  </span>
                </span>
              </Link>
            ) : null}
          </nav>

          {/* Workspace Specific Subnav */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            {activeWorkspaceId ? (
              <nav className="px-3 pb-3 space-y-1">
                <p className="mb-1 px-4 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 truncate">
                  {currentWorkspace?.name ?? "Workspace"}
                </p>
                {workspaceNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                        item.active
                          ? "bg-blue-50 text-blue-600 font-bold shadow-2xs"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${item.active ? "text-blue-600" : "text-slate-400"}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            ) : null}
          </div>
        </div>

        {/* User Profile Bar at bottom */}
        <div className="p-3 border-t border-slate-100">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-50/80 border border-slate-200/60">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-slate-900 truncate">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={() => void logoutUser()}
              className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Right Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4 min-w-0">
            {/* Search Input */}
            <div className="relative hidden md:flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm dự án, công việc...  ⌘ K"
                className="h-10 w-72 pl-9 pr-12 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>

            {/* Breadcrumbs */}
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-slate-500 font-medium">
              {breadcrumbs.map((crumb, index) => (
                <span
                  key={`${crumb.href}-${index}`}
                  className="flex min-w-0 items-center gap-1.5"
                >
                  {index > 0 ? <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" /> : null}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="truncate font-extrabold text-slate-900">
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

          {/* Right Notification Icon & User Menu */}
          <div className="flex items-center gap-3">
            {/* Notification Bell Dropdown (Thông báo Thật & Bấm vào Nhảy Trang) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowNotificationDropdown((prev) => !prev);
                  setShowUserDropdown(false);
                }}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition active:scale-95"
                title="Thông báo hệ thống"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 ? (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[9px] font-black text-white ring-2 ring-white">
                    {unreadCount}
                  </span>
                ) : null}
              </button>

              {/* Notification Popover Drawer */}
              {showNotificationDropdown ? (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-xl ring-1 ring-slate-900/5 z-50 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900">
                        Thông báo hệ thống
                      </h4>
                      {unreadCount > 0 ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-extrabold text-blue-600 border border-blue-100">
                          {unreadCount} chưa đọc
                        </span>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Đã đọc tất cả
                    </button>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs">
                    {realNotifications.length === 0 ? (
                      <div className="py-6 text-center text-slate-400 font-medium">
                        Chưa có thông báo nào.
                      </div>
                    ) : (
                      realNotifications.map((notif) => {
                        const isRead = readIds.has(notif.id);

                        return (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`group rounded-2xl border p-3 space-y-1 transition cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 ${
                              isRead
                                ? "border-slate-100 bg-white opacity-70"
                                : "border-blue-100 bg-blue-50/40"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    isRead ? "bg-slate-300" : "bg-blue-600 animate-pulse"
                                  }`}
                                />
                                {notif.title}
                              </span>
                              {notif.timestamp ? (
                                <span className="text-[10px] text-slate-400 font-semibold">
                                  {formatDate(notif.timestamp)}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-slate-600 font-medium leading-relaxed">
                              {notif.description}
                            </p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="h-6 w-[1px] bg-slate-200 mx-1" />

            <div className="relative">
              <button
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition"
                onClick={() => {
                  setShowUserDropdown((value) => !value);
                  setShowNotificationDropdown(false);
                }}
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
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center">
                    {userInitial}
                  </div>
                )}
                <span className="text-xs font-extrabold text-slate-900 hidden sm:inline-block">
                  {user.fullName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Menu Popover */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-xl ring-1 ring-slate-900/5 z-50 space-y-1">
                  <div className="p-2 border-b border-slate-100">
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/my-work"
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 transition"
                  >
                    <UserIcon className="w-4 h-4 text-slate-400" />
                    Hồ sơ & Việc của tôi
                  </Link>

                  <button
                    onClick={() => void logoutUser()}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 rounded-xl hover:bg-rose-50 transition text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Project Specific Subnav Tabs */}
        {projectTabs.length > 0 ? (
          <div className="bg-white border-b border-slate-200/80 px-6 shrink-0 z-0">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {projectTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`relative py-3.5 px-3 text-xs font-extrabold transition whitespace-nowrap ${
                    tab.active
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    {tab.label}
                    {tab.badge ? (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white">
                        {tab.badge}
                      </span>
                    ) : null}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {/* Floating AI Assistant Chatbot */}
      {activeWorkspaceId && projectId ? (
        <ProjectAssistantChatbot
          workspaceId={activeWorkspaceId}
          projectId={projectId}
        />
      ) : null}
    </div>
  );
}
