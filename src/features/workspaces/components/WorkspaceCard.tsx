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
import { formatRelativeTime } from "@/lib/utils/relative-time";

type WorkspaceCardProps = {
  workspace: Workspace;
  stats?: WorkspaceStatItem;
};

export function WorkspaceCard({ workspace, stats }: WorkspaceCardProps) {
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

  return (
    <article className="group relative flex flex-col justify-between h-full rounded-3xl border border-[#c9dfea]/80 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[#367ea2] hover:shadow-md">
      <div>
        {/* Header Info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Ant Design ProductOutlined Icon Badge */}
            <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#367ea2]/10 text-[#367ea2] border border-[#367ea2]/20 shadow-2xs group-hover:bg-[#367ea2] group-hover:text-white transition-all">
              <ProductOutlined className="text-2xl" />
            </div>

            <div className="min-w-0">
              <h2 className="truncate text-base font-bold tracking-tight text-[#164654] group-hover:text-[#367ea2] transition-colors">
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
            <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-600">
              {workspace.description}
            </p>
          ) : (
            <p className="text-xs font-medium text-slate-400 italic">
              Chưa có mô tả cho không gian làm việc này.
            </p>
          )}
        </div>
      </div>

      <div>
        {/* Metrics Row - Thiết kế thoáng và rõ nét */}
        <div className="mt-5 grid grid-cols-3 gap-2.5 border-t border-slate-100 pt-4 pb-2">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50/90 py-2.5 px-2 border border-slate-100">
            <div className="flex items-center gap-1.5 text-[#367ea2] mb-0.5">
              <UserOutlined className="text-xs" />
              <span className="text-sm font-extrabold text-[#164654]">
                {memberCount}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Thành viên
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50/90 py-2.5 px-2 border border-slate-100">
            <div className="flex items-center gap-1.5 text-emerald-600 mb-0.5">
              <ProjectOutlined className="text-xs" />
              <span className="text-sm font-extrabold text-[#164654]">
                {projectCount}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Dự án
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50/90 py-2.5 px-2 border border-slate-100">
            <div className="flex items-center gap-1.5 text-amber-600 mb-0.5">
              <ClockCircleOutlined className="text-xs" />
              <span className="text-xs font-extrabold text-[#164654] truncate">
                {updatedLabel}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              Cập nhật
            </span>
          </div>
        </div>

        {/* Action Buttons - Nút chính "Vào dự án" nổi bật màu xanh #367ea2 */}
        <div className="mt-3 flex items-center gap-2">
          <Link
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#367ea2] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#2b6887] active:scale-95"
            href={`/workspaces/${workspace.id}/projects`}
          >
            <FolderOutlined className="text-sm" />
            <span>Vào Dự án</span>
          </Link>

          <Link
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
            href={`/workspaces/${workspace.id}`}
            title="Chi tiết workspace"
          >
            <EyeOutlined className="text-sm" />
          </Link>

          <Link
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
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
