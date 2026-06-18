"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { createProject } from "@/features/projects/api/projects.api";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import {
  AccessTokenBar,
  getStoredAccessToken,
} from "@/features/workspaces/components/AccessTokenBar";

export default function CreateProjectPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const [token, setToken] = useState(() => getStoredAccessToken());
  const [message, setMessage] = useState("");

  async function handleCreate(payload: {
    name: string;
    keyCode?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const activeToken = token || getStoredAccessToken();

    if (!activeToken) {
      setMessage("Access token is required.");
      return;
    }

    if (!payload.keyCode) {
      setMessage("Project key code is required.");
      return;
    }

    try {
      const response = await createProject(activeToken, params.workspaceId, {
        name: payload.name,
        keyCode: payload.keyCode,
        description: payload.description,
        startDate: payload.startDate,
        endDate: payload.endDate,
      });
      router.push(
        `/workspaces/${params.workspaceId}/projects/${response.data.project.id}`,
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <AccessTokenBar onTokenChange={setToken} />
      <section className="mx-auto grid w-full max-w-3xl gap-6 px-6 py-8">
        <Link
          className="text-sm font-medium text-zinc-600"
          href={`/workspaces/${params.workspaceId}/projects`}
        >
          Back to projects
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Create Project</h1>
          <p className="mt-1 text-sm text-zinc-600">
            OWNER, SCRUM_MASTER or PROJECT_MANAGER permission is required.
          </p>
        </div>
        {message ? (
          <p className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        <div className="border border-zinc-200 bg-white p-5">
          <ProjectForm
            mode="create"
            submitLabel="Create project"
            onSubmit={handleCreate}
          />
        </div>
      </section>
    </main>
  );
}
