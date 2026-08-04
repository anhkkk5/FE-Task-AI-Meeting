"use client";

import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  FolderKanban,
  Mail,
  Plus,
  Radio,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from "lucide-react";
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
import { getProjects } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getWorkspaceDetail } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils/relative-time";

const assignableRoles: Exclude<WorkspaceRole, "OWNER">[] = [
  "SCRUM_MASTER",
  "PROJECT_MANAGER",
  "MEMBER",
  "VIEWER",
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getLookupReasonLabel(reason: WorkspaceMemberLookup["reason"]) {
  if (reason === "ALREADY_ACTIVE_MEMBER") {
    return "Tài khoản này đã là thành viên ACTIVE của Workspace.";
  }

  if (reason === "USER_NOT_ACTIVE") {
    return "Tài khoản này không ở trạng thái ACTIVE nên chưa thể thêm.";
  }

  if (reason === "USER_NOT_FOUND") {
    return "Không tìm thấy tài khoản đã đăng ký với email này.";
  }

  return "";
}

export default function WorkspaceMembersPage() {
  const params = useParams<{ workspaceId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);

  const [items, setItems] = useState<WorkspaceMember[]>([]);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [myRole, setMyRole] = useState<WorkspaceRole | "">("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<WorkspaceRole, "OWNER">>("MEMBER");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [lookupResult, setLookupResult] = useState<WorkspaceMemberLookup | null>(null);
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

  const loadMembersData = useCallback(async () => {
    if (!params.workspaceId) return;

    setIsLoading(true);
    setMessage("");

    try {
      const [membersResponse, roleResponse, workspaceRes, projectsRes] =
        await Promise.allSettled([
          getWorkspaceMembers(params.workspaceId),
          getMyWorkspaceRole(params.workspaceId),
          getWorkspaceDetail(params.workspaceId),
          getProjects(params.workspaceId, { limit: 50 }),
        ]);

      if (membersResponse.status === "fulfilled") {
        setItems(membersResponse.value.data.items);
      } else {
        setMessage("Tải danh sách thành viên thất bại.");
      }

      if (roleResponse.status === "fulfilled") {
        setMyRole(roleResponse.value.data.role);
      }

      if (workspaceRes.status === "fulfilled") {
        setWorkspace(workspaceRes.value.data.workspace);
      }

      if (projectsRes.status === "fulfilled") {
        setProjects(projectsRes.value.data.items);
      }
    } finally {
      setIsLoading(false);
    }
  }, [params.workspaceId]);

  useEffect(() => {
    if (user && params.workspaceId) {
      void loadMembersData();
    }
  }, [user, params.workspaceId, loadMembersData]);

  // Lookup email when typing
  useEffect(() => {
    if (!isOwner || !normalizedEmail) {
      setLookupResult(null);
      setLookupMessage("");
      setIsLookingUp(false);
      return undefined;
    }

    if (!emailPattern.test(normalizedEmail)) {
      setLookupResult(null);
      setLookupMessage("Nhập đúng định dạng email để tìm tài khoản.");
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

        if (cancelled) return;

        setLookupResult(response.data);

        if (!response.data.user) {
          setLookupMessage("Không tìm thấy tài khoản đã đăng ký với email này.");
        } else if (!response.data.canAdd) {
          setLookupMessage(getLookupReasonLabel(response.data.reason));
        } else if (
          response.data.reason === "REMOVED_MEMBER_CAN_BE_REACTIVATED"
        ) {
          setLookupMessage(
            "Tài khoản này từng bị xóa khỏi workspace. Bấm thêm để kích hoạt lại.",
          );
        }
      } catch (error) {
        if (!cancelled) {
          setLookupResult(null);
          setLookupMessage(
            error instanceof Error ? error.message : "Tìm tài khoản thất bại.",
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
      setMessage("Hãy chọn một tài khoản hợp lệ trước khi thêm thành viên.");
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
      setMessage("Đã thêm thành viên mới vào Workspace thành công.");
      await loadMembersData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Thêm thành viên thất bại.");
    }
  }

  async function handleChangeRole(
    memberId: string,
    nextRole: Exclude<WorkspaceRole, "OWNER">,
  ) {
    try {
      await changeWorkspaceMemberRole(params.workspaceId, memberId, {
        role: nextRole,
      });
      setMessage("Cập nhật vai trò thành viên thành công.");
      await loadMembersData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cập nhật vai trò thất bại.");
    }
  }

  async function handleRemove(memberId: string) {
    if (!confirm("Bạn có chắc chắn muốn xóa thành viên này khỏi Workspace không?")) {
      return;
    }

    try {
      await removeWorkspaceMember(params.workspaceId, memberId);
      setMessage("Đã xóa thành viên khỏi Workspace.");
      await loadMembersData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Xóa thành viên thất bại.");
    }
  }

  // Filtered members list
  const filteredMembers = useMemo(() => {
    if (!searchKeyword.trim()) return items;
    const term = searchKeyword.toLowerCase();
    return items.filter(
      (m) =>
        (m.fullName && m.fullName.toLowerCase().includes(term)) ||
        (m.email && m.email.toLowerCase().includes(term)) ||
        m.role.toLowerCase().includes(term),
    );
  }, [items, searchKeyword]);

  // Real member role statistics
  const ownerCount = items.filter((m) => m.role === "OWNER").length;
  const managerCount = items.filter(
    (m) => m.role === "SCRUM_MASTER" || m.role === "PROJECT_MANAGER",
  ).length;
  const memberCount = items.filter(
    (m) => m.role === "MEMBER" || m.role === "VIEWER",
  ).length;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell workspaceId={params.workspaceId}>
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header Toolbar (Chuẩn 100% tiếng Việt & Sang trọng) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Quản lý Thành viên
            </h1>
            <p className="mt-1 text-xs font-semibold text-slate-500 sm:text-sm">
              Không gian làm việc:{" "}
              <strong className="text-slate-900 font-extrabold">
                {workspace?.name || "Workspace"}
              </strong>{" "}
              · Vai trò của bạn:{" "}
              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-extrabold text-blue-700 border border-blue-200/60 uppercase">
                {myRole || "MEMBER"}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const inviteUrl = `${origin}/invite?token=WSP_${params.workspaceId}`;
                void navigator.clipboard.writeText(inviteUrl);
                setMessage("Đã sao chép đường dẫn mời vào bộ nhớ tạm: " + inviteUrl);
              }}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95 shrink-0"
              title="Tạo & sao chép link mời gia nhập Workspace"
            >
              <UserCheck className="h-4 w-4" />
              Sao chép đường dẫn mời
            </button>

            <div className="relative hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm kiếm thành viên theo tên/email..."
                className="h-10 w-72 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>
          </div>
        </div>

        {/* 4 Real Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Tổng thành viên</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {items.length}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Chủ sở hữu (Owner)</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {ownerCount}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Quản lý (PM / SM)</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {managerCount}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <FolderKanban className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500">Dự án trong WSP</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {projects.length}
              </p>
            </div>
          </div>
        </div>

        {/* Message Banner */}
        {message ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs font-bold text-amber-900 shadow-xs">
            {message}
          </div>
        ) : null}

        {/* Khung Thêm Thành Viên Mới (Giao diện rõ ràng context Workspace & Dự án) */}
        {isOwner && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Thêm thành viên mới vào Không gian làm việc
                </h2>
                <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 border border-blue-200/60">
                  {workspace?.name || "Workspace"}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Thành viên gia nhập Workspace{" "}
                <strong className="text-slate-800 font-bold">
                  {workspace?.name}
                </strong>{" "}
                sẽ có quyền truy cập và tham gia vào các dự án thuộc Workspace này{" "}
                {projects.length > 0
                  ? `(hiện có ${projects.length} dự án: ${projects
                      .slice(0, 3)
                      .map((p) => p.name)
                      .join(", ")}${projects.length > 3 ? "..." : ""})`
                  : ""}.
              </p>
            </div>

            <form
              className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px_auto]"
              onSubmit={handleAddMember}
            >
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nhap-email-thanh-vien@company.com"
                  type="email"
                  required
                />
              </div>

              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-blue-500 transition cursor-pointer"
                value={role}
                onChange={(event) =>
                  setRole(event.target.value as Exclude<WorkspaceRole, "OWNER">)
                }
              >
                {assignableRoles.map((item) => (
                  <option key={item} value={item}>
                    Vai trò: {item}
                  </option>
                ))}
              </select>

              <button
                className="h-11 rounded-xl bg-blue-600 px-6 text-xs font-bold text-white transition hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                disabled={!canAddLookedUpUser}
                type="submit"
              >
                + Thêm thành viên
              </button>

              {/* User Lookup Preview Card */}
              <div className="sm:col-span-3">
                {isLookingUp ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3.5 text-xs font-bold text-blue-700">
                    Đang tìm tài khoản trong hệ thống...
                  </div>
                ) : lookupResult?.user ? (
                  <div
                    className={`rounded-2xl border p-4 transition-all ${
                      lookupResult.canAdd
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-amber-200 bg-amber-50/60"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-extrabold text-slate-800 shadow-xs border border-slate-200">
                          {lookupResult.user.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">
                            {lookupResult.user.fullName}
                          </p>
                          <p className="text-xs font-medium text-slate-600">
                            {lookupResult.user.email}
                            {lookupResult.user.jobTitle
                              ? ` · ${lookupResult.user.jobTitle}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-lg bg-white px-3 py-1 text-[10px] font-bold uppercase text-slate-700 border border-slate-200 shadow-2xs">
                          {lookupResult.user.status}
                        </span>
                        {lookupResult.canAdd ? (
                          <span className="rounded-lg bg-emerald-600 px-3 py-1 text-[10px] font-extrabold uppercase text-white shadow-2xs">
                            CÓ THỂ THÊM
                          </span>
                        ) : (
                          <span className="rounded-lg bg-amber-600 px-3 py-1 text-[10px] font-extrabold uppercase text-white shadow-2xs">
                            KHÔNG THỂ THÊM
                          </span>
                        )}
                      </div>
                    </div>
                    {lookupMessage ? (
                      <p className="mt-2.5 text-xs font-bold text-amber-800">
                        {lookupMessage}
                      </p>
                    ) : null}
                  </div>
                ) : lookupMessage ? (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900">
                    {lookupMessage}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-xs font-medium text-slate-500">
                    Nhập email người dùng đã đăng ký để kiểm tra tài khoản trước khi thêm vào Workspace.
                  </div>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Members Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs flex flex-col">
          <div className="p-5 border-b border-slate-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Danh sách thành viên ({filteredMembers.length})
              </h3>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Tất cả người dùng có quyền truy cập vào Workspace này
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-6 py-3.5">THÀNH VIÊN</th>
                  <th className="px-6 py-3.5">VAI TRÒ WORKSPACE</th>
                  <th className="px-6 py-3.5">TRẠNG THÁI</th>
                  <th className="px-6 py-3.5">NGÀY THAM GIA</th>
                  {isOwner && <th className="px-6 py-3.5 text-right">THAO TÁC</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => {
                  const isMemberOwner = member.role === "OWNER";
                  const initials = member.fullName
                    ? member.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()
                    : "U";

                  const roleStyle =
                    member.role === "OWNER"
                      ? "bg-blue-50 text-blue-700 border-blue-200/60"
                      : member.role === "SCRUM_MASTER" ||
                        member.role === "PROJECT_MANAGER"
                      ? "bg-purple-50 text-purple-700 border-purple-200/60"
                      : "bg-slate-100 text-slate-700 border-slate-200/60";

                  return (
                    <tr
                      key={member.memberId}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {member.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.avatarUrl}
                              alt={member.fullName || "Member"}
                              className="h-10 w-10 rounded-full object-cover ring-2 ring-blue-500/20"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-extrabold text-xs shadow-2xs">
                              {initials}
                            </div>
                          )}

                          <div>
                            <p className="font-extrabold text-slate-900 text-sm">
                              {member.fullName || "Người dùng"}
                            </p>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">
                              {member.email || member.userId}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {isOwner && !isMemberOwner ? (
                          <select
                            value={member.role}
                            onChange={(e) =>
                              handleChangeRole(
                                member.memberId,
                                e.target.value as Exclude<WorkspaceRole, "OWNER">,
                              )
                            }
                            className={`rounded-xl border px-3 py-1 text-xs font-extrabold cursor-pointer outline-none ${roleStyle}`}
                          >
                            {assignableRoles.map((r) => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center rounded-xl border px-3 py-1 text-xs font-extrabold ${roleStyle}`}
                          >
                            {member.role}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            member.status === "ACTIVE"
                              ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                              : "bg-amber-50 text-amber-600 border border-amber-200/60"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              member.status === "ACTIVE"
                                ? "bg-emerald-500 animate-pulse"
                                : "bg-amber-500"
                            }`}
                          />
                          {member.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500 font-semibold text-xs">
                        {formatDate(member.joinedAt)}
                      </td>

                      {isOwner && (
                        <td className="px-6 py-4 text-right">
                          {!isMemberOwner ? (
                            <button
                              className="rounded-xl border border-rose-200/80 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100 transition"
                              type="button"
                              onClick={() => void handleRemove(member.memberId)}
                            >
                              Xóa thành viên
                            </button>
                          ) : null}
                        </td>
                      )}
                    </tr>
                  );
                })}

                {filteredMembers.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-12 text-center text-xs font-medium text-slate-400"
                      colSpan={isOwner ? 5 : 4}
                    >
                      Không tìm thấy thành viên nào phù hợp.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Hiển thị {filteredMembers.length} / {items.length} thành viên</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
