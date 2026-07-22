"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Sprint } from "@/features/sprints/types/sprint.type";
import {
  askProjectAssistant,
  getSprintRisk,
} from "../api/project-assistant.api";
import {
  AssistantSource,
  ProjectAssistantAnswer,
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

  return (
    <div className="mx-auto max-w-[1440px] space-y-4 pb-8">
      <header className="border border-[#dfe1e6] bg-white px-5 py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase text-[#0c66e4]">
              Theo dõi và hỗ trợ
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-[#172b4d]">
              Trợ lý dự án
            </h1>
            <p className="mt-1 text-sm text-[#44546f]">
              Hỏi nhanh về tiến độ và phát hiện sớm những vấn đề có thể làm chậm
              Sprint.
            </p>
          </div>
          <label className="w-full max-w-sm text-xs font-semibold text-[#44546f]">
            Phạm vi phân tích
            <select
              className="mt-1 h-10 w-full rounded border border-[#dfe1e6] bg-white px-3 text-sm text-[#172b4d] outline-none focus:border-[#0c66e4]"
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
        <section className="min-w-0 border border-[#dfe1e6] bg-white">
          <div className="flex items-center justify-between border-b border-[#dfe1e6] px-5 py-3">
            <div>
              <h2 className="font-semibold text-[#172b4d]">
                Dự báo rủi ro Sprint
              </h2>
              <p className="text-xs text-[#6b778c]">
                Cập nhật từ task và báo cáo hằng ngày
              </p>
            </div>
            <button
              className="rounded border border-[#dfe1e6] px-3 py-2 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4] disabled:opacity-50"
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
              <div className="grid gap-4 border-b border-[#dfe1e6] p-5 md:grid-cols-[170px_1fr]">
                <div className={`rounded border p-4 ${riskStyles[risk.level]}`}>
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

              <div className="grid grid-cols-2 border-b border-[#dfe1e6] md:grid-cols-4">
                {[
                  ["Còn lại", `${risk.metrics.remainingTasks} task`],
                  ["Quá hạn", `${risk.metrics.overdueTasks} task`],
                  ["Chưa giao", `${risk.metrics.unassignedTasks} task`],
                  ["Trở ngại", `${risk.metrics.blockedMembers} người`],
                ].map(([label, value]) => (
                  <div
                    className="border-r border-[#dfe1e6] px-4 py-3 last:border-r-0"
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

              <div className="grid gap-5 p-5 lg:grid-cols-2">
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
                          className={`border-l-4 px-3 py-2 ${signalStyles[signal.severity]}`}
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

        <section className="flex min-h-[620px] min-w-0 flex-col border border-[#dfe1e6] bg-white">
          <div className="border-b border-[#dfe1e6] px-5 py-3">
            <h2 className="font-semibold text-[#172b4d]">Hỏi trợ lý</h2>
            <p className="text-xs text-[#6b778c]">
              Câu trả lời dựa trên dữ liệu hiện có của dự án.
            </p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {conversation.length === 0 ? (
              <div className="border border-dashed border-[#dfe1e6] px-4 py-6">
                <p className="text-sm font-medium text-[#172b4d]">
                  Bạn muốn kiểm tra điều gì?
                </p>
                <div className="mt-3 grid gap-2">
                  {suggestedQuestions.map((item) => (
                    <button
                      className="rounded border border-[#dfe1e6] px-3 py-2 text-left text-sm text-[#44546f] hover:border-[#0c66e4] hover:bg-[#e9f2ff]"
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
                  className={`max-w-[92%] rounded px-3 py-2 text-sm leading-6 ${
                    item.role === "USER"
                      ? "ml-auto bg-[#0c66e4] text-white"
                      : "border border-[#dfe1e6] bg-[#f7f8f9] text-[#172b4d]"
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
            className="border-t border-[#dfe1e6] p-4"
            onSubmit={submitQuestion}
          >
            <textarea
              className="min-h-24 w-full resize-none rounded border border-[#dfe1e6] px-3 py-2 text-sm text-[#172b4d] outline-none placeholder:text-[#7a869a] focus:border-[#0c66e4]"
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
                className="rounded bg-[#0c66e4] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0055cc] disabled:cursor-not-allowed disabled:bg-[#b3b9c4]"
                disabled={question.trim().length < 3 || isAsking}
                type="submit"
              >
                Gửi câu hỏi
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
