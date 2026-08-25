"use client";

import { confirmAction } from "@/components/feedback/AppDialogProvider";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  Plus,
  Search,
  Filter,
  Layers,
  Quote,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
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

function cleanActionItemText(item: ReviewedMeetingActionItem) {
  const text = item.text.trim();
  const separator = text.indexOf(":");
  if (separator < 1) return text;
  const prefix = text.slice(0, separator).trim();
  const speaker = item.citation?.speakerName?.trim();
  const looksLikeAccount = /^[\p{L}\p{N}_.-]{1,30}$/u.test(prefix);
  const isKnownSpeaker = Boolean(
    speaker && prefix.localeCompare(speaker, undefined, { sensitivity: "accent" }) === 0,
  );
  return isKnownSpeaker || looksLikeAccount
    ? text.slice(separator + 1).trim()
    : text;
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
  const [filterStatus, setFilterStatus] = useState<"ALL" | "PENDING" | "TASK_CREATED" | "REJECTED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCitations, setExpandedCitations] = useState<Record<number, boolean>>({});
  const [reviewing, setReviewing] = useState<ReviewedMeetingActionItem | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    assigneeId: "",
    sprintId: "",
    priority: "MEDIUM" as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
    dueDate: "",
  });

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
            : "Không thể tải trạng thái duyệt việc cần làm.",
        );
      });

    return () => {
      active = false;
    };
  }, [workspaceId, projectId, summaryId]);

  useEffect(() => {
    if (!canReview) return;
    void Promise.all([
      getWorkspaceMembers(workspaceId),
      getSprints(workspaceId, projectId, { page: 1, limit: 100 }),
    ])
      .then(([memberResponse, sprintResponse]) => {
        setMembers(memberResponse.data.items);
        setSprints(
          sprintResponse.data.items.filter(
            (sprint) => sprint.status === "PLANNED" || sprint.status === "ACTIVE",
          ),
        );
      })
      .catch(() => undefined);
  }, [canReview, workspaceId, projectId]);

  function replaceItem(item: ReviewedMeetingActionItem) {
    setReviewedItems((current) =>
      current.map((currentItem) =>
        currentItem.index === item.index ? item : currentItem,
      ),
    );
  }

  function toggleCitation(index: number) {
    setExpandedCitations((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  }

  function openReview(item: ReviewedMeetingActionItem) {
    const cleanText = cleanActionItemText(item);
    const firstSentence = cleanText.split(/[.!?\n]/)[0]?.trim();
    const defaultTitle = firstSentence && firstSentence.length > 5 ? firstSentence.slice(0, 120) : cleanText.slice(0, 120);

    setDraft({
      title: defaultTitle,
      description: cleanText,
      assigneeId: item.assigneeUserId ?? "",
      sprintId: "",
      priority: "MEDIUM",
      dueDate: item.dueDate?.slice(0, 10) ?? "",
    });
    setReviewing(item);
  }

  async function handleApprove(item: ReviewedMeetingActionItem) {
    const hasDuplicates = Boolean(item.duplicateCandidates?.length);
    const confirmation = hasDuplicates
      ? `Phát hiện ${item.duplicateCandidates!.length} công việc tương tự. Bạn vẫn muốn tạo công việc mới?`
      : "Xác nhận tạo công việc từ mục này?";
    
    if (
      !(await confirmAction({
        title: "Tạo công việc từ việc cần làm",
        description: confirmation,
        confirmLabel: "Tạo công việc",
      }))
    )
      return;

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

  // Thống kê số lượng
  const stats = useMemo(() => {
    const total = reviewedItems.length;
    const pending = reviewedItems.filter((i) => i.reviewStatus === "PENDING").length;
    const created = reviewedItems.filter((i) => i.reviewStatus === "TASK_CREATED").length;
    const rejected = reviewedItems.filter((i) => i.reviewStatus === "REJECTED").length;
    return { total, pending, created, rejected };
  }, [reviewedItems]);

  // Danh sách đã filter & search
  const filteredItems = useMemo(() => {
    return reviewedItems.filter((item) => {
      if (filterStatus !== "ALL" && item.reviewStatus !== filterStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchText = item.text.toLowerCase().includes(q);
        const matchAssignee = item.assigneeName?.toLowerCase().includes(q);
        return matchText || matchAssignee;
      }
      return true;
    });
  }, [reviewedItems, filterStatus, searchQuery]);

  if (!reviewedItems.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-8 text-center">
        <Sparkles className="mx-auto h-8 w-8 text-slate-400 mb-2" />
        <p className="text-sm font-bold text-slate-700">Chưa có việc cần làm nào được ghi nhận</p>
        <p className="text-xs text-slate-500 mt-1">AI không phát hiện việc giao việc hoặc hành động cần xử lý trong cuộc họp này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Thanh lọc và tìm kiếm */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl bg-slate-50/80 p-2.5 border border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterStatus("ALL")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              filterStatus === "ALL"
                ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            Tất cả ({stats.total})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("PENDING")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              filterStatus === "PENDING"
                ? "bg-amber-500 text-white shadow-xs"
                : "text-amber-700 hover:bg-amber-50"
            }`}
          >
            <Clock className="h-3 w-3" />
            Chờ duyệt ({stats.pending})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("TASK_CREATED")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              filterStatus === "TASK_CREATED"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-emerald-700 hover:bg-emerald-50"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            Đã tạo task ({stats.created})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus("REJECTED")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
              filterStatus === "REJECTED"
                ? "bg-slate-700 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-200/60"
            }`}
          >
            <XCircle className="h-3 w-3" />
            Đã từ chối ({stats.rejected})
          </button>
        </div>

        <div className="relative min-w-[200px] sm:w-64">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo nội dung, người nhận..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Danh sách Action Items dạng Thẻ thông minh */}
      {filteredItems.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs font-semibold text-slate-500">
          Không có việc cần làm nào khớp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((item) => {
            const isBusy = busyIndex === item.index;
            const hasDuplicates = Boolean(item.duplicateCandidates?.length);
            const isExpanded = Boolean(expandedCitations[item.index]);

            return (
              <div
                key={`${item.index}-${item.text}`}
                className={`relative rounded-xl border p-4 transition-all duration-200 ${
                  item.reviewStatus === "TASK_CREATED"
                    ? "border-emerald-200 bg-emerald-50/20"
                    : item.reviewStatus === "REJECTED"
                    ? "border-slate-200 bg-slate-50/60 opacity-80"
                    : "border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm"
                }`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  {/* Cột trái: Nội dung và metadata */}
                  <div className="space-y-2.5 flex-1 min-w-0">
                    {/* Status & Assignee Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      {item.reviewStatus === "TASK_CREATED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" /> Đã tạo task
                        </span>
                      ) : item.reviewStatus === "REJECTED" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700">
                          <XCircle className="h-3 w-3" /> Đã từ chối
                          {item.rejectionReason ? ` (${item.rejectionReason})` : ""}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                          <Clock className="h-3 w-3" /> Chờ duyệt
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        <User className="h-3 w-3 text-slate-500" />
                        {item.assigneeName || "Chưa xác định"}
                      </span>

                      {item.dueDate ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          Hạn: {item.dueDate.slice(0, 10)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          Chưa có hạn
                        </span>
                      )}

                      {item.confidence != null ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                          <Sparkles className="h-3 w-3" />
                          Độ tin cậy: {Math.round(item.confidence * 100)}%
                        </span>
                      ) : null}
                    </div>

                    {/* Action Item Text */}
                    <p className="text-sm font-semibold leading-relaxed text-slate-900">
                      {cleanActionItemText(item)}
                    </p>

                    {/* Cảnh báo trùng task nếu có */}
                    {hasDuplicates && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-2.5 text-xs text-amber-900">
                        <div className="flex items-center gap-1.5 font-bold mb-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                          <span>Phát hiện task có thể tương đồng trong dự án:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.duplicateCandidates?.map((candidate) => (
                            <Link
                              key={candidate.id}
                              href={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${candidate.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 font-bold text-amber-800 border border-amber-200 hover:bg-amber-100 transition"
                            >
                              <span>{candidate.taskCode}: {candidate.title}</span>
                              <span className="text-[10px] text-amber-600">({candidate.similarity}%)</span>
                              <ExternalLink className="h-3 w-3 ml-0.5" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Trích dẫn cuộc họp (Transcript citation) */}
                    {item.citation && (
                      <div className="text-xs">
                        <button
                          type="button"
                          onClick={() => toggleCitation(item.index)}
                          className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-800 transition"
                        >
                          <Quote className="h-3 w-3" />
                          {isExpanded ? "Ẩn trích dẫn gốc" : "Xem trích dẫn phát biểu"}
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>

                        {isExpanded && (
                          <div className="mt-1.5 rounded-lg border border-blue-100 bg-blue-50/50 p-2.5 text-slate-700">
                            <div className="font-bold text-blue-950 flex items-center gap-1.5 mb-1">
                              <span>{item.citation.speakerName || "Người nói"}</span>
                              <span className="text-slate-400 font-normal">·</span>
                              <span className="text-slate-500 font-medium">
                                {new Date(item.citation.startedAt).toLocaleTimeString("vi-VN")}
                              </span>
                            </div>
                            <p className="italic text-slate-600">“{item.citation.text}”</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Cột phải: Các nút hành động */}
                  <div className="flex shrink-0 items-center gap-2 lg:flex-col lg:items-end">
                    {item.reviewStatus === "TASK_CREATED" && item.createdTaskId ? (
                      <Link
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 transition shadow-2xs"
                        href={`/workspaces/${workspaceId}/projects/${projectId}/tasks/${item.createdTaskId}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Mở Task
                      </Link>
                    ) : null}

                    {canReview && item.reviewStatus === "PENDING" ? (
                      <div className="flex items-center gap-2">
                        <button
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-rose-600 disabled:opacity-50"
                          disabled={isBusy}
                          onClick={() => void handleReject(item)}
                          type="button"
                          title="Từ chối việc cần làm này"
                        >
                          <X className="h-3.5 w-3.5" />
                          Từ chối
                        </button>
                        <button
                          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
                          disabled={isBusy}
                          onClick={() => openReview(item)}
                          type="button"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {isBusy ? "Đang xử lý..." : "Tạo Task"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Duyệt & Tạo Task */}
      {reviewing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Plus className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Duyệt & Tạo Công việc mới</h3>
                  <p className="text-xs text-slate-500">Chuyển việc cần làm từ cuộc họp thành Task trong dự án</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReviewing(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề công việc <span className="text-rose-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  maxLength={200}
                  placeholder="Nhập tiêu đề task ngắn gọn..."
                  onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  value={draft.title}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mô tả chi tiết
                </label>
                <textarea
                  className="w-full min-h-[90px] rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  maxLength={2000}
                  placeholder="Nội dung mô tả hoặc ngữ cảnh phát sinh..."
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  value={draft.description}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Người phụ trách
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    onChange={(event) => setDraft({ ...draft, assigneeId: event.target.value })}
                    value={draft.assigneeId}
                  >
                    <option value="">Chưa gán người phụ trách</option>
                    {members.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.fullName || member.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sprint
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    onChange={(event) => setDraft({ ...draft, sprintId: event.target.value })}
                    value={draft.sprintId}
                  >
                    <option value="">Đưa vào Backlog</option>
                    {sprints.map((sprint) => (
                      <option key={sprint.id} value={sprint.id}>
                        {sprint.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        priority: event.target.value as typeof draft.priority,
                      })
                    }
                    value={draft.priority}
                  >
                    <option value="LOW">Thấp (Low)</option>
                    <option value="MEDIUM">Trung bình (Medium)</option>
                    <option value="HIGH">Cao (High)</option>
                    <option value="URGENT">Khẩn cấp (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hạn hoàn thành (Deadline)
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-hidden"
                    onChange={(event) => setDraft({ ...draft, dueDate: event.target.value })}
                    type="date"
                    value={draft.dueDate}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                onClick={() => setReviewing(null)}
                type="button"
              >
                Hủy
              </button>
              <button
                className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 transition disabled:opacity-50"
                disabled={busyIndex != null || draft.title.trim().length < 2}
                onClick={() => void handleApprove(reviewing)}
                type="button"
              >
                Xác nhận tạo Task
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
