"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
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
  const [reviewing, setReviewing] = useState<ReviewedMeetingActionItem | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [draft, setDraft] = useState({ title: "", description: "", assigneeId: "", sprintId: "", priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT", dueDate: "" });

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

  useEffect(() => {
    if (!canReview) return;
    void Promise.all([getWorkspaceMembers(workspaceId), getSprints(workspaceId, projectId, { page: 1, limit: 100 })]).then(([memberResponse, sprintResponse]) => {
      setMembers(memberResponse.data.items);
      setSprints(sprintResponse.data.items.filter((sprint) => sprint.status === "PLANNED" || sprint.status === "ACTIVE"));
    }).catch(() => undefined);
  }, [canReview, workspaceId, projectId]);

  function replaceItem(item: ReviewedMeetingActionItem) {
    setReviewedItems((current) =>
      current.map((currentItem) =>
        currentItem.index === item.index ? item : currentItem,
      ),
    );
  }

  function openReview(item: ReviewedMeetingActionItem) {
    setDraft({ title: item.text.slice(0, 200), description: item.text, assigneeId: item.assigneeUserId ?? "", sprintId: "", priority: "MEDIUM", dueDate: item.dueDate?.slice(0, 10) ?? "" });
    setReviewing(item);
  }

  async function handleApprove(item: ReviewedMeetingActionItem) {
    const hasDuplicates = Boolean(item.duplicateCandidates?.length);
    const confirmation = hasDuplicates
      ? `Phát hiện ${item.duplicateCandidates!.length} task tương tự. Bạn vẫn muốn tạo task mới?`
      : "Tạo task từ việc cần làm này?";
    if (!window.confirm(confirmation)) return;

    setBusyIndex(item.index);
    setError("");
    try {
      const response = await approveMeetingActionItem(
        workspaceId,
        projectId,
        summaryId,
        item.index,
        {
          title: draft.title,
          description: draft.description,
          assigneeId: draft.assigneeId || undefined,
          sprintId: draft.sprintId || undefined,
          priority: draft.priority,
          dueDate: draft.dueDate || undefined,
          allowDuplicate: hasDuplicates,
        },
      );
      replaceItem(response.data.actionItem);
      setReviewing(null);
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
                    {item.source ? <span className="mt-1 block text-xs font-normal text-blue-700">Nguồn AI: {item.source}</span> : null}
                    {item.confidence != null ? <span className="mt-1 block text-xs font-normal text-emerald-700">Độ tin cậy transcript: {Math.round(item.confidence * 100)}%</span> : null}
                    {item.citation ? <span className="mt-2 block rounded border border-blue-100 bg-blue-50 p-2 text-xs font-normal text-slate-700"><b>{item.citation.speakerName ?? "Thành viên"}</b> · {new Date(item.citation.startedAt).toLocaleTimeString("vi-VN")}<br />“{item.citation.text}”</span> : null}
                    {item.duplicateCandidates?.length ? (
                      <span className="mt-2 block rounded border border-amber-200 bg-amber-50 p-2 text-xs font-normal text-amber-900">
                        Có thể trùng: {item.duplicateCandidates.map((candidate, index) => <span key={candidate.id}>{index ? ", " : ""}<Link className="font-bold underline" href={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${candidate.id}`}>{candidate.taskCode} ({candidate.similarity}%)</Link></span>)}
                      </span>
                    ) : null}
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
                            onClick={() => openReview(item)}
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
      {reviewing ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"><div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"><h3 className="text-lg font-bold">Duyệt và tạo Task</h3><div className="mt-4 grid gap-3"><label className="grid gap-1 text-xs font-bold">Tiêu đề<input className="rounded-lg border p-2 text-sm" maxLength={200} onChange={(event) => setDraft({ ...draft, title: event.target.value })} value={draft.title} /></label><label className="grid gap-1 text-xs font-bold">Mô tả<textarea className="min-h-24 rounded-lg border p-2 text-sm" maxLength={2000} onChange={(event) => setDraft({ ...draft, description: event.target.value })} value={draft.description} /></label><div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-bold">Người phụ trách<select className="rounded-lg border p-2 text-sm" onChange={(event) => setDraft({ ...draft, assigneeId: event.target.value })} value={draft.assigneeId}><option value="">Chưa gán</option>{members.map((member) => <option key={member.userId} value={member.userId}>{member.fullName || member.email}</option>)}</select></label><label className="grid gap-1 text-xs font-bold">Sprint<select className="rounded-lg border p-2 text-sm" onChange={(event) => setDraft({ ...draft, sprintId: event.target.value })} value={draft.sprintId}><option value="">Backlog</option>{sprints.map((sprint) => <option key={sprint.id} value={sprint.id}>{sprint.name}</option>)}</select></label><label className="grid gap-1 text-xs font-bold">Ưu tiên<select className="rounded-lg border p-2 text-sm" onChange={(event) => setDraft({ ...draft, priority: event.target.value as typeof draft.priority })} value={draft.priority}><option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option><option value="URGENT">Khẩn cấp</option></select></label><label className="grid gap-1 text-xs font-bold">Deadline<input className="rounded-lg border p-2 text-sm" onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })} type="date" value={draft.dueDate} /></label></div></div><div className="mt-5 flex justify-end gap-2"><button className="rounded-lg border px-4 py-2 text-sm font-bold" onClick={() => setReviewing(null)} type="button">Hủy</button><button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={busyIndex != null || draft.title.trim().length < 2} onClick={() => void handleApprove(reviewing)} type="button">Xác nhận tạo Task</button></div></div></div> : null}
    </div>
  );
}
