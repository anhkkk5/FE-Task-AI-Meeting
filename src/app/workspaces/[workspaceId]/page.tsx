"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useState } from "react";
import {
  AccessTokenBar,
  getStoredAccessToken,
} from "@/features/workspaces/components/AccessTokenBar";
import { getWorkspaceDetail } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";

export default function WorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
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

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <AccessTokenBar onTokenChange={setToken} />
      <section className="mx-auto grid w-full max-w-4xl gap-6 px-6 py-8">
        <div className="flex flex-wrap gap-3">
          <Link className="text-sm font-medium text-zinc-600" href="/workspaces">
            Back to workspaces
          </Link>
          <Link
            className="text-sm font-medium text-zinc-900"
            href={`/workspaces/${params.workspaceId}/settings`}
          >
            Settings
          </Link>
          <button
            className="text-sm font-medium text-zinc-900"
            type="button"
            onClick={() => void loadWorkspace()}
          >
            Refresh
          </button>
        </div>
        {message ? (
          <p className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        {workspace ? (
          <div className="border border-zinc-200 bg-white p-5">
            <h1 className="text-2xl font-semibold">{workspace.name}</h1>
            <p className="mt-1 text-sm text-zinc-500">{workspace.slug}</p>
            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">
                  Role
                </dt>
                <dd className="mt-1 text-sm text-zinc-900">
                  {workspace.myRole}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">
                  Status
                </dt>
                <dd className="mt-1 text-sm text-zinc-900">
                  {workspace.status}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">
                  Plan
                </dt>
                <dd className="mt-1 text-sm text-zinc-900">
                  {workspace.plan}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-zinc-500">
                  Owner
                </dt>
                <dd className="mt-1 break-all text-sm text-zinc-900">
                  {workspace.ownerId}
                </dd>
              </div>
            </dl>
            {workspace.description ? (
              <p className="mt-6 border-t border-zinc-200 pt-4 text-sm text-zinc-700">
                {workspace.description}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </main>
  );
}
