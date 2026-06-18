"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  archiveProject,
  completeProject,
  getProjectDetail,
  updateProject,
} from "@/features/projects/api/projects.api";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { Project } from "@/features/projects/types/project.type";
import {
  AccessTokenBar,
  getStoredAccessToken,
} from "@/features/workspaces/components/AccessTokenBar";

export default function ProjectSettingsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const router = useRouter();
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

  async function handleUpdate(payload: {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const activeToken = token || getStoredAccessToken();

    if (!activeToken) {
      setMessage("Access token is required.");
      return;
    }

    try {
      const response = await updateProject(
        activeToken,
        params.workspaceId,
        params.projectId,
        {
          name: payload.name,
          description: payload.description,
          startDate: payload.startDate,
          endDate: payload.endDate,
        },
      );
      setProject(response.data.project);
      setMessage("Project updated.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  async function handleArchive() {
    const activeToken = token || getStoredAccessToken();

    if (!activeToken) {
      setMessage("Access token is required.");
      return;
    }

    try {
      await archiveProject(activeToken, params.workspaceId, params.projectId);
      router.push(`/workspaces/${params.workspaceId}/projects`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  async function handleComplete() {
    const activeToken = token || getStoredAccessToken();

    if (!activeToken) {
      setMessage("Access token is required.");
      return;
    }

    try {
      await completeProject(activeToken, params.workspaceId, params.projectId);
      router.push(`/workspaces/${params.workspaceId}/projects`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <AccessTokenBar onTokenChange={setToken} />
      <section className="mx-auto grid w-full max-w-3xl gap-6 px-6 py-8">
        <div className="flex flex-wrap gap-3">
          <Link
            className="text-sm font-medium text-zinc-600"
            href={`/workspaces/${params.workspaceId}/projects/${params.projectId}`}
          >
            Back to project
          </Link>
          <button
            className="text-sm font-medium text-zinc-900"
            type="button"
            onClick={() => void loadProject()}
          >
            Load settings
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Project Settings</h1>
          <p className="mt-1 text-sm text-zinc-600">
            OWNER, SCRUM_MASTER or PROJECT_MANAGER permission is required.
          </p>
        </div>
        {message ? (
          <p className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        {project ? (
          <div className="grid gap-6">
            <div className="border border-zinc-200 bg-white p-5">
              <ProjectForm
                initialDescription={project.description}
                initialEndDate={project.endDate}
                initialName={project.name}
                initialStartDate={project.startDate}
                mode="update"
                submitLabel="Update project"
                onSubmit={handleUpdate}
              />
            </div>
            <div className="grid gap-3 border border-zinc-200 bg-white p-5 sm:grid-cols-2">
              <button
                className="h-10 border border-zinc-400 px-4 text-sm font-semibold text-zinc-800"
                type="button"
                onClick={() => void handleComplete()}
              >
                Complete
              </button>
              <button
                className="h-10 border border-red-400 px-4 text-sm font-semibold text-red-700"
                type="button"
                onClick={() => void handleArchive()}
              >
                Archive
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
