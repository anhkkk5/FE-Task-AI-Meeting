"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjects } from "@/features/projects/api/projects.api";
import { ProjectList } from "@/features/projects/components/ProjectList";
import {
  Project,
  ProjectStatus,
} from "@/features/projects/types/project.type";
import { useAuth } from "@/hooks/useAuth";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function ProjectsPage() {
  const params = useParams<{ workspaceId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [items, setItems] = useState<Project[]>([]);
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [keyword, setKeyword] = useState("");
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canWrite = writeRoles.includes(myRole);

  const loadProjects = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [projectsResponse, roleResponse] = await Promise.all([
          getProjects(params.workspaceId, {
            status: status || undefined,
            keyword: keyword || undefined,
            page: 1,
            limit: 20,
          }),
          getMyWorkspaceRole(params.workspaceId),
        ]);
        setItems(projectsResponse.data.items);
        setMyRole(roleResponse.data.role);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tải danh sách dự án thất bại.");
      } finally {
        setIsLoading(false);
      }
    },
    [keyword, params.workspaceId, status],
  );

  useEffect(() => {
    if (user && params.workspaceId) {
      void loadProjects();
    }
  }, [user, params.workspaceId, loadProjects]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell workspaceId={params.workspaceId}>
      <div className="space-y-6">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Quản lý Dự án</h1>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              Workspace có {items.length} dự án {myRole ? ` · Vai trò của bạn: ${myRole}` : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
              type="button"
              onClick={() => void loadProjects()}
              disabled={isLoading}
            >
              {isLoading ? "Đang tải..." : "Làm mới"}
            </button>
            {canWrite && (
              <Link
                className="flex h-9 items-center rounded-lg bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 transition"
                href={`/workspaces/${params.workspaceId}/projects/create`}
              >
                Tạo dự án mới
              </Link>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="grid gap-3 bg-white p-4 rounded-2xl border border-zinc-200/80 shadow-sm sm:grid-cols-[180px_minmax(0,1fr)_auto]">
          <select
            className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none hover:border-zinc-400 cursor-pointer transition"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ProjectStatus | "")
            }
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <input
            className="h-10 rounded-xl border border-zinc-300 px-3 text-xs font-normal outline-none focus:border-zinc-900 transition"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Tìm kiếm theo tên dự án hoặc Key Code..."
          />
          <button
            className="h-10 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800 transition"
            type="button"
            onClick={() => void loadProjects()}
          >
            Tìm kiếm
          </button>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {/* Project List */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
        ) : (
          <ProjectList items={items} />
        )}
      </div>
    </AppShell>
  );
}
