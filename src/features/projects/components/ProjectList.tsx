"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Project } from "../types/project.type";
import { ProjectCard } from "./ProjectCard";

type ProjectListProps = {
  items: Project[];
  workspaceId?: string;
  canCreate?: boolean;
};

export function ProjectList({ items, workspaceId, canCreate = true }: ProjectListProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Existing Project Cards */}
      {items.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}

      {/* Card Tạo dự án mới (Chuẩn thiết kế Ảnh 2) */}
      {canCreate && workspaceId ? (
        <Link
          href={`/workspaces/${workspaceId}/projects/create`}
          className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/30 hover:shadow-xs min-h-[220px]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100/70 text-blue-600 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xs">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
            Tạo dự án mới
          </h3>
          <p className="mt-1 max-w-xs text-xs font-medium text-slate-400">
            Bắt đầu một dự án mới để quản lý công việc và tiến độ đội nhóm
          </p>
        </Link>
      ) : null}
    </div>
  );
}
