"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getTasks } from "@/features/tasks/api/tasks.api";
import { Task } from "@/features/tasks/types/task.type";
import {
  createTaskFromTeamReportItem,
  dismissTeamReportActionItem,
  getTeamReportActionItems,
  requestHandoverFromTeamReportItem,
} from "../api/ai-reports.api";
import {
  TeamReportActionItem,
  TeamReportActionItemSource,
  TeamReportActionItemStatus,
} from "../types/ai-report.type";
import {
  ActionItemDialogMode,
  ActionItemDialogResult,
  TeamReportActionItemDialog,
} from "./TeamReportActionItemDialog";

type TeamReportActionItemsProps = {
  workspaceId: string;
  projectId: string;
  reportId: string;
  sprintId?: string | null;
  /** Chi truong nhom moi duoc tao task hoac de nghi ban giao. */
  canManage: boolean;
};

/** Muc dang mo hop thoai kem hanh dong tuong ung. */
type PendingDialog = {
  item: TeamReportActionItem;
  mode: ActionItemDialogMode;
};

const sourceLabels: Record<TeamReportActionItemSource, string> = {
  BLOCKER: "Vướng mắc",
  RECOMMENDATION: "Đề xuất",
};

const statusStyles: Record<
  TeamReportActionItemStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Chờ xử lý",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  TASK_CREATED: {
    label: "Đã tạo task",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  HANDOVER_REQUESTED: {
    label: "Đã đề nghị bàn giao",
    className: "border-brand-200 bg-brand-50 text-brand-700",
  },
  DISMISSED: {
    label: "Đã bỏ qua",
    className: "border-zinc-200 bg-zinc-50 text-zinc-500",
  },
};

/**
 * Bang vuong mac va de xuat cua mot phien giao ban.
 *
 * Gop hai nhom vao mot bang de truong nhom xu ly mot luot; cot "Nhom" cho biet
 * muc den tu dau. Moi muc chi xu ly duoc mot lan, sau do chi con xem lai.
 */
export function TeamReportActionItems({
  workspaceId,
  projectId,
  reportId,
  sprintId,
  canManage,
}: TeamReportActionItemsProps) {
  const [items, setItems] = useState<TeamReportActionItem[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pendingDialog, setPendingDialog] = useState<PendingDialog | null>(null);

  useEffect(() => {
    let active = true;

    setIsLoading(true);
    getTeamReportActionItems(workspaceId, projectId, reportId)
      .then((response) => {
        if (!active) return;
        setItems(response.data.items);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không tải được danh sách vướng mắc.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [workspaceId, projectId, reportId]);

  // Thanh vien va task chi can cho hop thoai, va chi truong nhom moi mo duoc,
  // nen bo qua khi khong co quyen de khong goi API vo ich.
  useEffect(() => {
    if (!canManage) return;

    let active = true;

    void Promise.all([
      getWorkspaceMembers(workspaceId),
      getTasks(workspaceId, projectId, { page: 1, limit: 100 }),
    ])
      .then(([memberRes, taskRes]) => {
        if (!active) return;
        setMembers(memberRes.data.items);
        setTasks(taskRes.data.items);
      })
      .catch(() => {
        // Danh sach goi y khong tai duoc thi hop thoai van mo, chi la it lua chon.
      });

    return () => {
      active = false;
    };
  }, [canManage, workspaceId, projectId]);

  /** Task dang chay moi co y nghia khi de nghi ban giao. */
  const handoverableTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.status === "IN_PROGRESS" || task.status === "REVIEW",
      ),
    [tasks],
  );

  function itemKey(item: TeamReportActionItem) {
    return `${item.source}#${item.itemIndex}`;
  }

  function replaceItem(next: TeamReportActionItem) {
    setItems((current) =>
      current.map((item) =>
        item.source === next.source && item.itemIndex === next.itemIndex
          ? next
          : item,
      ),
    );
  }

  async function runAction(
    item: TeamReportActionItem,
    action: () => Promise<TeamReportActionItem>,
    fallbackMessage: string,
  ) {
    setBusyKey(itemKey(item));
    setError("");

    try {
      replaceItem(await action());
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : fallbackMessage,
      );
    } finally {
      setBusyKey(null);
    }
  }

  /** Dieu phoi ket qua hop thoai sang dung endpoint. */
  function handleDialogConfirm(result: ActionItemDialogResult) {
    if (!pendingDialog) return;

    const { item, mode } = pendingDialog;
    setPendingDialog(null);

    if (mode === "create-task") {
      void runAction(
        item,
        async () => {
          const response = await createTaskFromTeamReportItem(
            workspaceId,
            projectId,
            reportId,
            {
              source: item.source,
              itemIndex: item.itemIndex,
              sprintId: sprintId ?? undefined,
              assigneeId: result.assigneeId,
              dueDate: result.dueDate,
            },
          );
          return response.data.item;
        },
        "Không tạo được task từ nội dung này.",
      );
      return;
    }

    if (mode === "request-handover") {
      void runAction(
        item,
        async () => {
          const response = await requestHandoverFromTeamReportItem(
            workspaceId,
            projectId,
            reportId,
            {
              source: item.source,
              itemIndex: item.itemIndex,
              taskId: result.taskId as string,
              suggestedReceiverId: result.suggestedReceiverId as string,
              note: result.note,
            },
          );
          return response.data.item;
        },
        "Không gửi được đề nghị bàn giao.",
      );
      return;
    }

    void runAction(
      item,
      async () => {
        const response = await dismissTeamReportActionItem(
          workspaceId,
          projectId,
          reportId,
          item.source,
          item.itemIndex,
          result.note,
        );
        return response.data.item;
      },
      "Không bỏ qua được nội dung này.",
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-zinc-200 bg-white">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm font-semibold text-zinc-500">
        Phiên này không có vướng mắc hay đề xuất nào cần xử lý.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200">
        <table className="min-w-[860px] divide-y divide-zinc-200 text-left text-sm">
          <thead className="bg-brand-50 text-[11px] font-bold uppercase tracking-wide text-brand-700">
            <tr>
              <th className="px-4 py-3">Nhóm</th>
              <th className="px-4 py-3">Nội dung</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((item) => {
              const key = itemKey(item);
              const isBusy = busyKey === key;
              const status = statusStyles[item.status];

              return (
                <tr key={key}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                        item.source === "BLOCKER"
                          ? "border-rose-200 bg-rose-50 text-rose-700"
                          : "border-brand-200 bg-brand-50 text-brand-700"
                      }`}
                    >
                      {sourceLabels[item.source]}
                    </span>
                  </td>
                  <td className="max-w-md px-4 py-3 font-semibold text-zinc-800">
                    {item.text}
                    {item.note ? (
                      <span className="mt-1 block text-xs font-normal text-zinc-500">
                        Ghi chú: {item.note}
                      </span>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {item.createdTaskId ? (
                        <Link
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                          href={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${item.createdTaskId}`}
                        >
                          Mở task
                        </Link>
                      ) : null}
                      {item.targetTaskId ? (
                        <Link
                          className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
                          href={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${item.targetTaskId}`}
                        >
                          Xem task
                        </Link>
                      ) : null}
                      {canManage && item.status === "PENDING" ? (
                        <>
                          <button
                            className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-50"
                            disabled={isBusy}
                            type="button"
                            onClick={() =>
                              setPendingDialog({ item, mode: "dismiss" })
                            }
                          >
                            Bỏ qua
                          </button>
                          <button
                            className="rounded-lg border border-brand-600 px-3 py-2 text-xs font-bold text-brand-700 transition hover:bg-brand-600 hover:text-white disabled:opacity-50"
                            disabled={isBusy}
                            type="button"
                            onClick={() =>
                              setPendingDialog({
                                item,
                                mode: "request-handover",
                              })
                            }
                          >
                            Đề nghị bàn giao
                          </button>
                          <button
                            className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-brand-700 disabled:opacity-50"
                            disabled={isBusy}
                            type="button"
                            onClick={() =>
                              setPendingDialog({ item, mode: "create-task" })
                            }
                          >
                            {isBusy ? "Đang xử lý..." : "Tạo task"}
                          </button>
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pendingDialog ? (
        <TeamReportActionItemDialog
          isSubmitting={busyKey === itemKey(pendingDialog.item)}
          itemText={pendingDialog.item.text}
          members={members}
          mode={pendingDialog.mode}
          tasks={handoverableTasks}
          onCancel={() => setPendingDialog(null)}
          onConfirm={handleDialogConfirm}
        />
      ) : null}
    </div>
  );
}
