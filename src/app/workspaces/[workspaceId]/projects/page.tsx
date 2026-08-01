"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, RefreshCw, Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjects } from "@/features/projects/api/projects.api";
import { ProjectList } from "@/features/projects/components/ProjectList";
import {
  Project,
  ProjectStatus,
} from "@/features/projects/types/project.type";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function ProjectsPage() {
  const params = useParams<{ workspaceId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);

  const [items, setItems] = useState<Project[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [keyword, setKeyword] = useState("");
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canWrite = writeRoles.includes(myRole) || true; // Allow create project for workspace members

  const loadProjects = useCallback(async () => {
    if (!params.workspaceId) return;

    setIsLoading(true);
    setMessage("");

    try {
      const [projectsResponse, roleResponse, workspacesRes] = await Promise.allSettled([
        getProjects(params.workspaceId, {
          status: activeTab === "ALL" ? undefined : (activeTab as ProjectStatus),
          keyword: keyword.trim() || undefined,
          page: 1,
          limit: 50,
        }),
        getMyWorkspaceRole(params.workspaceId),
        getMyWorkspaces("ACTIVE"),
      ]);

      if (projectsResponse.status === "fulfilled") {
        setItems(projectsResponse.value.data.items);
      } else {
        setItems([]);
        setMessage("Tải danh sách dự án thất bại.");
      }

      if (roleResponse.status === "fulfilled") {
        setMyRole(roleResponse.value.data.role);
      }

      if (workspacesRes.status === "fulfilled") {
        const found = workspacesRes.value.data.items.find(
          (w) => w.id === params.workspaceId,
        );
        setWorkspace(found || null);
      }
    } finally {
      setIsLoading(false);
    }
  }, [keyword, params.workspaceId, activeTab]);

  useEffect(() => {
    if (user && params.workspaceId) {
      void loadProjects();
    }
  }, [user, params.workspaceId, loadProjects]);

  // Client side filtered items if search keyword is typed
  const filteredProjects = useMemo(() => {
    if (!keyword.trim()) return items;
    const term = keyword.toLowerCase();
    return items.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.keyCode.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term)),
    );
  }, [items, keyword]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell workspaceId={params.workspaceId}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Title Section (Chuẩn Ảnh 2) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Dự án
            </h1>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              Theo dõi các dự án trong workspace {workspace ? workspace.name : "của bạn"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void loadProjects()}
              disabled={isLoading}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 active:scale-95 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
              Làm mới
            </button>

            {canWrite && (
              <Link
                href={`/workspaces/${params.workspaceId}/projects/create`}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Tạo dự án
              </Link>
            )}
          </div>
        </div>

        {/* Filter Tabs & Search Bar (Chuẩn Ảnh 2) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100/80 p-1.5 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
                activeTab === "ALL"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Tất cả dự án
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ACTIVE")}
              className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
                activeTab === "ACTIVE"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Đang hoạt động
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("COMPLETED")}
              className={`rounded-xl px-4 py-1.5 text-xs font-extrabold transition ${
                activeTab === "COMPLETED"
                  ? "bg-white text-blue-600 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Đã hoàn thành
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex items-center w-full max-w-xs">
            <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm kiếm dự án..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
            />
          </div>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800 shadow-xs">
            {message}
          </div>
        ) : null}

        {/* Project Cards Grid */}
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Đang tải danh sách dự án...
            </div>
          </div>
        ) : (
          <ProjectList
            items={filteredProjects}
            workspaceId={params.workspaceId}
            canCreate={canWrite}
          />
        )}
      </div>
    </AppShell>
  );
}
