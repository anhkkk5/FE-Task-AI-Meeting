"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AccessTokenBar,
  getStoredAccessToken,
} from "@/features/workspaces/components/AccessTokenBar";
import { WorkspaceForm } from "@/features/workspaces/components/WorkspaceForm";
import {
  archiveWorkspace,
  getWorkspaceDetail,
  updateWorkspace,
} from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";

export default function WorkspaceSettingsPage() {
  const params = useParams<{ workspaceId: string }>();
  const router = useRouter();
  const [token, setToken] = useState(() => getStoredAccessToken());
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [message, setMessage] = useState("");

  const loadWorkspace = useCallback(
    async (activeToken = token) => {
      if (!activeToken) {
        setMessage("Access token is required.");
        return;
      }

      try {
        const response = await getWorkspaceDetail(
          activeToken,
          params.workspaceId,
        );
        setWorkspace(response.data.workspace);
        setMessage("");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Request failed");
      }
    },
    [params.workspaceId, token],
  );

  async function handleUpdate(payload: {
    name: string;
    description?: string;
  }) {
    const activeToken = token || getStoredAccessToken();

    if (!activeToken) {
      setMessage("Access token is required.");
      return;
    }

    try {
      const response = await updateWorkspace(activeToken, params.workspaceId, {
        name: payload.name,
        description: payload.description,
      });
      setWorkspace(response.data.workspace);
      setMessage("Workspace updated.");
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
      await archiveWorkspace(activeToken, params.workspaceId);
      router.push("/workspaces");
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
          href={`/workspaces/${params.workspaceId}`}
        >
          Back to workspace
        </Link>
        <button
          className="w-fit text-sm font-medium text-zinc-900"
          type="button"
          onClick={() => void loadWorkspace()}
        >
          Load settings
        </button>
        <div>
          <h1 className="text-2xl font-semibold">Workspace Settings</h1>
          <p className="mt-1 text-sm text-zinc-600">
            OWNER permission is required.
          </p>
        </div>
        {message ? (
          <p className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        {workspace ? (
          <div className="grid gap-6">
            <div className="border border-zinc-200 bg-white p-5">
              <WorkspaceForm
                initialDescription={workspace.description}
                initialName={workspace.name}
                submitLabel="Update workspace"
                onSubmit={handleUpdate}
              />
            </div>
            <div className="border border-red-200 bg-white p-5">
              <h2 className="text-base font-semibold text-red-900">
                Archive workspace
              </h2>
              <p className="mt-2 text-sm text-red-700">
                Archived workspaces cannot be used for new project work.
              </p>
              <button
                className="mt-4 h-10 border border-red-400 px-4 text-sm font-semibold text-red-700"
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
