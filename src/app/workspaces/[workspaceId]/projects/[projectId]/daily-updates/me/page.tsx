"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  getMyDailyUpdates,
  getPendingDailyUpdateDraft,
  restoreDailyUpdate,
} from "@/features/daily-updates/api/daily-updates.api";
import { DailyUpdateFilter } from "@/features/daily-updates/components/DailyUpdateFilter";
import { DailyUpdateList } from "@/features/daily-updates/components/DailyUpdateList";
import {
  DailyUpdate,
  DailyUpdateQuery,
} from "@/features/daily-updates/types/daily-update.type";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";
import { ArrowRight, Sparkles } from "lucide-react";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

export default function MyDailyUpdatesPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [items, setItems] = useState<DailyUpdate[]>([]);
  const [myRole, setMyRole] = useState("");
  const [query, setQuery] = useState<DailyUpdateQuery>({
    page: 1,
    limit: 20,
  });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<DailyUpdate | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const canViewTeam = managerRoles.includes(myRole);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const today = new Date().toLocaleDateString("en-CA");
      const [projectRes, sprintsRes, roleRes, dailyUpdatesRes, draftRes] =
        await Promise.all([
          getProjectDetail(params.workspaceId, params.projectId),
          getSprints(params.workspaceId, params.projectId, {
            page: 1,
            limit: 100,
          }),
          getMyWorkspaceRole(params.workspaceId),
          getMyDailyUpdates(params.workspaceId, params.projectId, query),
          getPendingDailyUpdateDraft(params.workspaceId, params.projectId, today),
        ]);

      setProject(projectRes.data.project);
      setSprints(sprintsRes.data.items);
      setMyRole(roleRes.data.role);
      setItems(dailyUpdatesRes.data.items);
      setPendingDraft(draftRes.data.draft);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Tải daily update cá nhân thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.projectId, params.workspaceId, query]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadData();
    }
  }, [user, params.workspaceId, params.projectId, loadData]);

  const handleRestore = async (dailyUpdate: DailyUpdate) => {
    setRestoringId(dailyUpdate.id);
    setMessage("");
    try {
      await restoreDailyUpdate(params.workspaceId, params.projectId, dailyUpdate.id);
      setItems((current) => current.filter((item) => item.id !== dailyUpdate.id));
      setMessage("Đã khôi phục Daily Update vào danh sách chính.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Khôi phục Daily Update thất bại.");
    } finally {
      setRestoringId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        <section className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                Daily scrum
              </p>
              <h1 className="mt-1 text-2xl font-black text-zinc-950">
                Daily update của tôi
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-medium text-zinc-500">
                Theo dõi phần đã làm, kế hoạch hôm nay và blocker theo từng
                sprint trong project.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                className="flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-xs font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/create?date=${new Date().toLocaleDateString("en-CA")}${pendingDraft ? "" : "&autoDraft=1"}`}
              >
                <Sparkles className="h-4 w-4" />
                {pendingDraft ? "Xem bản nháp AI" : "Tạo bản nháp AI"}
              </Link>
              {canViewTeam ? (
                <Link
                  className="flex h-10 items-center rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates`}
                >
                  Xem team
                </Link>
              ) : null}
              <Link
                className="flex h-10 items-center rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/create`}
              >
                Viết daily update
              </Link>
            </div>
          </div>
        </section>

        {pendingDraft ? (
          <section className="flex flex-col gap-4 rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                <Sparkles className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">AI đã chuẩn bị bản nháp hôm nay</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Kiểm tra và chỉnh sửa trước 23:59. Nếu bạn chưa kịp duyệt, hệ thống sẽ tự động gửi bản nháp này.
                </p>
              </div>
            </div>
            <Link
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800"
              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/daily-updates/create?date=${pendingDraft.updateDate}`}
            >
              Xem và duyệt <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        ) : null}

        <DailyUpdateFilter
          query={query}
          sprints={sprints}
          onChange={setQuery}
          onRefresh={() => void loadData()}
        />

        <div className="flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          <button
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${!query.archived ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            onClick={() => setQuery((current) => ({ ...current, archived: false, page: 1 }))}
            type="button"
          >
            Đang hiển thị
          </button>
          <button
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${query.archived ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"}`}
            onClick={() => setQuery((current) => ({ ...current, archived: true, page: 1 }))}
            type="button"
          >
            Đã lưu trữ
          </button>
        </div>

        {message ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded-2xl border border-zinc-200 bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : (
          <DailyUpdateList
            onRestore={query.archived ? (item) => void handleRestore(item) : undefined}
            restoringId={restoringId}
            emptyText={query.archived ? "Bạn chưa lưu trữ Daily Update nào." : "Bạn chưa có Daily Update nào trong bộ lọc hiện tại."}
            items={items}
            projectId={params.projectId}
            workspaceId={params.workspaceId}
          />
        )}
      </div>
    </AppShell>
  );
}
