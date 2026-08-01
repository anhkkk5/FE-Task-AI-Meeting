"use client";

import Link from "next/link";
import { Project } from "../types/project.type";

type ProjectCardProps = {
  project: Project;
  totalTasks?: number;
  completedTasks?: number;
  members?: { id: string; name: string; avatarUrl?: string | null }[];
};

export function ProjectCard({
  project,
  totalTasks = 0,
  completedTasks = 0,
  members = [],
}: ProjectCardProps) {
  const status = project.status || "ACTIVE";
  const isActive = status === "ACTIVE";
  const keyCode = project.keyCode || "PRJ";

  // Calculate real completion percentage
  const total = totalTasks || 0;
  const completed = completedTasks || 0;
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Custom key code badge color themes (Xanh dương chủ đạo, tuyệt đối không dùng màu tím)
  const tagColors = [
    "bg-[#2563eb] text-white", // Royal Blue
    "bg-blue-600 text-white", // Blue 600
    "bg-sky-600 text-white", // Sky Blue
    "bg-indigo-600 text-white", // Indigo Blue
  ];
  const tagColor =
    tagColors[Math.abs(keyCode.charCodeAt(0) || 0) % tagColors.length];

  return (
    <Link
      href={`/workspaces/${project.workspaceId}/projects/${project.id}`}
      className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md min-h-[220px]"
    >
      <div className="space-y-3">
        {/* Top Tag & Status */}
        <div className="flex items-center justify-between">
          <span
            className={`inline-flex items-center justify-center rounded-xl px-3 py-1 text-xs font-extrabold tracking-wider ${tagColor} shadow-2xs`}
          >
            {keyCode}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-bold ${
              isActive
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                : "bg-slate-100 text-slate-600 border border-slate-200/60"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            {isActive ? "Đang hoạt động" : "Đã hoàn thành"}
          </span>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors leading-tight">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500 leading-relaxed">
            {project.description || "Chưa có mô tả cho dự án này."}
          </p>
        </div>
      </div>

      {/* Progress & Footer */}
      <div className="mt-5 space-y-3 pt-3 border-t border-slate-100">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-500">Tiến độ</span>
            <span className="text-blue-600 font-extrabold">{progressPct}%</span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Members stack & Task count */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex -space-x-1.5 overflow-hidden">
            {members.length > 0 ? (
              members.slice(0, 3).map((m, idx) => {
                const initials = m.name
                  ? m.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "U";
                const colors = [
                  "bg-blue-100 text-blue-700",
                  "bg-purple-100 text-purple-700",
                  "bg-emerald-100 text-emerald-700",
                ];
                return (
                  <div
                    key={m.id || idx}
                    title={m.name}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold border-2 border-white ${
                      colors[idx % colors.length]
                    }`}
                  >
                    {initials}
                  </div>
                );
              })
            ) : (
              <span className="text-[11px] font-medium text-slate-400">
                Thành viên dự án
              </span>
            )}
          </div>

          <span className="font-semibold text-slate-400">
            <strong className="text-slate-700 font-bold">{completed}</strong> / {total} công việc
          </span>
        </div>
      </div>
    </Link>
  );
}
