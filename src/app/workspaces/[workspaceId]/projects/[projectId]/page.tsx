"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import {
  AccessTokenBar,
  getStoredAccessToken,
} from "@/features/workspaces/components/AccessTokenBar";

export default function ProjectDetailPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const [token, setToken] = useState(() => getStoredAccessToken());
  const [project, setProject] = useState<Project | null>(null);
  const [message, setMessage] = useState("");

  const loadProject = useCallback(
    async (activeToken = token) => {
      if (!activeToken) {
        setMessage("Access token is required.");
        return;
      }

      try {
        const response = await getProjectDetail(
          activeToken,
          params.workspaceId,
          params.projectId,
        );
        setProject(response.data.project);
        setMessage("");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Request failed");
      }
    },
    [params.projectId, params.workspaceId, token],
  );

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <AccessTokenBar onTokenChange={setToken} />
      <section className="mx-auto grid w-full max-w-4xl gap-6 px-6 py-8">
        <div className="flex flex-wrap gap-3">
          <Link
            className="text-sm font-medium text-zinc-600"
            href={`/workspaces/${params.workspaceId}/projects`}
          >
            Back to projects
          </Link>
          <Link
            className="text-sm font-medium text-zinc-900"
            href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/settings`}
          >
            Settings
          </Link>
          <button
            className="text-sm font-medium text-zinc-900"
            type="button"
            onClick={() => void loadProject()}
          >
            Refresh
          </button>
        </div>
        {message ? (
          <p className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        {project ? (
          <div className="border border-zinc-200 bg-white p-5">
            <h1 className="text-2xl font-semibold">{project.name}</h1>
            <p className="mt-1 text-sm font-medium text-zinc-500">
              {project.keyCode}
            </p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">
                  Status
                </dt>
                <dd className="mt-1 text-sm text-zinc-900">
                  {project.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">
                  Created by
                </dt>
                <dd className="mt-1 break-all text-sm text-zinc-900">
                  {project.createdBy}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">
                  Start date
                </dt>
                <dd className="mt-1 text-sm text-zinc-900">
                  {project.startDate ?? "-"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">
                  End date
                </dt>
                <dd className="mt-1 text-sm text-zinc-900">
                  {project.endDate ?? "-"}
                </dd>
              </div>
            </dl>
            {project.description ? (
              <p className="mt-6 border-t border-zinc-200 pt-4 text-sm text-zinc-700">
                {project.description}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
