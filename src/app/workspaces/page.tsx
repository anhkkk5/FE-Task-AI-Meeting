"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  AccessTokenBar,
  getStoredAccessToken,
} from "@/features/workspaces/components/AccessTokenBar";
import { WorkspaceCard } from "@/features/workspaces/components/WorkspaceCard";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace, WorkspaceStatus } from "@/features/workspaces/types/workspace.type";

export default function WorkspacesPage() {
  const [token, setToken] = useState(() => getStoredAccessToken());
  const [status, setStatus] = useState<WorkspaceStatus | "">("");
  const [items, setItems] = useState<Workspace[]>([]);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const loadWorkspaces = useCallback(
    async (activeToken = token) => {
      if (!activeToken) {
        setItems([]);
        setMessage("Access token is required.");
        return;
      }

      setIsLoading(true);
      setMessage("");

      try {
        const response = await getMyWorkspaces(
          activeToken,
          status === "" ? undefined : status,
        );
        setItems(response.data.items);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Request failed");
      } finally {
        setIsLoading(false);
      }
    },
    [status, token],
  );

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <AccessTokenBar onTokenChange={setToken} />
      <section className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Workspaces</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {items.length} workspace{items.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-10 border border-zinc-300 bg-white px-3 text-sm"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as WorkspaceStatus | "")
              }
            >
              <option value="">All status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
            <button
              className="h-10 border border-zinc-300 bg-white px-4 text-sm font-medium"
              type="button"
              onClick={() => void loadWorkspaces()}
            >
              Refresh
            </button>
            <Link
              className="flex h-10 items-center bg-zinc-900 px-4 text-sm font-medium text-white"
              href="/workspaces/create"
            >
              Create
            </Link>
          </div>
        </div>
        {message ? (
          <p className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        {isLoading ? (
          <p className="text-sm text-zinc-600">Loading...</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((workspace) => (
              <WorkspaceCard key={workspace.id} workspace={workspace} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
