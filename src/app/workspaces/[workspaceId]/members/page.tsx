"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useState } from "react";
import {
  addWorkspaceMember,
  changeWorkspaceMemberRole,
  getMyWorkspaceRole,
  getWorkspaceMembers,
  removeWorkspaceMember,
} from "@/features/members/api/members.api";
import {
  WorkspaceMember,
  WorkspaceRole,
} from "@/features/members/types/member.type";
import {
  AccessTokenBar,
  getStoredAccessToken,
} from "@/features/workspaces/components/AccessTokenBar";

const assignableRoles: Exclude<WorkspaceRole, "OWNER">[] = [
  "SCRUM_MASTER",
  "PROJECT_MANAGER",
  "MEMBER",
  "VIEWER",
];

export default function WorkspaceMembersPage() {
  const params = useParams<{ workspaceId: string }>();
  const [token, setToken] = useState(() => getStoredAccessToken());
  const [items, setItems] = useState<WorkspaceMember[]>([]);
  const [myRole, setMyRole] = useState<WorkspaceRole | "">("");
  const [email, setEmail] = useState("");
  const [role, setRole] =
    useState<Exclude<WorkspaceRole, "OWNER">>("MEMBER");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = myRole === "OWNER";

  const loadMembers = useCallback(
    async (activeToken = token) => {
      if (!activeToken) {
        setMessage("Access token is required.");
        return;
      }

      setIsLoading(true);
      setMessage("");

      try {
        const [membersResponse, roleResponse] = await Promise.all([
          getWorkspaceMembers(activeToken, params.workspaceId),
          getMyWorkspaceRole(activeToken, params.workspaceId),
        ]);
        setItems(membersResponse.data.items);
        setMyRole(roleResponse.data.role);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Request failed");
      } finally {
        setIsLoading(false);
      }
    },
    [params.workspaceId, token],
  );

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const activeToken = token || getStoredAccessToken();

    if (!activeToken) {
      setMessage("Access token is required.");
      return;
    }

    try {
      await addWorkspaceMember(activeToken, params.workspaceId, {
        email,
        role,
      });
      setEmail("");
      setRole("MEMBER");
      setMessage("Member added.");
      await loadMembers(activeToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  async function handleChangeRole(
    memberId: string,
    nextRole: Exclude<WorkspaceRole, "OWNER">,
  ) {
    const activeToken = token || getStoredAccessToken();

    if (!activeToken) {
      setMessage("Access token is required.");
      return;
    }

    try {
      await changeWorkspaceMemberRole(
        activeToken,
        params.workspaceId,
        memberId,
        {
          role: nextRole,
        },
      );
      setMessage("Member role updated.");
      await loadMembers(activeToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

  async function handleRemove(memberId: string) {
    const activeToken = token || getStoredAccessToken();

    if (!activeToken) {
      setMessage("Access token is required.");
      return;
    }

    try {
      await removeWorkspaceMember(activeToken, params.workspaceId, memberId);
      setMessage("Member removed.");
      await loadMembers(activeToken);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    }
  }

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
            onClick={() => void loadMembers()}
          >
            Refresh
          </button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Workspace Members</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {items.length} active member{items.length === 1 ? "" : "s"}
              {myRole ? ` · My role: ${myRole}` : ""}
            </p>
          </div>
        </div>

        {message ? (
          <p className="border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}

        <form
          className="grid gap-3 border border-zinc-200 bg-white p-5 md:grid-cols-[minmax(0,1fr)_180px_auto]"
          onSubmit={handleAddMember}
        >
          <input
            className="h-10 min-w-0 border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-900"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="member@example.com"
            type="email"
            disabled={!isOwner}
            required
          />
          <select
            className="h-10 border border-zinc-300 bg-white px-3 text-sm"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as Exclude<WorkspaceRole, "OWNER">)
            }
            disabled={!isOwner}
          >
            {assignableRoles.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            className="h-10 bg-zinc-900 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
            type="submit"
            disabled={!isOwner}
          >
            Add member
          </button>
        </form>

        {isLoading ? (
          <p className="text-sm text-zinc-600">Loading...</p>
        ) : (
          <div className="overflow-x-auto border border-zinc-200 bg-white">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-100 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((member) => (
                  <tr
                    key={member.memberId}
                    className="border-b border-zinc-100 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">
                        {member.fullName ?? "Unnamed user"}
                      </p>
                      <p className="break-all text-xs text-zinc-500">
                        {member.email ?? member.userId}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {member.role === "OWNER" ? (
                        <span className="font-medium">{member.role}</span>
                      ) : (
                        <select
                          className="h-9 border border-zinc-300 bg-white px-2 text-xs"
                          value={member.role}
                          onChange={(event) =>
                            void handleChangeRole(
                              member.memberId,
                              event.target.value as Exclude<
                                WorkspaceRole,
                                "OWNER"
                              >,
                            )
                          }
                          disabled={!isOwner}
                        >
                          {assignableRoles.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">{member.status}</td>
                    <td className="px-4 py-3">
                      {member.joinedAt
                        ? new Date(member.joinedAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        className="h-9 border border-red-300 px-3 text-xs font-medium text-red-700 disabled:cursor-not-allowed disabled:border-zinc-200 disabled:text-zinc-300"
                        type="button"
                        disabled={!isOwner}
                        onClick={() => void handleRemove(member.memberId)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-zinc-500" colSpan={5}>
                      No active members loaded.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
