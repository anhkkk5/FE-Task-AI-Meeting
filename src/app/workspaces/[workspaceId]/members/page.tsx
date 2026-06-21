"use client";

import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
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
import { useAuth } from "@/hooks/useAuth";

const assignableRoles: Exclude<WorkspaceRole, "OWNER">[] = [
  "SCRUM_MASTER",
  "PROJECT_MANAGER",
  "MEMBER",
  "VIEWER",
];

export default function WorkspaceMembersPage() {
  const params = useParams<{ workspaceId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [items, setItems] = useState<WorkspaceMember[]>([]);
  const [myRole, setMyRole] = useState<WorkspaceRole | "">("");
  const [email, setEmail] = useState("");
  const [role, setRole] =
    useState<Exclude<WorkspaceRole, "OWNER">>("MEMBER");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = myRole === "OWNER";

  const loadMembers = useCallback(
    async () => {
      setIsLoading(true);
      setMessage("");

      try {
        const [membersResponse, roleResponse] = await Promise.all([
          getWorkspaceMembers(params.workspaceId),
          getMyWorkspaceRole(params.workspaceId),
        ]);
        setItems(membersResponse.data.items);
        setMyRole(roleResponse.data.role);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Tải danh sách thành viên thất bại.");
      } finally {
        setIsLoading(false);
      }
    },
    [params.workspaceId],
  );

  useEffect(() => {
    if (user && params.workspaceId) {
      void loadMembers();
    }
  }, [user, params.workspaceId, loadMembers]);

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await addWorkspaceMember(params.workspaceId, {
        email,
        role,
      });
      setEmail("");
      setRole("MEMBER");
      setMessage("Đã thêm thành viên mới thành công.");
      await loadMembers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Thêm thành viên thất bại.");
    }
  }

  async function handleChangeRole(
    memberId: string,
    nextRole: Exclude<WorkspaceRole, "OWNER">,
  ) {
    try {
      await changeWorkspaceMemberRole(
        params.workspaceId,
        memberId,
        {
          role: nextRole,
        },
      );
      setMessage("Cập nhật vai trò thành viên thành công.");
      await loadMembers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cập nhật vai trò thất bại.");
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi workspace không?")) {
      return;
    }

    try {
      await removeWorkspaceMember(params.workspaceId, memberId);
      setMessage("Đã xóa thành viên khỏi workspace.");
      await loadMembers();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Xóa thành viên thất bại.");
    }
  }

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
            <h1 className="text-xl font-bold text-zinc-900">Quản lý Thành viên</h1>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              Workspace có {items.length} thành viên đang hoạt động {myRole ? ` · Vai trò của bạn: ${myRole}` : ""}
            </p>
          </div>
          <button
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition"
            type="button"
            onClick={() => void loadMembers()}
            disabled={isLoading}
          >
            {isLoading ? "Đang tải..." : "Làm mới"}
          </button>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {/* Invite Member Section (Only for OWNER) */}
        {isOwner && (
          <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-zinc-800">Thêm thành viên mới vào Không gian</h2>
            <form
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
              onSubmit={handleAddMember}
            >
              <input
                className="h-10 rounded-xl border border-zinc-300 px-3 text-xs font-normal outline-none focus:border-zinc-900 transition"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nhap-email@company.com"
                type="email"
                required
              />
              <select
                className="h-10 rounded-xl border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 outline-none hover:border-zinc-400 transition cursor-pointer"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as Exclude<WorkspaceRole, "OWNER">)
                }
              >
                {assignableRoles.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <button
                className="h-10 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white hover:bg-slate-800 transition"
                type="submit"
              >
                Thêm thành viên
              </button>
            </form>
          </div>
        )}

        {/* Members Table */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-900 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  <tr>
                    <th className="px-6 py-4">Thành viên</th>
                    <th className="px-6 py-4">Vai trò</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4">Ngày tham gia</th>
                    {isOwner && <th className="px-6 py-4 text-right">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {items.map((member) => {
                    const memberRole = member.role;
                    const isMemberOwner = memberRole === "OWNER";
                    
                    const roleBadgeColor = 
                      isMemberOwner 
                        ? "bg-indigo-50 text-indigo-700 border-indigo-100" 
                        : memberRole === "SCRUM_MASTER"
                        ? "bg-purple-50 text-purple-700 border-purple-100"
                        : memberRole === "PROJECT_MANAGER"
                        ? "bg-sky-50 text-sky-700 border-sky-100"
                        : "bg-zinc-50 text-zinc-600 border-zinc-100";

                    return (
                      <tr
                        key={member.memberId}
                        className="hover:bg-zinc-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 font-bold text-xs">
                              {member.fullName ? member.fullName.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900">
                                {member.fullName ?? "Người dùng chưa đặt tên"}
                              </p>
                              <p className="text-[10px] text-zinc-500">
                                {member.email ?? member.userId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isMemberOwner ? (
                            <span className={`border px-2 py-0.5 rounded-md font-bold uppercase tracking-wide text-[9px] ${roleBadgeColor}`}>
                              {memberRole}
                            </span>
                          ) : (
                            <select
                              className="h-8 rounded-lg border border-zinc-300 bg-white px-2 text-[11px] font-semibold text-zinc-700 outline-none hover:border-zinc-400 cursor-pointer disabled:bg-zinc-50 disabled:cursor-not-allowed"
                              value={memberRole}
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
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            member.status === "ACTIVE" 
                              ? "bg-emerald-50 text-emerald-700" 
                              : "bg-amber-50 text-amber-700"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              member.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"
                            }`}></span>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-500">
                          {member.joinedAt
                            ? new Date(member.joinedAt).toLocaleDateString("vi-VN")
                            : "-"}
                        </td>
                        {isOwner && (
                          <td className="px-6 py-4 text-right">
                            {!isMemberOwner ? (
                              <button
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition"
                                type="button"
                                onClick={() => void handleRemove(member.memberId)}
                              >
                                Xóa khỏi nhóm
                              </button>
                            ) : (
                              <span className="text-[11px] text-zinc-400 italic">OWNER không thể xóa</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {items.length === 0 ? (
                    <tr>
                      <td className="px-6 py-8 text-center text-zinc-500" colSpan={isOwner ? 5 : 4}>
                        Chưa có thành viên nào hoạt động trong không gian này.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
