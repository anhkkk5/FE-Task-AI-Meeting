"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getProjects } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { askAgileFlowAssistant } from "../api/project-assistant.api";
import { AssistantSource, ProjectAssistantAnswer } from "../types/project-assistant.type";

type ProjectAssistantChatbotProps = {
  workspaceId?: string;
  projectId?: string;
};

type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: AssistantSource[];
  state?: ProjectAssistantAnswer["state"];
  choices?: ProjectAssistantAnswer["choices"];
};

const starterQuestions = [
  "Dự án đang có công việc nào quá hạn?",
  "Sprint hiện tại có nguy cơ trễ không?",
  "Ai đang gặp trở ngại cần hỗ trợ?",
];

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

function ChatIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h.01M12 10h.01M16 10h.01M21 12a8 8 0 0 1-8 8H7l-4 2 1.35-4.05A8 8 0 1 1 21 12Z"
      />
    </svg>
  );
}

export function ProjectAssistantChatbot({
  workspaceId,
  projectId,
}: ProjectAssistantChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(workspaceId ?? "");
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState(starterQuestions);
  const [isLoadingContext, setIsLoadingContext] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (workspaceId) setSelectedWorkspaceId(workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    if (!isOpen) return;
    void getMyWorkspaces().then((response) => {
      setWorkspaces(response.data.items);
    }).catch(() => setWorkspaces([]));
  }, [isOpen]);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId),
    [projects, selectedProjectId],
  );

  useEffect(() => {
    if (projectId) setSelectedProjectId(projectId);
  }, [projectId]);

  useEffect(() => {
    if (!isOpen || !selectedWorkspaceId) {
      setProjects([]);
      return;
    }

    let active = true;
    setIsLoadingContext(true);
    setErrorMessage("");
    void getProjects(selectedWorkspaceId, { status: "ACTIVE", page: 1, limit: 100 })
      .then((response) => {
        if (!active) return;
        const items = response.data.items;
        setProjects(items);
        setSelectedProjectId((current) => {
          if (projectId && items.some((item) => item.id === projectId)) {
            return projectId;
          }
          if (current && items.some((item) => item.id === current)) {
            return current;
          }
          return "";
        });
      })
      .catch((error: unknown) => {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Không thể tải danh sách dự án.",
          );
        }
      })
      .finally(() => {
        if (active) setIsLoadingContext(false);
      });

    return () => {
      active = false;
    };
  }, [isOpen, projectId, selectedWorkspaceId]);

  useEffect(() => {
    if (!isOpen || !selectedWorkspaceId || !selectedProjectId) {
      setSprints([]);
      setSelectedSprintId("");
      return;
    }

    let active = true;
    void getSprints(selectedWorkspaceId, selectedProjectId, { page: 1, limit: 100 })
      .then((response) => {
        if (!active) return;
        const available = response.data.items.filter(
          (sprint) => sprint.status === "ACTIVE" || sprint.status === "PLANNED",
        );
        setSprints(available);
        setSelectedSprintId((current) =>
          available.some((sprint) => sprint.id === current) ? current : "",
        );
      })
      .catch(() => {
        if (active) {
          setSprints([]);
          setSelectedSprintId("");
        }
      });

    return () => {
      active = false;
    };
  }, [isOpen, selectedProjectId, selectedWorkspaceId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [isAsking, messages]);

  function changeProject(value: string) {
    setSelectedProjectId(value);
    setMessages([]);
    setSuggestions(starterQuestions);
    setErrorMessage("");
  }

  function changeWorkspace(value: string) {
    setSelectedWorkspaceId(value);
    setSelectedProjectId("");
    setSelectedSprintId("");
    setMessages([]);
    setSuggestions(starterQuestions);
  }

  async function ask(content: string) {
    const response = await askAgileFlowAssistant({
      question: content,
      ...(selectedWorkspaceId ? { workspaceId: selectedWorkspaceId } : {}),
      ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
      ...(selectedSprintId ? { sprintId: selectedSprintId } : {}),
    });
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "ASSISTANT",
        content: response.data.answer,
        sources: response.data.sources,
        state: response.data.state,
        choices: response.data.choices,
      },
    ]);
    if (response.data.suggestedQuestions.length > 0) {
      setSuggestions(response.data.suggestedQuestions);
    }
  }

  async function chooseContext(message: ChatMessage, choiceId: string) {
    const originalQuestion = [...messages].reverse().find((item) => item.role === "USER")?.content;
    if (!originalQuestion || isAsking) return;
    if (message.state === "NEED_WORKSPACE") {
      setSelectedWorkspaceId(choiceId);
      setSelectedProjectId("");
      setSelectedSprintId("");
    } else if (message.state === "NEED_PROJECT") {
      setSelectedProjectId(choiceId);
      setSelectedSprintId("");
    } else if (message.state === "NEED_SPRINT") {
      setSelectedSprintId(choiceId);
    }
    setIsAsking(true);
    try {
      const response = await askAgileFlowAssistant({
        question: originalQuestion,
        workspaceId: message.state === "NEED_WORKSPACE" ? choiceId : selectedWorkspaceId,
        projectId:
          message.state === "NEED_WORKSPACE"
            ? undefined
            : message.state === "NEED_PROJECT"
              ? choiceId
              : selectedProjectId || undefined,
        sprintId:
          message.state === "NEED_SPRINT"
            ? choiceId
            : message.state === "READY"
              ? selectedSprintId || undefined
              : undefined,
      });
      setMessages((current) => [...current, {
        id: crypto.randomUUID(), role: "ASSISTANT", content: response.data.answer,
        sources: response.data.sources, state: response.data.state, choices: response.data.choices,
      }]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể chọn phạm vi.");
    } finally {
      setIsAsking(false);
    }
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = question.trim();
    if (content.length < 3 || isAsking) {
      return;
    }

    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "USER", content },
    ]);
    setQuestion("");
    setErrorMessage("");
    setIsAsking(true);

    try {
      await ask(content);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Trợ lý chưa thể trả lời. Vui lòng thử lại.",
      );
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <>
      {isOpen ? (
        <section
          aria-label="Trợ lý AgileFlow"
          className="fixed inset-x-3 bottom-20 z-50 flex max-h-[min(680px,calc(100vh-6rem))] flex-col overflow-hidden rounded border border-[#dfe1e6] bg-white shadow-2xl sm:left-auto sm:right-5 sm:w-[410px]"
        >
          <header className="flex items-center justify-between border-b border-[#dfe1e6] px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-[#0c66e4] text-white">
                <ChatIcon />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-[#172b4d]">Trợ lý AgileFlow</h2>
                <p className="truncate text-xs text-[#6b778c]">
                  {selectedProject?.name ?? "Hỏi về AgileFlow hoặc dữ liệu dự án"}
                </p>
              </div>
            </div>
            <button
              aria-label="Đóng trợ lý"
              className="flex h-8 w-8 items-center justify-center rounded text-xl text-[#44546f] hover:bg-[#f1f2f4]"
              onClick={() => setIsOpen(false)}
              title="Đóng"
              type="button"
            >
              ×
            </button>
          </header>

          <div className="grid grid-cols-1 gap-2 border-b border-[#dfe1e6] bg-[#f7f8f9] p-3 sm:grid-cols-3">
            <label className="text-[11px] font-semibold uppercase text-[#626f86]">
              Workspace
              <select
                className="mt-1 h-9 w-full rounded border border-[#b7b9be] bg-white px-2 text-sm normal-case text-[#172b4d] outline-none focus:border-[#0c66e4]"
                onChange={(event) => changeWorkspace(event.target.value)}
                value={selectedWorkspaceId}
              >
                <option value="">Chọn khi cần dữ liệu</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-semibold uppercase text-[#626f86]">
              Dự án
              <select
                className="mt-1 h-9 w-full rounded border border-[#b7b9be] bg-white px-2 text-sm normal-case text-[#172b4d] outline-none focus:border-[#0c66e4]"
                disabled={isLoadingContext}
                onChange={(event) => changeProject(event.target.value)}
                value={selectedProjectId}
              >
                <option value="">Chọn khi cần dữ liệu</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] font-semibold uppercase text-[#626f86]">
              Phạm vi
              <select
                className="mt-1 h-9 w-full rounded border border-[#b7b9be] bg-white px-2 text-sm normal-case text-[#172b4d] outline-none focus:border-[#0c66e4]"
                onChange={(event) => setSelectedSprintId(event.target.value)}
                value={selectedSprintId}
              >
                <option value="">Toàn bộ dự án</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="min-h-52 flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div>
                <p className="text-sm font-medium text-[#172b4d]">
                  Bạn muốn kiểm tra điều gì?
                </p>
                <div className="mt-3 space-y-2">
                  {suggestions.map((suggestion) => (
                    <button
                      className="w-full rounded border border-[#dfe1e6] px-3 py-2 text-left text-sm text-[#44546f] hover:border-[#0c66e4] hover:bg-[#e9f2ff]"
                      key={suggestion}
                      onClick={() => setQuestion(suggestion)}
                      type="button"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message) => (
              <article
                className={`max-w-[88%] rounded px-3 py-2 text-sm leading-6 ${
                  message.role === "USER"
                    ? "ml-auto bg-[#0c66e4] text-white"
                    : "border border-[#dfe1e6] bg-[#f7f8f9] text-[#172b4d]"
                }`}
                key={message.id}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.choices && message.choices.length > 0 ? (
                  <div className="mt-2 grid gap-1.5 border-t border-[#dfe1e6] pt-2">
                    {message.choices.map((choice) => (
                      <button
                        className="rounded border border-[#b3d4ff] bg-white px-2.5 py-1.5 text-left text-xs font-medium text-[#0c66e4] hover:bg-[#e9f2ff]"
                        disabled={isAsking}
                        key={choice.id}
                        onClick={() => void chooseContext(message, choice.id)}
                        type="button"
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                ) : null}
                {message.sources && message.sources.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1 border-t border-[#dfe1e6] pt-2">
                    {message.sources.slice(0, 4).map((source) => (
                      <Link
                        className="rounded bg-white px-2 py-0.5 text-xs text-[#0c66e4] hover:underline"
                        href={sourceHref(
                          source,
                          selectedWorkspaceId,
                          selectedProjectId,
                        )}
                        key={`${source.type}-${source.id}`}
                        onClick={() => setIsOpen(false)}
                      >
                        {source.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}

            {isAsking ? (
              <div className="w-fit rounded border border-[#dfe1e6] bg-[#f7f8f9] px-3 py-2 text-sm text-[#6b778c]">
                Đang phân tích dữ liệu dự án...
              </div>
            ) : null}
            {errorMessage ? (
              <p className="rounded border border-[#ffd2cc] bg-[#fff4f2] px-3 py-2 text-sm text-[#ae2a19]">
                {errorMessage}
              </p>
            ) : null}
            <div ref={messageEndRef} />
          </div>

          <form
            className="border-t border-[#dfe1e6] p-3"
            onSubmit={submitQuestion}
          >
            <div className="flex gap-2">
              <textarea
                aria-label="Câu hỏi cho trợ lý"
                className="min-h-11 flex-1 resize-none rounded border border-[#b7b9be] px-3 py-2 text-sm text-[#172b4d] outline-none focus:border-[#0c66e4]"
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Hỏi về tiến độ, công việc hoặc rủi ro..."
                rows={1}
                value={question}
              />
              <button
                aria-label="Gửi câu hỏi"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-[#0c66e4] text-white hover:bg-[#0055cc] disabled:cursor-not-allowed disabled:bg-[#b7b9be]"
                disabled={
                  question.trim().length < 3 || isAsking
                }
                title="Gửi"
                type="submit"
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4 4 16 8-16 8 3-8-3-8Zm3 8h13"
                  />
                </svg>
              </button>
            </div>
            {selectedProjectId ? (
              <Link
                className="mt-2 inline-block text-xs font-medium text-[#0c66e4] hover:underline"
                href={`/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/assistant`}
                onClick={() => setIsOpen(false)}
              >
                Mở trang phân tích đầy đủ
              </Link>
            ) : null}
          </form>
        </section>
      ) : null}

      <button
        aria-expanded={isOpen}
        aria-label={isOpen ? "Đóng trợ lý AgileFlow" : "Mở trợ lý AgileFlow"}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/25 ring-4 ring-brand-500/15 transition-all duration-200 hover:bg-brand-700 hover:scale-105 focus:outline-none"
        onClick={() => setIsOpen((current) => !current)}
        title="Trợ lý AgileFlow"
        type="button"
      >
        {isOpen ? (
          <span className="text-2xl leading-none">×</span>
        ) : (
          <ChatIcon />
        )}
      </button>
    </>
  );
}
