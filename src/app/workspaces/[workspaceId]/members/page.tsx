"use client";

import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  addWorkspaceMember,
  changeWorkspaceMemberRole,
  getMyWorkspaceRole,
  getWorkspaceMembers,
  lookupWorkspaceMemberByEmail,
  removeWorkspaceMember,
} from "@/features/members/api/members.api";
import {
  WorkspaceMember,
  WorkspaceMemberLookup,
  WorkspaceRole,
} from "@/features/members/types/member.type";
import { useAuth } from "@/hooks/useAuth";
import { Users, Radio, Mail, SlidersHorizontal, Search, Plus, Filter } from "lucide-react";

const assignableRoles: Exclude<WorkspaceRole, "OWNER">[] = [
  "SCRUM_MASTER",
  "PROJECT_MANAGER",
  "MEMBER",
  "VIEWER",
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getLookupReasonLabel(reason: WorkspaceMemberLookup["reason"]) {
  if (reason === "ALREADY_ACTIVE_MEMBER") {
    return "Tai khoan nay da la thanh vien ACTIVE cua workspace.";
  }

  if (reason === "USER_NOT_ACTIVE") {
    return "Tai khoan nay khong o trang thai ACTIVE nen chua the them.";
  }

  if (reason === "USER_NOT_FOUND") {
    return "Khong tim thay tai khoan da dang ky voi email nay.";
  }

  return "";
}

export default function WorkspaceMembersPage() {
  const params = useParams<{ workspaceId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [items, setItems] = useState<WorkspaceMember[]>([]);
  const [myRole, setMyRole] = useState<WorkspaceRole | "">("");
  const [email, setEmail] = useState("");
  const [role, setRole] =
    useState<Exclude<WorkspaceRole, "OWNER">>("MEMBER");
  const [lookupResult, setLookupResult] =
    useState<WorkspaceMemberLookup | null>(null);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = myRole === "OWNER";
  const normalizedEmail = email.trim().toLowerCase();
  const canAddLookedUpUser = Boolean(
    lookupResult?.canAdd &&
      lookupResult.user &&
      lookupResult.user.email === normalizedEmail,
  );

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

  useEffect(() => {
    if (!isOwner || !normalizedEmail) {
      setLookupResult(null);
      setLookupMessage("");
      setIsLookingUp(false);
      return undefined;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setLookupResult(null);
      setLookupMessage("Nhap dung dinh dang email de tim tai khoan.");
      setIsLookingUp(false);
      return undefined;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLookingUp(true);
      setLookupMessage("");

      try {
        const response = await lookupWorkspaceMemberByEmail(
          params.workspaceId,
          normalizedEmail,
        );

        if (cancelled) {
          return;
        }

        setLookupResult(response.data);

        if (!response.data.user) {
          setLookupMessage("Khong tim thay tai khoan da dang ky voi email nay.");
        } else if (!response.data.canAdd) {
          setLookupMessage(getLookupReasonLabel(response.data.reason));
        } else if (
          response.data.reason === "REMOVED_MEMBER_CAN_BE_REACTIVATED"
        ) {
          setLookupMessage(
            "Tai khoan nay tung bi xoa khoi workspace. Bam them de kich hoat lai.",
          );
        }
      } catch (error) {
        if (!cancelled) {
          setLookupResult(null);
          setLookupMessage(
            error instanceof Error ? error.message : "Tim tai khoan that bai.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLookingUp(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isOwner, normalizedEmail, params.workspaceId]);

  async function handleAddMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canAddLookedUpUser) {
      setMessage("Hay chon mot tai khoan hop le truoc khi them thanh vien.");
      return;
    }

    try {
      await addWorkspaceMember(params.workspaceId, {
        email: normalizedEmail,
        role,
      });
      setEmail("");
      setRole("MEMBER");
      setLookupResult(null);
      setLookupMessage("");
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
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage Members</h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Workspace has {items.length} active members. Your role: <span className="font-bold text-slate-900 uppercase">{myRole}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search members..." 
                className="h-10 w-64 pl-9 pr-4 rounded-xl border border-slate-200 text-sm outline-none focus:border-blue-500 transition"
              />
            </div>
            {isOwner && (
              <button
                className="flex items-center gap-2 h-10 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 transition shadow-sm"
                type="button"
              >
                <Plus className="h-4 w-4" />
                Invite Member
              </button>
            )}
          </div>
        </div>

        {/* Top Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wide">Total Members</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{items.length}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wide">Online Now</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">12</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wide">Pending Invites</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">5</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 tracking-wide">Defined Roles</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">4</p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {/* Invite Member Section (Only for OWNER) */}
        {isOwner && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-800">Thêm thành viên mới vào Không gian</h2>
            <form
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px_auto]"
              onSubmit={handleAddMember}
            >
              <input
                className="h-10 rounded-xl border border-slate-300 px-3 text-xs font-normal outline-none focus:border-blue-500 transition"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nhap-email@company.com"
                type="email"
                required
              />
              <select
                className="h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 outline-none hover:border-slate-400 transition cursor-pointer"
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
                className="h-10 rounded-xl bg-slate-900 px-5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                disabled={!canAddLookedUpUser}
                type="submit"
              >
                Thêm thành viên
              </button>
              <div className="sm:col-span-3">
                {isLookingUp ? (
                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700">
                    Dang tim tai khoan...
                  </div>
                ) : lookupResult?.user ? (
                  <div
                    className={`rounded-xl border px-4 py-3 ${
                      lookupResult.canAdd
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-slate-800 shadow-sm">
                          {lookupResult.user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {lookupResult.user.fullName}
                          </p>
                          <p className="text-xs font-medium text-slate-600">
                            {lookupResult.user.email}
                            {lookupResult.user.jobTitle
                              ? ` - ${lookupResult.user.jobTitle}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">
                          {lookupResult.user.status}
                        </span>
                        {lookupResult.existingMember ? (
                          <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-slate-600 shadow-sm">
                            {lookupResult.existingMember.status} /{" "}
                            {lookupResult.existingMember.role}
                          </span>
                        ) : (
                          <span className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-emerald-700 shadow-sm">
                            Co the them
                          </span>
                        )}
                      </div>
                    </div>
                    {lookupMessage ? (
                      <p className="mt-3 text-xs font-semibold text-amber-800">
                        {lookupMessage}
                      </p>
                    ) : null}
                  </div>
                ) : lookupMessage ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                    {lookupMessage}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500">
                    Nhap email user da dang ky de xem thong tin truoc khi them.
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Members Table */}
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm flex flex-col">
            {/* Table Header / Filters */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex gap-2">
                <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                  <Filter className="h-3.5 w-3.5" />
                  Filter
                </button>
                <div className="h-8 rounded-lg border border-slate-200 bg-slate-50/50 p-1 flex">
                  <button className="px-3 rounded-md bg-white text-xs font-bold text-slate-800 shadow-sm">All Members</button>
                </div>
              </div>
              <div className="text-xs font-medium text-slate-400 italic">
                Last updated: 5 minutes ago
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                <thead className="border-b border-slate-100 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-6 py-4">MEMBER</th>
                    <th className="px-6 py-4">ROLE</th>
                    <th className="px-6 py-4">STATUS</th>
                    <th className="px-6 py-4">JOINED DATE</th>
                    {isOwner && <th className="px-6 py-4 text-right">ACTIONS</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((member) => {
                    const memberRole = member.role;
                    const isMemberOwner = memberRole === "OWNER";
                    
                    const roleBadgeColor = 
                      isMemberOwner 
                        ? "bg-blue-50 text-blue-700 font-extrabold" 
                        : "bg-white text-slate-800 font-bold";

                    return (
                      <tr
                        key={member.memberId}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
                              {member.fullName ? member.fullName.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 text-[13px]">
                                {member.fullName ?? "Người dùng chưa đặt tên"}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {member.email ?? member.userId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isMemberOwner ? (
                            <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide ${roleBadgeColor}`}>
                              {memberRole}
                            </span>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase tracking-wide ${roleBadgeColor}`}>
                              {memberRole}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                            member.status === "ACTIVE" 
                              ? "text-emerald-600" 
                              : "text-amber-600"
                          }`}>
                            <span className={`h-2 w-2 rounded-full ${
                              member.status === "ACTIVE" ? "border-2 border-emerald-500 bg-transparent" : "bg-amber-500"
                            }`}></span>
                            {member.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                          {member.joinedAt
                            ? new Date(member.joinedAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })
                            : "-"}
                        </td>
                        {isOwner && (
                          <td className="px-6 py-4 text-right">
                            {!isMemberOwner ? (
                              <button
                                className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-400 hover:text-red-600 transition"
                                type="button"
                                onClick={() => void handleRemove(member.memberId)}
                              >
                                Xóa
                              </button>
                            ) : null}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {items.length === 0 ? (
                    <tr>
                      <td className="px-6 py-8 text-center text-slate-500" colSpan={isOwner ? 5 : 4}>
                        Chưa có thành viên nào hoạt động trong không gian này.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Showing {items.length} of {items.length} members</span>
              <div className="flex gap-2">
                <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-400 font-medium text-xs rounded-lg cursor-not-allowed">
                  Previous
                </button>
                <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
