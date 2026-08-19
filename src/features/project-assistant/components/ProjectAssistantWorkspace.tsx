"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { createTask } from "@/features/tasks/api/tasks.api";
import { assignTask, moveTaskToSprint, updateTask, updateTaskStatus } from "@/features/tasks/api/tasks.api";
import { getWorkspaceMembers } from "@/features/members/api/members.api";
import { WorkspaceMember } from "@/features/members/types/member.type";
import {
  askProjectAssistant,
  clearProjectAssistantHistory,
  getProjectAssistantHistory,
  getSprintRisk,
} from "../api/project-assistant.api";
import {
  AssistantSource,
  ProjectAssistantAnswer,
  ProjectAssistantActionDraft,
  RiskSeverity,
  SprintRiskAssessment,
  SprintRiskLevel,
} from "../types/project-assistant.type";

type ProjectAssistantWorkspaceProps = {
  workspaceId: string;
  projectId: string;
  sprints: Sprint[];
};

type ConversationItem = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: AssistantSource[];
  actionDraft?: ProjectAssistantActionDraft;
};

const defaultQuestions = [
  "Sprint này có nguy cơ trễ không?",
  "Task nào đang quá hạn hoặc bị đình trệ?",
  "Ai đang có trở ngại cần hỗ trợ?",
  "Tôi nên ưu tiên xử lý việc gì hôm nay?",
];

const riskStyles: Record<SprintRiskLevel, string> = {
  LOW: "border-[#baf3db] bg-[#dcfff1] text-[#216e4e]",
  MEDIUM: "border-[#f8e6a0] bg-[#fff7d6] text-[#7f5f01]",
  HIGH: "border-[#fec195] bg-[#fff3eb] text-[#a54800]",
  CRITICAL: "border-[#ffd2cc] bg-[#fff4f2] text-[#ae2a19]",
};

const signalStyles: Record<RiskSeverity, string> = {
  INFO: "border-[#b3d4ff] bg-[#e9f2ff]",
  WARNING: "border-[#f8e6a0] bg-[#fff7d6]",
  DANGER: "border-[#ffd2cc] bg-[#fff4f2]",
};

function sourceHref(
  source: AssistantSource,
  workspaceId: string,
  projectId: string,
) {
  if (source.type === "TASK") {
    return `/workspaces/${workspaceId}/projects/${projectId}/tasks/${source.id}`;
  }

  if (source.type === "SPRINT") {
    return `/workspaces/${workspaceId}/projects/${projectId}/sprints`;
  }

  if (source.type === "DAILY_UPDATE") {
    return `/workspaces/${workspaceId}/projects/${projectId}/daily-updates/me`;
  }

  return `/workspaces/${workspaceId}/projects/${projectId}`;
}

export function ProjectAssistantWorkspace({
  workspaceId,
  projectId,
  sprints,
}: ProjectAssistantWorkspaceProps) {
  const initialSprintId = useMemo(
    () =>
      sprints.find((sprint) => sprint.status === "ACTIVE")?.id ??
      sprints.find((sprint) => sprint.status === "PLANNED")?.id ??
      sprints[0]?.id ??
      "",
    [sprints],
  );
  const [selectedSprintId, setSelectedSprintId] = useState(initialSprintId);
  const [risk, setRisk] = useState<SprintRiskAssessment | null>(null);
  const [riskMessage, setRiskMessage] = useState("");
  const [isRiskLoading, setIsRiskLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem[]>([]);
  const [suggestedQuestions, setSuggestedQuestions] =
    useState(defaultQuestions);
  const [pendingAction, setPendingAction] = useState<ProjectAssistantActionDraft | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [members, setMembers] = useState<WorkspaceMember[]>([]);

  const loadRisk = useCallback(async () => {
    if (!selectedSprintId) {
      setRisk(null);
      return;
    }

    setIsRiskLoading(true);
    setRiskMessage("");
    try {
      const response = await getSprintRisk(
        workspaceId,
        projectId,
        selectedSprintId,
      );
      setRisk(response.data);
    } catch (error) {
      setRisk(null);
      setRiskMessage(
        error instanceof Error
          ? error.message
          : "Không thể phân tích rủi ro Sprint.",
      );
    } finally {
      setIsRiskLoading(false);
    }
  }, [projectId, selectedSprintId, workspaceId]);

  useEffect(() => {
    void loadRisk();
  }, [loadRisk]);

  useEffect(() => {
    void getProjectAssistantHistory(workspaceId, projectId).then((response) => setConversation(response.data.items)).catch(() => undefined);
    void getWorkspaceMembers(workspaceId).then((response) => setMembers(response.data.items.filter((item) => item.status === "ACTIVE"))).catch(() => undefined);
  }, [workspaceId, projectId]);

  async function clearConversation() {
    if (!window.confirm("Xóa toàn bộ lịch sử hội thoại của bạn trong dự án này?")) return;
    await clearProjectAssistantHistory(workspaceId, projectId);
    setConversation([]);
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuestion = question.trim();
    if (normalizedQuestion.length < 3 || isAsking) return;

    setConversation((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "USER", content: normalizedQuestion },
    ]);
    setQuestion("");
    setIsAsking(true);

    try {
      const response = await askProjectAssistant(workspaceId, projectId, {
        question: normalizedQuestion,
        ...(selectedSprintId ? { sprintId: selectedSprintId } : {}),
      });
      const answer: ProjectAssistantAnswer = response.data;
      setConversation((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "ASSISTANT",
          content: answer.answer,
          sources: answer.sources,
          actionDraft: answer.actionDraft,
        },
      ]);
      if (answer.suggestedQuestions.length > 0) {
        setSuggestedQuestions(answer.suggestedQuestions);
      }
    } catch (error) {
      setConversation((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "ASSISTANT",
          content:
            error instanceof Error
              ? error.message
              : "Trợ lý chưa thể trả lời. Vui lòng thử lại.",
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  }

  function chooseQuestion(value: string) {
    setQuestion(value);
  }

  async function confirmCreateTask() {
    if (!pendingAction || isExecutingAction) return;
    setIsExecutingAction(true);
    setActionMessage("");
    try {
      const response = pendingAction.type === "CREATE_TASK"
        ? await createTask(workspaceId, projectId, {
            title: pendingAction.payload.title ?? "Công việc mới",
            description: pendingAction.payload.description,
            sprintId: pendingAction.payload.sprintId,
            priority: pendingAction.payload.priority,
            dueDate: pendingAction.payload.dueDate,
            estimatedHours: pendingAction.payload.estimatedHours,
            storyPoints: pendingAction.payload.storyPoints,
          })
        : pendingAction.type === "UPDATE_TASK"
          ? await updateTask(workspaceId, projectId, pendingAction.taskId!, { title: pendingAction.payload.title, description: pendingAction.payload.description, priority: pendingAction.payload.priority })
          : pendingAction.type === "CHANGE_STATUS"
            ? await updateTaskStatus(workspaceId, projectId, pendingAction.taskId!, { status: pendingAction.payload.status })
            : pendingAction.type === "ASSIGN_TASK"
              ? await assignTask(workspaceId, projectId, pendingAction.taskId!, { assigneeId: pendingAction.payload.assigneeId ?? null })
              : await moveTaskToSprint(workspaceId, projectId, pendingAction.taskId!, { sprintId: pendingAction.payload.sprintId ?? null });
      const task = response.data.task;
      setPendingAction(null);
      setActionMessage(`Đã tạo ${task.taskCode} - ${task.title}.`);
      setConversation((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "ASSISTANT",
          content: `Đã tạo Task ${task.taskCode} - ${task.title} sau khi bạn xác nhận.`,
          sources: [{ type: "TASK", id: task.id, label: task.taskCode, detail: task.title }],
        },
      ]);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Không thể tạo Task.");
    } finally {
      setIsExecutingAction(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 pb-8">
      <header className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase text-[#0c66e4]">
              AgileFlow AI
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#172b4d]">
              Trợ lý AgileFlow AI
            </h1>
            <p className="mt-1 text-sm text-[#44546f]">
              Hỏi nhanh về tiến độ và phát hiện sớm những vấn đề có thể làm chậm
              Sprint.
            </p>
          </div>
          <label className="w-full max-w-sm text-xs font-semibold text-[#44546f]">
            Phạm vi phân tích
            <select
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#172b4d] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              value={selectedSprintId}
              onChange={(event) => setSelectedSprintId(event.target.value)}
            >
              <option value="">Toàn bộ dự án</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name} ·{" "}
                  {sprint.status === "ACTIVE" ? "Đang chạy" : "Đã lên kế hoạch"}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="font-semibold text-[#172b4d]">
                Dự báo rủi ro Sprint
              </h2>
              <p className="text-xs text-[#6b778c]">
                Cập nhật từ task và báo cáo hằng ngày
              </p>
            </div>
            <button
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-[#44546f] transition hover:bg-slate-50 disabled:opacity-50"
              disabled={!selectedSprintId || isRiskLoading}
              onClick={() => void loadRisk()}
              type="button"
            >
              Làm mới
            </button>
          </div>

          {isRiskLoading ? (
            <div className="px-5 py-12 text-center text-sm text-[#6b778c]">
              Đang phân tích Sprint...
            </div>
          ) : riskMessage ? (
            <div className="m-5 border border-[#ffd2cc] bg-[#fff4f2] px-4 py-3 text-sm text-[#ae2a19]">
              {riskMessage}
            </div>
          ) : !risk ? (
            <div className="px-5 py-12 text-center">
              <p className="font-medium text-[#172b4d]">
                Chưa có Sprint để dự báo
              </p>
              <p className="mt-1 text-sm text-[#6b778c]">
                Tạo Sprint và đưa task vào để bắt đầu theo dõi.
              </p>
              <Link
                className="mt-4 inline-flex rounded bg-[#0c66e4] px-3 py-2 text-sm font-medium text-white hover:bg-[#0055cc]"
                href={`/workspaces/${workspaceId}/projects/${projectId}/sprints`}
              >
                Mở Backlog
              </Link>
            </div>
          ) : (
            <div>
              <div className="grid gap-5 border-b border-slate-100 p-6 md:grid-cols-[180px_1fr]">
                <div className={`rounded-xl border p-4 ${riskStyles[risk.level]}`}>
                  <p className="text-xs font-semibold uppercase">Mức rủi ro</p>
                  <p className="mt-2 text-3xl font-bold">{risk.score}/100</p>
                  <p className="mt-1 text-sm font-semibold">
                    {risk.levelLabel}
                  </p>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#172b4d]">
                    {risk.sprint.name}
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-[#44546f]">
                    {risk.summary}
                  </p>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-[#6b778c]">
                      <span>
                        Tiến độ thực tế {risk.metrics.completionRate}%
                      </span>
                      <span>Kỳ vọng {risk.metrics.expectedProgress}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded bg-[#f1f2f4]">
                      <div
                        className="h-full bg-[#0c66e4]"
                        style={{
                          width: `${Math.min(100, risk.metrics.completionRate)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50/50 p-4 md:grid-cols-4">
                {[
                  ["Còn lại", `${risk.metrics.remainingTasks} task`],
                  ["Quá hạn", `${risk.metrics.overdueTasks} task`],
                  ["Chưa giao", `${risk.metrics.unassignedTasks} task`],
                  ["Trở ngại", `${risk.metrics.blockedMembers} người`],
                ].map(([label, value]) => (
                  <div
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3"
                    key={label}
                  >
                    <p className="text-[11px] font-semibold uppercase text-[#6b778c]">
                      {label}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-[#172b4d]">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid gap-5 p-6 lg:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-[#172b4d]">
                    Dấu hiệu cần chú ý
                  </h3>
                  <div className="space-y-2">
                    {risk.signals.length === 0 ? (
                      <p className="border border-[#baf3db] bg-[#dcfff1] px-3 py-3 text-sm text-[#216e4e]">
                        Chưa phát hiện dấu hiệu đáng lo trong Sprint này.
                      </p>
                    ) : (
                      risk.signals.map((signal) => (
                        <div
                          className={`rounded-lg border px-3 py-2 ${signalStyles[signal.severity]}`}
                          key={signal.code}
                        >
                          <p className="text-sm font-semibold text-[#172b4d]">
                            {signal.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-5 text-[#44546f]">
                            {signal.detail}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold text-[#172b4d]">
                    Đề xuất xử lý
                  </h3>
                  <ol className="space-y-2">
                    {risk.recommendations.map((recommendation, index) => (
                      <li
                        className="flex gap-2 text-sm leading-5 text-[#44546f]"
                        key={recommendation}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e9f2ff] text-xs font-semibold text-[#0c66e4]">
                          {index + 1}
                        </span>
                        {recommendation}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="flex min-h-[620px] min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative border-b border-slate-100 px-5 py-4">
            {conversation.length ? <button className="absolute right-5 top-3 text-xs font-bold text-rose-600 hover:underline" onClick={() => void clearConversation()} type="button">Xóa lịch sử</button> : null}
            <h2 className="font-semibold text-[#172b4d]">Hỏi trợ lý</h2>
            <p className="text-xs text-[#6b778c]">
              Câu trả lời dựa trên dữ liệu hiện có của dự án.
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {conversation.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-6 text-center">
                <p className="text-sm font-medium text-[#172b4d]">
                  Bạn muốn kiểm tra điều gì?
                </p>
                <div className="mt-3 grid gap-2">
                  {suggestedQuestions.map((item) => (
                    <button
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-[#44546f] transition hover:border-blue-300 hover:bg-blue-50/50"
                      key={item}
                      onClick={() => chooseQuestion(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              conversation.map((item) => (
                <article
                  className={`max-w-[92%] rounded-xl px-3.5 py-2.5 text-sm leading-6 ${
                    item.role === "USER"
                      ? "ml-auto bg-indigo-50 text-[#172b4d]"
                      : "border border-slate-200 bg-white text-[#172b4d] shadow-sm"
                  }`}
                  key={item.id}
                >
                  <p className="whitespace-pre-wrap">{item.content}</p>
                  {item.sources && item.sources.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1 border-t border-[#dfe1e6] pt-2">
                      {item.sources.map((source) => (
                        <Link
                          className="rounded bg-white px-2 py-0.5 text-xs text-[#0c66e4] hover:underline"
                          href={sourceHref(source, workspaceId, projectId)}
                          key={`${source.type}-${source.id}`}
                          title={source.detail}
                        >
                          {source.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                  {item.actionDraft ? (
                    <button
                      className="mt-2 rounded border border-[#0c66e4] bg-white px-3 py-1.5 text-xs font-semibold text-[#0c66e4] hover:bg-[#e9f2ff]"
                      onClick={() => { setPendingAction(item.actionDraft ?? null); setActionMessage(""); }}
                      type="button"
                    >
                      Xem bản nháp Task
                    </button>
                  ) : null}
                </article>
              ))
            )}
            {isAsking ? (
              <p className="text-sm text-[#6b778c]">
                Trợ lý đang tổng hợp dữ liệu...
              </p>
            ) : null}
          </div>

          <form
            className="border-t border-slate-100 bg-slate-50/40 p-4"
            onSubmit={submitQuestion}
          >
            <textarea
              className="min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-[#172b4d] outline-none transition placeholder:text-[#7a869a] focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              maxLength={500}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ví dụ: Sprint đang có rủi ro gì?"
              value={question}
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-xs text-[#6b778c]">
                {question.length}/500
              </span>
              <button
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={question.trim().length < 3 || isAsking}
                type="submit"
              >
                Gửi câu hỏi
              </button>
            </div>
          </form>
        </section>
      </div>
      {pendingAction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#091e42]/50 p-4">
          <div className="w-full max-w-xl rounded bg-white shadow-2xl">
            <div className="border-b border-[#dfe1e6] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#172b4d]">Xác nhận hành động</h2>
              <p className="mt-1 text-sm text-[#6b778c]">Kiểm tra và chỉnh sửa bản nháp. Chưa có dữ liệu nào được ghi cho tới khi bạn xác nhận.</p>
              {pendingAction.taskLabel ? <p className="mt-2 rounded bg-[#f1f2f4] px-3 py-2 text-sm font-semibold text-[#172b4d]">{pendingAction.taskLabel}</p> : null}
            </div>
            <div className="space-y-4 p-5">
              {(pendingAction.type === "CREATE_TASK" || pendingAction.type === "UPDATE_TASK") ? <label className="block text-sm font-semibold text-[#44546f]">Tiêu đề
                <input className="mt-1 h-10 w-full rounded border border-[#dfe1e6] px-3 font-normal" maxLength={255} value={pendingAction.payload.title} onChange={(event) => setPendingAction({ ...pendingAction, payload: { ...pendingAction.payload, title: event.target.value } })} />
              </label> : null}
              {(pendingAction.type === "CREATE_TASK" || pendingAction.type === "UPDATE_TASK") ? <label className="block text-sm font-semibold text-[#44546f]">Mô tả
                <textarea className="mt-1 min-h-24 w-full rounded border border-[#dfe1e6] px-3 py-2 font-normal" value={pendingAction.payload.description ?? ""} onChange={(event) => setPendingAction({ ...pendingAction, payload: { ...pendingAction.payload, description: event.target.value } })} />
              </label> : null}
              {pendingAction.type === "CHANGE_STATUS" ? <label className="block text-sm font-semibold text-[#44546f]">Trạng thái
                <select className="mt-1 h-10 w-full rounded border border-[#dfe1e6] bg-white px-3" value={pendingAction.payload.status} onChange={(event) => setPendingAction({ ...pendingAction, payload: { ...pendingAction.payload, status: event.target.value as ProjectAssistantActionDraft["payload"]["status"] } })}><option value="BACKLOG">Backlog</option><option value="TODO">Cần làm</option><option value="IN_PROGRESS">Đang xử lý</option><option value="REVIEW">Review</option><option value="DONE">Hoàn thành</option></select>
              </label> : null}
              {pendingAction.type === "ASSIGN_TASK" ? <label className="block text-sm font-semibold text-[#44546f]">Người phụ trách
                <select className="mt-1 h-10 w-full rounded border border-[#dfe1e6] bg-white px-3" value={pendingAction.payload.assigneeId ?? ""} onChange={(event) => setPendingAction({ ...pendingAction, payload: { ...pendingAction.payload, assigneeId: event.target.value || null } })}><option value="">Chưa giao</option>{members.map((item) => <option key={item.userId} value={item.userId}>{item.fullName ?? item.email}</option>)}</select>
              </label> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                {(pendingAction.type === "CREATE_TASK" || pendingAction.type === "MOVE_TASK") ? <label className="block text-sm font-semibold text-[#44546f]">Sprint
                  <select className="mt-1 h-10 w-full rounded border border-[#dfe1e6] bg-white px-3 font-normal" value={pendingAction.payload.sprintId ?? ""} onChange={(event) => setPendingAction({ ...pendingAction, payload: { ...pendingAction.payload, sprintId: event.target.value || undefined } })}>
                    <option value="">Backlog</option>{sprints.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label> : null}
                {(pendingAction.type === "CREATE_TASK" || pendingAction.type === "UPDATE_TASK") ? <label className="block text-sm font-semibold text-[#44546f]">Ưu tiên
                  <select className="mt-1 h-10 w-full rounded border border-[#dfe1e6] bg-white px-3 font-normal" value={pendingAction.payload.priority} onChange={(event) => setPendingAction({ ...pendingAction, payload: { ...pendingAction.payload, priority: event.target.value as ProjectAssistantActionDraft["payload"]["priority"] } })}>
                    <option value="LOW">Thấp</option><option value="MEDIUM">Trung bình</option><option value="HIGH">Cao</option><option value="URGENT">Khẩn cấp</option>
                  </select>
                </label> : null}
                {pendingAction.type === "CREATE_TASK" ? <label className="block text-sm font-semibold text-[#44546f]">Deadline
                  <input className="mt-1 h-10 w-full rounded border border-[#dfe1e6] px-3 font-normal" type="date" value={pendingAction.payload.dueDate ?? ""} onChange={(event) => setPendingAction({ ...pendingAction, payload: { ...pendingAction.payload, dueDate: event.target.value || undefined } })} />
                </label> : null}
                {pendingAction.type === "CREATE_TASK" ? <label className="block text-sm font-semibold text-[#44546f]">Story point
                  <input className="mt-1 h-10 w-full rounded border border-[#dfe1e6] px-3 font-normal" min={0} type="number" value={pendingAction.payload.storyPoints ?? ""} onChange={(event) => setPendingAction({ ...pendingAction, payload: { ...pendingAction.payload, storyPoints: event.target.value ? Number(event.target.value) : undefined } })} />
                </label> : null}
              </div>
              {actionMessage ? <p className="text-sm text-[#ae2a19]">{actionMessage}</p> : null}
            </div>
            <div className="flex justify-end gap-2 border-t border-[#dfe1e6] px-5 py-4">
              <button className="rounded px-4 py-2 text-sm font-semibold text-[#44546f] hover:bg-[#f1f2f4]" disabled={isExecutingAction} onClick={() => setPendingAction(null)} type="button">Hủy</button>
              <button className="rounded bg-[#0c66e4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0055cc] disabled:opacity-50" disabled={((pendingAction.type === "CREATE_TASK" || pendingAction.type === "UPDATE_TASK") && !pendingAction.payload.title?.trim()) || isExecutingAction} onClick={() => void confirmCreateTask()} type="button">{isExecutingAction ? "Đang thực hiện..." : "Xác nhận thực hiện"}</button>
            </div>
          </div>
        </div>
      ) : null}
      {!pendingAction && actionMessage ? <div className="fixed bottom-5 right-5 z-40 rounded border border-[#baf3db] bg-[#dcfff1] px-4 py-3 text-sm font-medium text-[#216e4e]">{actionMessage}</div> : null}
    </div>
  );
}
