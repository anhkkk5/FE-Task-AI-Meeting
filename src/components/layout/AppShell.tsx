"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useCallback, useEffect, useState } from "react";
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

type NavIcon =
  | "grid"
  | "board"
  | "people"
  | "settings"
  | "box"
  | "search"
  | "plus"
  | "profile"
  | "logout";

type NavLinkItem = {
  href: string;
  label: string;
  icon: NavIcon;
  active: boolean;
};

function Icon({
  name,
  className = "h-4 w-4",
}: {
  name: NavIcon;
  className?: string;
}) {
  const common = {
    className,
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "grid":
      return (
        <svg {...common}>
          <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
        </svg>
      );
    case "board":
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      );
    case "people":
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.36.16.74.24 1.13.24H21a2 2 0 1 1 0 4h-.09A1.65 1.65 0 0 0 19.4 15Z" />
        </svg>
      );
    case "box":
      return (
        <svg {...common}>
          <path d="M3 7.5 12 3l9 4.5-9 4.5L3 7.5Z" />
          <path d="M3 7.5v9L12 21l9-4.5v-9M12 12v9" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );
    case "plus":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5M21 12H9" />
        </svg>
      );
  }
}

function SidebarLink({ item }: { item: NavLinkItem }) {
  return (
    <Link
      href={item.href}
      className={`flex h-9 items-center gap-3 border-l-2 px-3 text-sm transition ${
        item.active
          ? "border-[#0c66e4] bg-[#e9f2ff] font-semibold text-[#0c66e4]"
          : "border-transparent text-[#44546f] hover:bg-[#f1f2f4] hover:text-[#172b4d]"
      }`}
    >
      <Icon name={item.icon} className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function Chevron() {
  return (
    <svg
      className="h-4 w-4 text-[#7a869a]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="m9 5 7 7-7 7"
      />
    </svg>
  );
}

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
  const activeWorkspaceId = workspaceId || (params.workspaceId as string);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(
    null,
  );
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [pendingHandovers, setPendingHandovers] = useState(0);

  const loadWorkspaces = useCallback(async () => {
    try {
      const res = await getMyWorkspaces("ACTIVE");
      setWorkspaces(res.data.items);

      if (activeWorkspaceId) {
        const current = res.data.items.find(
          (workspace) => workspace.id === activeWorkspaceId,
        );
        setCurrentWorkspace(current ?? null);
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
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f9]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#0c66e4] border-t-transparent" />
          <p className="text-sm font-medium text-[#44546f]">
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

  const workspaceLinks: NavLinkItem[] = activeWorkspaceId
    ? [
        {
          href: `/workspaces/${activeWorkspaceId}`,
          label: "Tổng quan",
          icon: "grid",
          active: pathname === `/workspaces/${activeWorkspaceId}`,
        },
        {
          href: `/workspaces/${activeWorkspaceId}/projects`,
          label: "Dự án",
          icon: "board",
          active: pathname.includes("/projects"),
        },
        {
          href: `/workspaces/${activeWorkspaceId}/members`,
          label: "Thành viên",
          icon: "people",
          active: pathname.includes("/members"),
        },
        {
          href: `/workspaces/${activeWorkspaceId}/settings`,
          label: "Cài đặt",
          icon: "settings",
          active: pathname.includes("/settings"),
        },
      ]
    : [];

  const projectTabs =
    projectId && activeWorkspaceId
      ? [
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}`,
            label: "Chi tiết",
            active:
              pathname ===
              `/workspaces/${activeWorkspaceId}/projects/${projectId}`,
          },
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/sprints`,
            label: "Backlog",
            active: pathname.includes("/sprints"),
          },
          {
            href: `/workspaces/${activeWorkspaceId}/projects/${projectId}/tasks`,
            label: "Board",
            active:
              pathname.includes("/tasks") && !pathname.includes("/sprints"),
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
    <div className="flex h-screen w-screen overflow-hidden bg-[#f7f8f9] font-sans text-[#172b4d]">
      <aside className="hidden w-[272px] shrink-0 flex-col border-r border-[#dfe1e6] bg-white md:flex">
        <div className="flex h-14 items-center gap-3 border-b border-[#dfe1e6] px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#0c66e4] text-sm font-bold text-white">
            A
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold text-[#172b4d]">
              Agile AI
            </h1>
            <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-[#0c66e4]">
              Project Manager
            </p>
          </div>
        </div>

        <div className="border-b border-[#dfe1e6] p-3">
          <label className="mb-1.5 block px-1 text-[11px] font-semibold uppercase tracking-wide text-[#6b778c]">
            Không gian làm việc
          </label>
          <select
            className="h-9 w-full rounded border border-[#dfe1e6] bg-white px-2 text-sm font-medium text-[#172b4d] outline-none hover:bg-[#f7f8f9] focus:border-[#0c66e4]"
            value={activeWorkspaceId || ""}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "create") {
                router.push("/workspaces/create");
              } else if (value) {
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

        <nav className="flex-1 overflow-y-auto py-3">
          {workspaceLinks.length > 0 ? (
            <>
              <p className="px-4 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-wide text-[#6b778c]">
                Quản lý dự án
              </p>
              <div className="space-y-0.5">
                {workspaceLinks.map((item) => (
                  <SidebarLink key={item.href} item={item} />
                ))}
              </div>
            </>
          ) : null}

          <p className="px-4 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-wide text-[#6b778c]">
            Tổng quan hệ thống
          </p>
          <SidebarLink
            item={{
              href: "/dashboard",
              label: "Dashboard",
              icon: "grid",
              active: pathname === "/dashboard",
            }}
          />
          <SidebarLink
            item={{
              href: "/workspaces",
              label: "Tất cả Workspaces",
              icon: "box",
              active: pathname === "/workspaces",
            }}
          />
        </nav>

        <div className="border-t border-[#dfe1e6] p-3">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/profile"
              className="flex min-w-0 flex-1 items-center gap-2 rounded px-1 py-1 hover:bg-[#f1f2f4]"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#deebff] text-sm font-bold text-[#0747a6]">
                  {userInitial}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#172b4d]">
                  {user.fullName}
                </p>
                <p className="truncate text-[11px] text-[#6b778c]">
                  {user.email}
                </p>
              </div>
            </Link>
            <button
              onClick={() => void logoutUser()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-[#6b778c] hover:bg-[#f1f2f4] hover:text-[#172b4d]"
              title="Đăng xuất"
              type="button"
            >
              <Icon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#dfe1e6] bg-white px-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="hidden h-9 w-full max-w-[520px] items-center gap-2 rounded border border-[#dfe1e6] bg-white px-3 text-sm text-[#6b778c] lg:flex">
              <Icon name="search" className="h-4 w-4" />
              <span>Tìm kiếm</span>
            </div>

            <div className="flex min-w-0 items-center gap-1 text-sm text-[#44546f] lg:ml-2">
              {breadcrumbs.map((crumb, index) => (
                <span
                  key={`${crumb.href}-${index}`}
                  className="flex min-w-0 items-center gap-1"
                >
                  {index > 0 ? <Chevron /> : null}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="truncate font-semibold text-[#172b4d]">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      className="truncate hover:text-[#0c66e4]"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="relative ml-3">
            <button
              className="flex items-center gap-2 rounded px-2 py-1 hover:bg-[#f1f2f4]"
              onClick={() => setShowUserDropdown((value) => !value)}
              type="button"
            >
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dcfff1] text-sm font-bold text-[#216e4e]">
                  {userInitial}
                </div>
              )}
              <span className="hidden max-w-32 truncate text-sm font-semibold text-[#44546f] md:inline">
                {user.fullName}
              </span>
              <svg
                className="h-4 w-4 text-[#6b778c]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m6 9 6 6 6-6"
                />
              </svg>
            </button>

            {showUserDropdown ? (
              <div className="absolute right-0 z-50 mt-2 w-64 rounded border border-[#dfe1e6] bg-white py-1 shadow-lg">
                <div className="border-b border-[#dfe1e6] px-3 py-2">
                  <p className="truncate text-sm font-semibold text-[#172b4d]">
                    {user.fullName}
                  </p>
                  <p className="truncate text-xs text-[#6b778c]">
                    {user.email}
                  </p>
                </div>
                <Link
                  href="/profile"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-[#44546f] hover:bg-[#f1f2f4]"
                >
                  <Icon name="profile" className="h-4 w-4" />
                  Trang cá nhân
                </Link>
                <button
                  onClick={() => void logoutUser()}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#ae2a19] hover:bg-[#fff4f2]"
                  type="button"
                >
                  <Icon name="logout" className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            ) : null}
          </div>
        </header>

        {projectId && activeWorkspaceId ? (
          <section className="shrink-0 border-b border-[#dfe1e6] bg-white">
            <div className="px-4 pt-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#0c66e4] text-sm font-bold text-white">
                  {title ? title.charAt(0).toUpperCase() : "P"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-xl font-semibold text-[#172b4d]">
                      {title || "Dự án"}
                    </h2>
                    <span className="rounded bg-[#f1f2f4] px-1.5 py-0.5 text-[11px] font-semibold uppercase text-[#44546f]">
                      Active
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-[#6b778c]">
                    Project ID: {projectId}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-3 flex gap-1 overflow-x-auto px-4">
              {projectTabs.map((tab) => (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition ${
                    tab.active
                      ? "border-[#0c66e4] text-[#0c66e4]"
                      : "border-transparent text-[#44546f] hover:bg-[#f7f8f9] hover:text-[#172b4d]"
                  }`}
                >
                  {tab.label}
                  {tab.badge ? (
                    <span className="ml-1.5 rounded-full bg-[#de350b] px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {tab.badge > 99 ? "99+" : tab.badge}
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <main className="flex-1 overflow-y-auto bg-[#f7f8f9] p-4">
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
