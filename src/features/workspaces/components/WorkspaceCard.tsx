import { useState } from "react";
import Link from "next/link";
import {
  ClockCircleOutlined,
  EyeOutlined,
  FolderOutlined,
  ProductOutlined,
  ProjectOutlined,
  SettingOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Workspace } from "../types/workspace.type";
import { WorkspaceStatItem } from "@/features/stats/types/stats.type";
import { WorkspaceMember, WorkspaceRole } from "@/features/members/types/member.type";
import { formatRelativeTime } from "@/lib/utils/relative-time";

type WorkspaceCardProps = {
  workspace: Workspace;
  stats?: WorkspaceStatItem;
  members?: WorkspaceMember[];
  isLoadingMembers?: boolean;
};

const ROLE_PRIORITY: Record<WorkspaceRole, number> = {
  OWNER: 1,
  PROJECT_MANAGER: 2,
  SCRUM_MASTER: 3,
  MEMBER: 4,
  VIEWER: 5,
};

const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: "Quản trị / Chủ sở hữu",
  PROJECT_MANAGER: "Quản lý dự án",
  SCRUM_MASTER: "Scrum Master",
  MEMBER: "Thành viên",
  VIEWER: "Người xem",
};

const AVATAR_COLOR_PALETTES = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-indigo-100 text-indigo-700 border-indigo-200",
  "bg-emerald-100 text-emerald-700 border-emerald-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-teal-100 text-teal-700 border-teal-200",
];

function getAvatarColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_COLOR_PALETTES[Math.abs(hash) % AVATAR_COLOR_PALETTES.length];
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

function MemberAvatarItem({ member }: { member: WorkspaceMember }) {
  const [imgError, setImgError] = useState(false);
  const displayName = member.fullName?.trim() || member.email || "Thành viên";
  const roleLabel = ROLE_LABELS[member.role] || member.role;
  const initials = getInitials(member.fullName, member.email);
  const colorClass = getAvatarColor(member.userId || member.email || member.memberId);
  const isOwnerOrAdmin = member.role === "OWNER" || member.role === "PROJECT_MANAGER" || member.role === "SCRUM_MASTER";

  return (
    <div
      className="group/avatar relative inline-block transition-transform duration-150 hover:z-20 hover:scale-110"
      title={`${displayName} • ${roleLabel}`}
    >
      {member.avatarUrl && !imgError ? (
        <img
          src={member.avatarUrl}
          alt={displayName}
          onError={() => setImgError(true)}
          className={`h-7 w-7 rounded-full object-cover border-2 border-white shadow-2xs ${
            isOwnerOrAdmin ? "ring-1.5 ring-blue-500/80" : "ring-1 ring-slate-200"
          }`}
        />
      ) : (
        <div
          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[10px] font-black tracking-tight shadow-2xs ${colorClass} ${
            isOwnerOrAdmin ? "ring-1.5 ring-blue-500/80 font-black" : "ring-1 ring-slate-200"
          }`}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export function WorkspaceCard({
  workspace,
  stats,
  members = [],
  isLoadingMembers = false,
}: WorkspaceCardProps) {
  const memberCount = stats ? String(stats.memberCount) : "—";
  const projectCount = stats ? String(stats.projectCount) : "—";
  const updatedLabel = formatRelativeTime(
    stats?.updatedAt ?? workspace.updatedAt,
  );

  const statusBadgeColor =
    workspace.status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
      : workspace.status === "ARCHIVED"
      ? "bg-rose-50 text-rose-700 border-rose-200/80"
      : "bg-amber-50 text-amber-700 border-amber-200/80";

  const statusLabel =
    workspace.status === "ACTIVE"
      ? "Đang hoạt động"
      : workspace.status === "ARCHIVED"
      ? "Lưu trữ"
      : "Chờ duyệt";

  // Sắp xếp: Quản trị/Admin lên đầu, sau đó đến Member, Viewer
  const sortedMembers = [...members].sort((a, b) => {
    const pA = ROLE_PRIORITY[a.role] ?? 99;
    const pB = ROLE_PRIORITY[b.role] ?? 99;
    return pA - pB;
  });

  const MAX_VISIBLE_AVATARS = 5;
  const visibleMembers = sortedMembers.slice(0, MAX_VISIBLE_AVATARS);
  const remainingCount = sortedMembers.length - MAX_VISIBLE_AVATARS;

  return (
    <article className="group relative flex min-h-[300px] flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md">
      <div>
        {/* Header Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Ant Design ProductOutlined Icon Badge */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-600/20 transition-all group-hover:scale-105">
              <ProductOutlined className="text-2xl" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600">
                {workspace.name}
              </h2>
              <p className="truncate text-xs font-semibold text-slate-400 mt-0.5">
                @{workspace.slug}
              </p>
            </div>
          </div>

          <div className="flex shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${statusBadgeColor}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  workspace.status === "ACTIVE"
                    ? "bg-emerald-500"
                    : workspace.status === "ARCHIVED"
                    ? "bg-rose-500"
                    : "bg-amber-500"
                }`}
              />
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Description */}
        <div className="mt-4">
          {workspace.description ? (
            <p className="line-clamp-2 min-h-10 text-sm font-medium leading-relaxed text-slate-600">
              {workspace.description}
            </p>
          ) : (
            <p className="min-h-10 text-sm font-medium italic text-slate-400">
              Chưa có mô tả cho không gian làm việc này.
            </p>
          )}
        </div>

        {/* Avatar stack của user và quản trị viên thuộc workspace */}
        <div className="mt-4 flex items-center justify-between pt-1">
          <div className="flex items-center">
            {isLoadingMembers ? (
              <div className="flex items-center gap-1.5">
                <div className="h-6 w-6 animate-pulse rounded-full bg-slate-200" />
                <div className="h-6 w-6 animate-pulse rounded-full bg-slate-200" />
                <div className="h-6 w-6 animate-pulse rounded-full bg-slate-200" />
              </div>
            ) : visibleMembers.length > 0 ? (
              <div className="flex -space-x-2 overflow-hidden py-1 pl-1">
                {visibleMembers.map((member) => (
                  <MemberAvatarItem
                    key={member.memberId || member.userId}
                    member={member}
                  />
                ))}

                {remainingCount > 0 && (
                  <div
                    className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-extrabold text-slate-600 shadow-2xs ring-1 ring-slate-200"
                    title={`Còn ${remainingCount} thành viên khác`}
                  >
                    +{remainingCount}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                <UserOutlined className="text-xs" />
                <span>Chưa có thành viên</span>
              </div>
            )}
          </div>

          {visibleMembers.length > 0 && (
            <span className="text-[11px] font-semibold text-slate-400">
              {sortedMembers.length} nhân sự
            </span>
          )}
        </div>
      </div>

      <div>
        {/* Metrics Row - Thiết kế thoáng và rõ nét */}
        <div className="mt-4 grid grid-cols-3 gap-2.5 border-t border-slate-100 pb-2 pt-3.5">
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/90 px-2 py-2.5">
            <div className="mb-0.5 flex items-center gap-1.5 text-blue-600">
              <UserOutlined className="text-xs" />
              <span className="text-sm font-extrabold text-slate-900">
                {memberCount}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Thành viên
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/90 px-2 py-2.5">
            <div className="flex items-center gap-1.5 text-emerald-600 mb-0.5">
              <ProjectOutlined className="text-xs" />
              <span className="text-sm font-extrabold text-slate-900">
                {projectCount}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Dự án
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-slate-50/90 px-2 py-2.5">
            <div className="flex items-center gap-1.5 text-amber-600 mb-0.5">
              <ClockCircleOutlined className="text-xs" />
              <span className="truncate text-xs font-extrabold text-slate-900">
                {updatedLabel}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Cập nhật
            </span>
          </div>
        </div>

        {/* Primary action follows the shared blue application palette. */}
        <div className="mt-3 flex items-center gap-2">
          <Link
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/15 transition-all hover:bg-blue-700 active:scale-95"
            href={`/workspaces/${workspace.id}/projects`}
          >
            <FolderOutlined className="text-sm" />
            <span>Vào Dự án</span>
          </Link>

          <Link
            className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-blue-600 active:scale-95"
            href={`/workspaces/${workspace.id}`}
            title="Chi tiết workspace"
          >
            <EyeOutlined className="text-sm" />
          </Link>

          <Link
            className="inline-flex items-center justify-center rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-blue-600 active:scale-95"
            href={`/workspaces/${workspace.id}/settings`}
            title="Cài đặt workspace"
          >
            <SettingOutlined className="text-sm" />
          </Link>
        </div>
      </div>
    </article>
  );
}
