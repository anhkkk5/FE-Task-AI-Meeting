"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AccessTokenBar,
  getStoredAccessToken,
} from "@/features/workspaces/components/AccessTokenBar";
import { WorkspaceForm } from "@/features/workspaces/components/WorkspaceForm";
import { createWorkspace } from "@/features/workspaces/api/workspaces.api";

export default function CreateWorkspacePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");

  async function handleCreate(payload: {
    name: string;
    description?: string;
  }) {
    const activeToken = token || getStoredAccessToken();

    if (!activeToken) {
      setMessage("Access token is required.");
      return;
    }

    try {
      const response = await createWorkspace(activeToken, payload);
      router.push(`/workspaces/${response.data.workspace.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <AccessTokenBar onTokenChange={setToken} />
      <section className="mx-auto grid w-full max-w-3xl gap-6 px-6 py-8">
        <Link className="text-sm font-medium text-zinc-600" href="/workspaces">
          Back to workspaces
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Create Workspace</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Owner membership is created automatically.
          </p>
        </div>
        {message ? (
          <p className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        <div className="border border-zinc-200 bg-white p-5">
          <WorkspaceForm submitLabel="Create workspace" onSubmit={handleCreate} />
        </div>
      </section>
    </main>
  );
}
