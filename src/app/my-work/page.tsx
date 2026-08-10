"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ListChecks, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { getMyWork } from "@/features/my-work/api/my-work.api";
import {
  MyWorkFilters,
  StatusFilter,
} from "@/features/my-work/components/MyWorkFilters";
import { MyWorkSummaryCards } from "@/features/my-work/components/MyWorkSummaryCards";
import { MyWorkTaskList } from "@/features/my-work/components/MyWorkTaskList";
import { MyWorkData } from "@/features/my-work/types/my-work.type";
import { OPEN_STATUSES, isOverdue } from "@/features/my-work/utils/my-work.util";
import { useAuth } from "@/hooks/useAuth";

export default function MyWorkPage() {
  const { user, isLoading: authLoading } = useAuth(true);
  const [data, setData] = useState<MyWorkData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("OPEN");
  const [projectFilter, setProjectFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [dependencyFilter, setDependencyFilter] = useState<"ALL" | "BLOCKED" | "BLOCKING">("ALL");

  const loadMyWork = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setMessage("");

    try {
      setData(await getMyWork(user.id));
    } catch (error) {
      setData(null);
      setMessage(
        error instanceof Error ? error.message : "Tải công việc thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadMyWork();
  }, [loadMyWork]);

  const tasks = data?.tasks ?? [];

  const summary = useMemo(
    () => ({
      open: tasks.filter((task) => OPEN_STATUSES.includes(task.status)).length,
      inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,
      overdue: tasks.filter(isOverdue).length,
      done: tasks.filter((task) => task.status === "DONE").length,
    }),
    [tasks],
  );

  const visibleTasks = useMemo(() => {
    const search = keyword.trim().toLowerCase();

    return tasks
      .filter((task) => {
        if (statusFilter === "OPEN") return OPEN_STATUSES.includes(task.status);
        if (statusFilter === "ALL") return true;
        return task.status === statusFilter;
      })
      .filter((task) => dependencyFilter === "ALL" ? true : dependencyFilter === "BLOCKED" ? task.isBlocked : task.isBlocking)
      .filter((task) =>
        projectFilter ? task.projectId === projectFilter : true,
      )
      .filter((task) => {
        if (!search) return true;
        return (
          task.title.toLowerCase().includes(search) ||
          task.taskCode.toLowerCase().includes(search)
        );
      })
      .sort((left, right) => {
        // Task khong co han xuong cuoi, con lai uu tien han gan nhat.
        if (!left.dueDate && !right.dueDate) return 0;
        if (!left.dueDate) return 1;
        if (!right.dueDate) return -1;
        return left.dueDate.localeCompare(right.dueDate);
      });
  }, [tasks, statusFilter, projectFilter, keyword, dependencyFilter]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="flex items-center gap-2.5 text-xl font-extrabold text-slate-900">
              <ListChecks className="h-5 w-5 text-blue-600" />
              Việc của tôi
            </h1>
            <p className="mt-0.5 text-sm font-medium text-slate-500">
              Toàn bộ task được giao cho bạn, tổng hợp từ mọi workspace và dự án
            </p>
          </div>
          <button
            id="my-work-refresh"
            type="button"
            onClick={() => void loadMyWork()}
            disabled={isLoading}
            className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </button>
        </div>

        {message ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {message}
          </div>
        ) : null}

        {data && data.failedProjects > 0 ? (
          <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Có {data.failedProjects} dự án chưa tải được task, số liệu bên dưới
            có thể chưa đầy đủ.
          </div>
        ) : null}

        <MyWorkSummaryCards
          summary={summary}
          isPending={isLoading && !data}
        />

        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
          <MyWorkFilters
            keyword={keyword}
            onKeywordChange={setKeyword}
            projectId={projectFilter}
            onProjectChange={setProjectFilter}
            status={statusFilter}
            onStatusChange={setStatusFilter}
            projects={data?.projects ?? []}
            dependency={dependencyFilter}
            onDependencyChange={setDependencyFilter}
          />
          <MyWorkTaskList tasks={visibleTasks} isLoading={isLoading && !data} />
        </section>
      </div>
    </AppShell>
  );
}
