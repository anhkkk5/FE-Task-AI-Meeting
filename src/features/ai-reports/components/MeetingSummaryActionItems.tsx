"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  approveMeetingActionItem,
  getMeetingActionItems,
  rejectMeetingActionItem,
} from "../api/ai-reports.api";
import {
  MeetingSummaryActionItem,
  ReviewedMeetingActionItem,
} from "../types/ai-report.type";

type MeetingSummaryActionItemsProps = {
  workspaceId: string;
  projectId: string;
  summaryId: string;
  items: MeetingSummaryActionItem[];
};

function initialItems(items: MeetingSummaryActionItem[]) {
  return items.map((item, index) => ({
    ...item,
    index,
    aiStatus: item.status ?? null,
    reviewStatus: "PENDING" as const,
  }));
}

export function MeetingSummaryActionItems({
  workspaceId,
  projectId,
  summaryId,
  items,
}: MeetingSummaryActionItemsProps) {
  const [reviewedItems, setReviewedItems] = useState<ReviewedMeetingActionItem[]>(
    () => initialItems(items),
  );
  const [canReview, setCanReview] = useState(false);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    getMeetingActionItems(workspaceId, projectId, summaryId)
      .then((response) => {
        if (!active) return;
        setReviewedItems(response.data.items);
        setCanReview(response.data.canReview);
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Không thể tải trạng thái duyệt.",
        );
      });

    return () => {
      active = false;
    };
  }, [workspaceId, projectId, summaryId]);

  function replaceItem(item: ReviewedMeetingActionItem) {
    setReviewedItems((current) =>
      current.map((currentItem) =>
        currentItem.index === item.index ? item : currentItem,
      ),
    );
  }

  async function handleApprove(item: ReviewedMeetingActionItem) {
    if (!window.confirm("Tạo task từ việc cần làm này?")) return;

    setBusyIndex(item.index);
    setError("");
    try {
      const response = await approveMeetingActionItem(
        workspaceId,
        projectId,
        summaryId,
        item.index,
        {
          assigneeId: item.assigneeUserId ?? undefined,
          dueDate: item.dueDate?.slice(0, 10) || undefined,
        },
      );
      replaceItem(response.data.actionItem);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể tạo task.",
      );
    } finally {
      setBusyIndex(null);
    }
  }

  async function handleReject(item: ReviewedMeetingActionItem) {
    const reason = window.prompt("Lý do từ chối (không bắt buộc):", "");
    if (reason === null) return;

    setBusyIndex(item.index);
    setError("");
    try {
      const response = await rejectMeetingActionItem(
        workspaceId,
        projectId,
        summaryId,
        item.index,
        reason,
      );
      replaceItem(response.data.actionItem);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Không thể từ chối đề xuất.",
      );
    } finally {
      setBusyIndex(null);
    }
  }

  if (!reviewedItems.length) {
    return (
      <p className="border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm font-semibold text-zinc-500">
        Chưa có việc cần làm được ghi nhận.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto border border-zinc-200">
        <table className="min-w-[880px] divide-y divide-zinc-200 text-left text-sm">
          <thead className="bg-zinc-50 text-[11px] font-bold uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3">Việc cần làm</th>
              <th className="px-4 py-3">Người phụ trách</th>
              <th className="px-4 py-3">Hạn xử lý</th>
              <th className="px-4 py-3">Trạng thái duyệt</th>
              <th className="px-4 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {reviewedItems.map((item) => {
              const isBusy = busyIndex === item.index;

              return (
                <tr key={`${item.index}-${item.text}`}>
                  <td className="max-w-md px-4 py-3 font-semibold text-zinc-800">
                    {item.text}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.assigneeName ?? "Chưa xác định"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {item.dueDate?.slice(0, 10) ?? "Chưa có"}
                  </td>
                  <td className="px-4 py-3">
                    {item.reviewStatus === "TASK_CREATED" ? (
                      <span className="font-semibold text-emerald-700">
                        Đã tạo task
                      </span>
                    ) : item.reviewStatus === "REJECTED" ? (
                      <span
                        className="font-semibold text-zinc-500"
                        title={item.rejectionReason ?? undefined}
                      >
                        Đã từ chối
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-700">
                        Chờ duyệt
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {item.reviewStatus === "TASK_CREATED" &&
                      item.createdTaskId ? (
                        <Link
                          className="border border-zinc-300 px-3 py-2 font-semibold text-zinc-700 hover:bg-zinc-50"
                          href={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${item.createdTaskId}`}
                        >
                          Mở task
                        </Link>
                      ) : null}
                      {canReview && item.reviewStatus === "PENDING" ? (
                        <>
                          <button
                            className="border border-zinc-300 px-3 py-2 font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                            disabled={isBusy}
                            onClick={() => void handleReject(item)}
                            type="button"
                          >
                            Từ chối
                          </button>
                          <button
                            className="bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                            disabled={isBusy}
                            onClick={() => void handleApprove(item)}
                            type="button"
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
    </div>
  );
}
