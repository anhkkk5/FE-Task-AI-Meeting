"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjects } from "@/features/projects/api/projects.api";
import { ProjectList } from "@/features/projects/components/ProjectList";
import {
  Project,
  ProjectStatus,
} from "@/features/projects/types/project.type";
import {
  AccessTokenBar,
  getStoredAccessToken,
} from "@/features/workspaces/components/AccessTokenBar";

const writeRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function ProjectsPage() {
  const params = useParams<{ workspaceId: string }>();
  const [token, setToken] = useState(() => getStoredAccessToken());
  const [items, setItems] = useState<Project[]>([]);
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [keyword, setKeyword] = useState("");
  const [myRole, setMyRole] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canWrite = writeRoles.includes(myRole);

  const loadProjects = useCallback(
    async (activeToken = token) => {
      if (!activeToken) {
        setMessage("Access token is required.");
        return;
      }

      setIsLoading(true);
      setMessage("");

      try {
        const [projectsResponse, roleResponse] = await Promise.all([
          getProjects(activeToken, params.workspaceId, {
            status: status || undefined,
            keyword: keyword || undefined,
            page: 1,
            limit: 20,
          }),
          getMyWorkspaceRole(activeToken, params.workspaceId),
        ]);
        setItems(projectsResponse.data.items);
        setMyRole(roleResponse.data.role);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Request failed");
      } finally {
        setIsLoading(false);
      }
    },
    [keyword, params.workspaceId, status, token],
  );

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <AccessTokenBar onTokenChange={setToken} />
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8">
        <div className="flex flex-wrap gap-3">
          <Link
            className="text-sm font-medium text-zinc-600"
            href={`/workspaces/${params.workspaceId}`}
          >
            Back to workspace
          </Link>
          <button
            className="text-sm font-medium text-zinc-900"
            type="button"
            onClick={() => void loadProjects()}
          >
            Refresh
          </button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Projects</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {items.length} project{items.length === 1 ? "" : "s"}
              {myRole ? ` · My role: ${myRole}` : ""}
            </p>
          </div>
          {canWrite ? (
            <Link
              className="flex h-10 items-center bg-zinc-900 px-4 text-sm font-medium text-white"
              href={`/workspaces/${params.workspaceId}/projects/create`}
            >
              Create
            </Link>
          ) : null}
        </div>

        <div className="grid gap-3 border border-zinc-200 bg-white p-4 md:grid-cols-[180px_minmax(0,1fr)_auto]">
          <select
            className="h-10 border border-zinc-300 bg-white px-3 text-sm"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as ProjectStatus | "")
            }
          >
            <option value="">All status</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <input
            className="h-10 min-w-0 border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-900"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="Search name or key code"
          />
          <button
            className="h-10 border border-zinc-300 px-4 text-sm font-medium"
            type="button"
            onClick={() => void loadProjects()}
          >
            Apply
          </button>
        </div>

        {message ? (
          <p className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-zinc-600">Loading...</p>
        ) : (
          <ProjectList items={items} />
        )}
      </section>
    </main>
  );
}
