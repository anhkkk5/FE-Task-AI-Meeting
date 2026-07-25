"use client";

import { Search } from "lucide-react";
import { TaskStatus } from "@/features/tasks/types/task.type";
import { MyWorkProjectOption } from "../types/my-work.type";
import { STATUS_LABEL } from "../utils/my-work.util";

export type StatusFilter = TaskStatus | "OPEN" | "ALL";

type MyWorkFiltersProps = {
  keyword: string;
  onKeywordChange: (value: string) => void;
  projectId: string;
  onProjectChange: (value: string) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  projects: MyWorkProjectOption[];
};

/**
 * Bo loc cua trang "Viec cua toi".
 * Dropdown du an liet ke moi du an cua nguoi dung theo dang
 * "workspace / du an", de nguoi dung chu dong chon chu khong bi mac dinh.
 */
export function MyWorkFilters({
  keyword,
  onKeywordChange,
  projectId,
  onProjectChange,
  status,
  onStatusChange,
  projects,
}: MyWorkFiltersProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          id="my-work-search"
          type="text"
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="Tìm theo tiêu đề hoặc mã task..."
          className="h-10 w-full rounded-xl border border-transparent bg-slate-100/80 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      <select
        id="my-work-project-filter"
        aria-label="Lọc theo dự án"
        value={projectId}
        onChange={(event) => onProjectChange(event.target.value)}
        className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500"
      >
        <option value="">Tất cả dự án</option>
        {projects.map((project) => (
          <option key={project.projectId} value={project.projectId}>
            {project.workspaceName} / {project.projectName}
          </option>
        ))}
      </select>

      <select
        id="my-work-status-filter"
        aria-label="Lọc theo trạng thái"
        value={status}
        onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
        className="h-10 cursor-pointer rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-blue-500"
      >
        <option value="OPEN">Chưa hoàn thành</option>
        <option value="ALL">Tất cả trạng thái</option>
        {(Object.keys(STATUS_LABEL) as TaskStatus[]).map((item) => (
          <option key={item} value={item}>
            {STATUS_LABEL[item]}
          </option>
        ))}
      </select>
    </div>
  );
}
