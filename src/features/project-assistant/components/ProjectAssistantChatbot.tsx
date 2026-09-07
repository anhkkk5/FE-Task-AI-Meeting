"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  ExternalLink,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { getProjects } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import { askAgileFlowAssistant } from "../api/project-assistant.api";
import { AssistantSource, ProjectAssistantAnswer } from "../types/project-assistant.type";

type ProjectAssistantChatbotProps = { workspaceId?: string; projectId?: string };
type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: AssistantSource[];
  state?: ProjectAssistantAnswer["state"];
  choices?: ProjectAssistantAnswer["choices"];
};

const starterQuestions = [
  "Công việc nào đang quá hạn?",
  "Sprint hiện tại có nguy cơ trễ không?",
  "Ai đang gặp trở ngại cần hỗ trợ?",
];

function sourceHref(source: AssistantSource, workspaceId: string, projectId: string) {
  if (source.type === "TASK") return `/workspaces/${workspaceId}/projects/${projectId}/tasks/${source.id}`;
  if (source.type === "SPRINT") return `/workspaces/${workspaceId}/projects/${projectId}/sprints`;
  if (source.type === "DAILY_UPDATE") return `/workspaces/${workspaceId}/projects/${projectId}/daily-updates/me`;
  return `/workspaces/${workspaceId}/projects/${projectId}`;
}

function ContextSelect({
  label,
  value,
  disabled,
  onChange,
  children,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</span>
      <span className="relative block">
        <select
          className="h-10 w-full appearance-none truncate rounded-xl border border-slate-200 bg-white py-0 pl-3 pr-8 text-sm font-medium text-slate-700 outline-none transition hover:border-slate-300 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 disabled:bg-slate-100 disabled:text-slate-400"
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          value={value}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-3 h-4 w-4 text-slate-400" />
      </span>
    </label>
  );
}

export function ProjectAssistantChatbot({ workspaceId, projectId }: ProjectAssistantChatbotProps) {
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

  useEffect(() => { if (workspaceId) setSelectedWorkspaceId(workspaceId); }, [workspaceId]);
  useEffect(() => { if (projectId) setSelectedProjectId(projectId); }, [projectId]);

  useEffect(() => {
    if (!isOpen) return;
    void getMyWorkspaces()
      .then((response) => setWorkspaces(response.data.items))
      .catch(() => setWorkspaces([]));
  }, [isOpen]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((item) => item.id === selectedWorkspaceId),
    [selectedWorkspaceId, workspaces],
  );
  const selectedProject = useMemo(
    () => projects.find((item) => item.id === selectedProjectId),
    [projects, selectedProjectId],
  );
  const selectedSprint = useMemo(
    () => sprints.find((item) => item.id === selectedSprintId),
    [selectedSprintId, sprints],
  );

  useEffect(() => {
    if (!isOpen || !selectedWorkspaceId) { setProjects([]); return; }
    let active = true;
    setIsLoadingContext(true);
    void getProjects(selectedWorkspaceId, { status: "ACTIVE", page: 1, limit: 100 })
      .then((response) => {
        if (!active) return;
        const items = response.data.items;
        setProjects(items);
        setSelectedProjectId((current) => {
          if (projectId && items.some((item) => item.id === projectId)) return projectId;
          return items.some((item) => item.id === current) ? current : "";
        });
      })
      .catch(() => active && setErrorMessage("Không thể tải danh sách dự án."))
      .finally(() => active && setIsLoadingContext(false));
    return () => { active = false; };
  }, [isOpen, projectId, selectedWorkspaceId]);

  useEffect(() => {
    if (!isOpen || !selectedWorkspaceId || !selectedProjectId) {
      setSprints([]); setSelectedSprintId(""); return;
    }
    let active = true;
    void getSprints(selectedWorkspaceId, selectedProjectId, { page: 1, limit: 100 })
      .then((response) => {
        if (!active) return;
        const available = response.data.items.filter((item) => item.status === "ACTIVE" || item.status === "PLANNED");
        setSprints(available);
        setSelectedSprintId((current) => available.some((item) => item.id === current) ? current : "");
      })
      .catch(() => active && setSprints([]));
    return () => { active = false; };
  }, [isOpen, selectedProjectId, selectedWorkspaceId]);

  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [isAsking, messages]);

  function resetConversation() {
    setMessages([]); setSuggestions(starterQuestions); setErrorMessage("");
  }
  function changeWorkspace(value: string) {
    setSelectedWorkspaceId(value); setSelectedProjectId(""); setSelectedSprintId(""); resetConversation();
  }
  function changeProject(value: string) {
    setSelectedProjectId(value); setSelectedSprintId(""); resetConversation();
  }

  async function requestAnswer(content: string) {
    return askAgileFlowAssistant({
      question: content,
      ...(selectedWorkspaceId ? { workspaceId: selectedWorkspaceId } : {}),
      ...(selectedProjectId ? { projectId: selectedProjectId } : {}),
      ...(selectedSprintId ? { sprintId: selectedSprintId } : {}),
    });
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = question.trim();
    if (content.length < 3 || isAsking) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "USER", content }]);
    setQuestion(""); setErrorMessage(""); setIsAsking(true);
    try {
      const response = await requestAnswer(content);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(), role: "ASSISTANT", content: response.data.answer,
        sources: response.data.sources, state: response.data.state, choices: response.data.choices,
      }]);
      if (response.data.suggestedQuestions.length) setSuggestions(response.data.suggestedQuestions);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Trợ lý chưa thể trả lời. Vui lòng thử lại.");
    } finally { setIsAsking(false); }
  }

  async function chooseContext(message: ChatMessage, choiceId: string) {
    const originalQuestion = [...messages].reverse().find((item) => item.role === "USER")?.content;
    if (!originalQuestion || isAsking) return;
    const nextWorkspaceId = message.state === "NEED_WORKSPACE" ? choiceId : selectedWorkspaceId;
    const nextProjectId = message.state === "NEED_PROJECT" ? choiceId : selectedProjectId;
    const nextSprintId = message.state === "NEED_SPRINT" ? choiceId : selectedSprintId;
    if (message.state === "NEED_WORKSPACE") { setSelectedWorkspaceId(choiceId); setSelectedProjectId(""); setSelectedSprintId(""); }
    if (message.state === "NEED_PROJECT") { setSelectedProjectId(choiceId); setSelectedSprintId(""); }
    if (message.state === "NEED_SPRINT") setSelectedSprintId(choiceId);
    setIsAsking(true); setErrorMessage("");
    try {
      const response = await askAgileFlowAssistant({
        question: originalQuestion,
        workspaceId: nextWorkspaceId || undefined,
        projectId: message.state === "NEED_WORKSPACE" ? undefined : nextProjectId || undefined,
        sprintId: message.state === "NEED_SPRINT" ? nextSprintId : undefined,
      });
      setMessages((current) => current.map((item) => item.id === message.id ? {
        ...item, content: response.data.answer, sources: response.data.sources,
        state: response.data.state, choices: response.data.choices,
      } : item));
      if (response.data.suggestedQuestions.length) setSuggestions(response.data.suggestedQuestions);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Không thể cập nhật phạm vi dữ liệu.");
    } finally { setIsAsking(false); }
  }

  const contextLabel = [selectedWorkspace?.name, selectedProject?.name, selectedSprint?.name].filter(Boolean).join(" · ");

  return (
    <>
      {isOpen ? (
        <section aria-label="Trợ lý AgileFlow" className="fixed inset-x-3 bottom-20 z-50 flex h-[min(720px,calc(100dvh-6rem))] flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)] sm:left-auto sm:right-6 sm:w-[520px]">
          <header className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 px-5 py-4 text-white">
            <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-white/10" />
            <div className="relative flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25"><Bot className="h-6 w-6" /></span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2"><h2 className="text-base font-bold">Trợ lý AgileFlow</h2><span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-bold text-emerald-50 ring-1 ring-emerald-200/30">AI</span></div>
                  <p className="mt-0.5 truncate text-xs text-blue-50/90">{contextLabel || "Phân tích dự án và gợi ý hành động"}</p>
                </div>
              </div>
              <button aria-label="Đóng trợ lý" className="flex h-9 w-9 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/15 hover:text-white" onClick={() => setIsOpen(false)} type="button"><X className="h-5 w-5" /></button>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3 sm:grid-cols-3">
            <ContextSelect label="Workspace" value={selectedWorkspaceId} onChange={changeWorkspace}>
              <option value="">Chọn workspace</option>
              {workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </ContextSelect>
            <ContextSelect label="Dự án" value={selectedProjectId} disabled={!selectedWorkspaceId || isLoadingContext} onChange={changeProject}>
              <option value="">Chọn dự án</option>
              {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </ContextSelect>
            <div className="col-span-2 sm:col-span-1">
              <ContextSelect label="Sprint (tùy chọn)" value={selectedSprintId} disabled={!selectedProjectId} onChange={setSelectedSprintId}>
                <option value="">Tự động</option>
                {sprints.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </ContextSelect>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50/60 to-white p-4">
            {messages.length === 0 ? (
              <div className="flex h-full min-h-72 flex-col items-center justify-center px-3 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100"><Sparkles className="h-7 w-7" /></span>
                <h3 className="mt-4 text-lg font-bold text-slate-800">Bạn muốn biết điều gì?</h3>
                <p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Chọn phạm vi ở trên để nhận câu trả lời chính xác từ dữ liệu dự án.</p>
                <div className="mt-5 grid w-full gap-2">
                  {suggestions.slice(0, 3).map((suggestion) => (
                    <button className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50/50 hover:text-indigo-700" key={suggestion} onClick={() => setQuestion(suggestion)} type="button">{suggestion}</button>
                  ))}
                </div>
              </div>
            ) : null}

            {messages.map((message) => (
              <article className={`flex gap-2.5 ${message.role === "USER" ? "justify-end" : "justify-start"}`} key={message.id}>
                {message.role === "ASSISTANT" ? <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white"><Bot className="h-4 w-4" /></span> : null}
                <div className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "USER" ? "rounded-br-md bg-indigo-600 text-white shadow-sm" : "rounded-bl-md border border-slate-200 bg-white text-slate-700 shadow-sm"}`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.choices?.length ? (
                    <div className="mt-3 grid gap-2 border-t border-slate-100 pt-3">
                      {message.choices.map((choice) => (
                        <button className="rounded-xl border border-indigo-200 bg-indigo-50/50 px-3 py-2 text-left text-sm font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-100" disabled={isAsking} key={choice.id} onClick={() => void chooseContext(message, choice.id)} type="button">
                          <span className="block">{choice.label}</span>{choice.description ? <span className="block text-xs font-normal text-slate-500">{choice.description}</span> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {message.sources?.length && selectedWorkspaceId && selectedProjectId ? (
                    <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                      {message.sources.slice(0, 5).map((source) => <Link className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50" href={sourceHref(source, selectedWorkspaceId, selectedProjectId)} key={`${source.type}-${source.id}`} onClick={() => setIsOpen(false)}>{source.label}<ExternalLink className="h-3 w-3" /></Link>)}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}

            {isAsking ? <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white"><Bot className="h-4 w-4" /></span><div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm"><span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-.3s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400 [animation-delay:-.15s]" /><span className="h-2 w-2 animate-bounce rounded-full bg-indigo-400" /></div></div> : null}
            {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{errorMessage}</p> : null}
            <div ref={messageEndRef} />
          </div>

          <form className="border-t border-slate-100 bg-white p-4" onSubmit={submitQuestion}>
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 transition focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-100">
              <textarea aria-label="Câu hỏi cho trợ lý" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400" onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Hỏi về tiến độ, công việc hoặc rủi ro..." rows={1} value={question} />
              <button aria-label="Gửi câu hỏi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300" disabled={question.trim().length < 3 || isAsking} type="submit"><Send className="h-4 w-4" /></button>
            </div>
            <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-slate-400"><span>Enter để gửi · Shift + Enter để xuống dòng</span>{selectedProjectId ? <Link className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-700" href={`/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/assistant`} onClick={() => setIsOpen(false)}>Phân tích đầy đủ <ExternalLink className="h-3 w-3" /></Link> : null}</div>
          </form>
        </section>
      ) : null}

      <button aria-label={isOpen ? "Đóng trợ lý AgileFlow" : "Mở trợ lý AgileFlow"} className={`fixed bottom-5 right-5 z-50 flex h-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-[0_12px_30px_rgba(79,70,229,0.38)] transition hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(79,70,229,0.45)] ${isOpen ? "w-14" : "w-14 sm:w-auto sm:gap-2 sm:px-4"}`} onClick={() => setIsOpen((current) => !current)} type="button">
        {isOpen ? <X className="h-6 w-6" /> : <><MessageCircle className="h-6 w-6" /><span className="hidden text-sm font-bold sm:inline">Hỏi AI</span></>}
      </button>
    </>
  );
}
