"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Lightbulb,
  MessageCircle,
  RotateCcw,
  Send,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { getProjects } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { getMyWorkspaces } from "@/features/workspaces/api/workspaces.api";
import { Workspace } from "@/features/workspaces/types/workspace.type";
import {
  askAgileFlowAssistant,
  getProjectAssistantHistory,
} from "../api/project-assistant.api";
import {
  AssistantSource,
  ProjectAssistantActionDraft,
  ProjectAssistantAnswer,
} from "../types/project-assistant.type";

type Props = { workspaceId?: string; projectId?: string };
type ChatMessage = {
  id: string;
  role: "USER" | "ASSISTANT";
  content: string;
  sources?: AssistantSource[];
  state?: ProjectAssistantAnswer["state"];
  choices?: ProjectAssistantAnswer["choices"];
  actionDraft?: ProjectAssistantActionDraft;
};

const starterQuestions = [
  "Tôi nên ưu tiên việc gì hôm nay?",
  "Công việc nào đang quá hạn?",
  "Sprint hiện tại có nguy cơ trễ không?",
  "Cuộc họp gần nhất đã chốt điều gì?",
];

function sourceHref(source: AssistantSource, workspaceId: string, projectId: string) {
  if (source.type === "TASK") return `/workspaces/${workspaceId}/projects/${projectId}/tasks/${source.id}`;
  if (source.type === "SPRINT") return `/workspaces/${workspaceId}/projects/${projectId}/sprints`;
  if (source.type === "DAILY_UPDATE") return `/workspaces/${workspaceId}/projects/${projectId}/daily-updates/me`;
  return `/workspaces/${workspaceId}/projects/${projectId}`;
}

function ContextSelect({ label, value, disabled, onChange, children }: {
  label: string; value: string; disabled?: boolean;
  onChange: (value: string) => void; children: React.ReactNode;
}) {
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="relative block">
        <select className="h-9 w-full appearance-none truncate rounded-lg border border-slate-200 bg-white pl-3 pr-7 text-xs font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400" disabled={disabled} onChange={(event) => onChange(event.target.value)} value={value}>
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-400" />
      </span>
    </label>
  );
}

function AnswerContent({ content }: { content: string }) {
  const normalized = content.includes(";") && !content.includes("\n")
    ? content.replace(/:\s*/u, ":\n").replace(/;\s*/gu, "\n")
    : content;
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length <= 1) return <p className="whitespace-pre-wrap">{content}</p>;
  const intro = lines[0];
  const items = lines.slice(1);
  const isSectionTitle = (line: string) =>
    /^(?:Nguyên nhân(?: chính)?|Bằng chứng|Hướng xử lý(?: đề xuất)?|Đề xuất|Việc cần làm|Ưu tiên|Mình (?:vẫn )?có thể hỗ trợ bạn(?: ngay với| theo hướng gần nhất)):$/iu.test(line);
  return (
    <div className="space-y-2.5">
      {intro ? <p className="font-medium text-slate-800">{intro}</p> : null}
      {items.length ? (
        <div className="space-y-2">
          {items.map((line, index) =>
            isSectionTitle(line) ? (
              <p className="pt-1 text-[13px] font-semibold uppercase tracking-[0.04em] text-slate-500" key={`${line}-${index}`}>
                {line}
              </p>
            ) : (
              <div className="flex gap-2" key={`${line}-${index}`}>
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-slate-500" />
                <span>{line.replace(/^(?:[•\-]|\d+[.)])\s*/u, "")}</span>
              </div>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}

export function ProjectAssistantChatbot({ workspaceId, projectId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showContext, setShowContext] = useState(false);
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
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (workspaceId) setSelectedWorkspaceId(workspaceId); }, [workspaceId]);
  useEffect(() => { if (projectId) setSelectedProjectId(projectId); }, [projectId]);
  useEffect(() => {
    if (!isOpen) return;
    void getMyWorkspaces().then((response) => setWorkspaces(response.data.items)).catch(() => setWorkspaces([]));
  }, [isOpen]);

  const selectedWorkspace = useMemo(() => workspaces.find((item) => item.id === selectedWorkspaceId), [selectedWorkspaceId, workspaces]);
  const selectedProject = useMemo(() => projects.find((item) => item.id === selectedProjectId), [projects, selectedProjectId]);
  const selectedSprint = useMemo(() => sprints.find((item) => item.id === selectedSprintId), [selectedSprintId, sprints]);

  useEffect(() => {
    if (!isOpen || !selectedWorkspaceId) { setProjects([]); return; }
    let active = true;
    setIsLoadingContext(true);
    void getProjects(selectedWorkspaceId, { status: "ACTIVE", page: 1, limit: 100 })
      .then((response) => {
        if (!active) return;
        const items = response.data.items;
        setProjects(items);
        setSelectedProjectId((current) => projectId && items.some((item) => item.id === projectId) ? projectId : items.some((item) => item.id === current) ? current : "");
      })
      .catch(() => active && setErrorMessage("Không thể tải danh sách dự án."))
      .finally(() => active && setIsLoadingContext(false));
    return () => { active = false; };
  }, [isOpen, projectId, selectedWorkspaceId]);

  useEffect(() => {
    if (!isOpen || !selectedWorkspaceId || !selectedProjectId) { setSprints([]); setSelectedSprintId(""); return; }
    let active = true;
    void getSprints(selectedWorkspaceId, selectedProjectId, { page: 1, limit: 100 })
      .then((response) => {
        if (!active) return;
        const available = response.data.items.filter((item) => item.status === "ACTIVE" || item.status === "PLANNED");
        setSprints(available);
        setSelectedSprintId((current) => available.some((item) => item.id === current) ? current : "");
      }).catch(() => active && setSprints([]));
    return () => { active = false; };
  }, [isOpen, selectedProjectId, selectedWorkspaceId]);

  useEffect(() => {
    if (!isOpen || !selectedWorkspaceId || !selectedProjectId) return;
    let active = true;
    setIsLoadingHistory(true);
    void getProjectAssistantHistory(selectedWorkspaceId, selectedProjectId)
      .then((response) => {
        if (!active) return;
        setMessages(response.data.items.slice(-20).map((item) => ({ ...item, id: item.id || crypto.randomUUID() })));
      })
      .catch(() => undefined)
      .finally(() => active && setIsLoadingHistory(false));
    return () => { active = false; };
  }, [isOpen, selectedProjectId, selectedWorkspaceId]);

  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [isAsking, messages]);

  function resetConversation() { setMessages([]); setSuggestions(starterQuestions); setErrorMessage(""); }
  function changeWorkspace(value: string) { setSelectedWorkspaceId(value); setSelectedProjectId(""); setSelectedSprintId(""); resetConversation(); }
  function changeProject(value: string) { setSelectedProjectId(value); setSelectedSprintId(""); resetConversation(); }

  async function requestAnswer(content: string, context?: { workspaceId?: string; projectId?: string; sprintId?: string }) {
    return askAgileFlowAssistant({
      question: content,
      workspaceId: context?.workspaceId ?? (selectedWorkspaceId || undefined),
      projectId: context?.projectId ?? (selectedProjectId || undefined),
      sprintId: context?.sprintId ?? (selectedSprintId || undefined),
    });
  }

  async function sendQuestion(content: string) {
    const clean = content.trim();
    if (clean.length < 3 || isAsking) return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "USER", content: clean }]);
    setQuestion(""); setErrorMessage(""); setIsAsking(true);
    try {
      const response = await requestAnswer(clean);
      setMessages((current) => [...current, {
        id: crypto.randomUUID(), role: "ASSISTANT", content: response.data.answer,
        sources: response.data.sources, state: response.data.state, choices: response.data.choices,
        actionDraft: response.data.actionDraft,
      }]);
      if (response.data.suggestedQuestions.length) setSuggestions(response.data.suggestedQuestions);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Trợ lý chưa thể trả lời. Vui lòng thử lại.");
    } finally { setIsAsking(false); }
  }

  async function submitQuestion(event: FormEvent<HTMLFormElement>) { event.preventDefault(); await sendQuestion(question); }

  async function chooseContext(message: ChatMessage, choiceId: string) {
    const originalQuestion = [...messages].reverse().find((item) => item.role === "USER")?.content;
    if (!originalQuestion || isAsking) return;
    const nextWorkspaceId = message.state === "NEED_WORKSPACE" ? choiceId : selectedWorkspaceId;
    const nextProjectId = message.state === "NEED_PROJECT" ? choiceId : selectedProjectId;
    const nextSprintId = message.state === "NEED_SPRINT" ? choiceId : selectedSprintId;
    if (message.state === "NEED_WORKSPACE") { setSelectedWorkspaceId(choiceId); setSelectedProjectId(""); setSelectedSprintId(""); }
    if (message.state === "NEED_PROJECT") { setSelectedProjectId(choiceId); setSelectedSprintId(""); }
    if (message.state === "NEED_SPRINT") setSelectedSprintId(choiceId);
    setIsAsking(true);
    try {
      const response = await requestAnswer(originalQuestion, {
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

  const contextLabel = [selectedWorkspace?.name, selectedProject?.name, selectedSprint?.name].filter(Boolean).join(" / ") || "Chưa chọn phạm vi";

  return (
    <>
      {isOpen ? (
        <section aria-label="Trợ lý AgileFlow" className="fixed inset-x-3 bottom-20 z-50 flex h-[min(760px,calc(100dvh-6rem))] flex-col overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.22)] sm:left-auto sm:right-6 sm:w-[min(620px,calc(100vw-3rem))]">
          <header className="border-b border-slate-100 bg-white px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white"><Sparkles className="h-[18px] w-[18px]" /></span>
                <div className="min-w-0"><div className="flex items-center gap-2"><h2 className="text-[15px] font-semibold text-slate-900">Trợ lý AgileFlow</h2><span className="h-2 w-2 rounded-full bg-emerald-500" /></div><p className="truncate text-xs text-slate-500">Hỏi đáp từ dữ liệu dự án</p></div>
              </div>
              <div className="flex items-center gap-1">
                <button aria-label="Cuộc trò chuyện mới" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={resetConversation} title="Cuộc trò chuyện mới" type="button"><RotateCcw className="h-4 w-4" /></button>
                <button aria-label="Đóng" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={() => setIsOpen(false)} type="button"><X className="h-4 w-4" /></button>
              </div>
            </div>
          </header>

          <div className="border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
            <button className="flex w-full items-center justify-between gap-2 text-left" onClick={() => setShowContext((value) => !value)} type="button">
              <span className="flex min-w-0 items-center gap-2"><Settings2 className="h-3.5 w-3.5 shrink-0 text-blue-600" /><span className="truncate text-xs font-semibold text-slate-700">{contextLabel}</span></span>
              <span className="text-[11px] font-semibold text-blue-600">{showContext ? "Thu gọn" : "Thay đổi"}</span>
            </button>
            {showContext ? <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200/70 pt-3">
              <ContextSelect label="Workspace" value={selectedWorkspaceId} onChange={changeWorkspace}><option value="">Chọn workspace</option>{workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</ContextSelect>
              <ContextSelect label="Dự án" value={selectedProjectId} disabled={!selectedWorkspaceId || isLoadingContext} onChange={changeProject}><option value="">Chọn dự án</option>{projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</ContextSelect>
              <div className="col-span-2"><ContextSelect label="Sprint (tự động nếu bỏ trống)" value={selectedSprintId} disabled={!selectedProjectId} onChange={setSelectedSprintId}><option value="">Tự động chọn</option>{sprints.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</ContextSelect></div>
            </div> : null}
          </div>

          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto overflow-x-hidden bg-white px-6 py-6">
            {messages.length === 0 && !isLoadingHistory ? <div className="pt-5 text-center">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-black text-white"><Bot className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Mình có thể giúp gì?</h3>
              <p className="mx-auto mt-1.5 max-w-xs text-sm leading-6 text-slate-500">Hỏi về tiến độ, công việc, Sprint hoặc quyết định trong cuộc họp.</p>
              <div className="mt-5 grid gap-2 text-left">{suggestions.slice(0, 4).map((item) => <button className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50" key={item} onClick={() => void sendQuestion(item)} type="button"><span>{item}</span><ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-600" /></button>)}</div>
            </div> : null}
            {isLoadingHistory ? <p className="py-8 text-center text-xs text-slate-400">Đang tải cuộc trò chuyện...</p> : null}

            {messages.map((message) => <article className={`flex min-w-0 gap-3 ${message.role === "USER" ? "justify-end" : "justify-start"}`} key={message.id}>
              {message.role === "ASSISTANT" ? <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black text-white"><Sparkles className="h-3.5 w-3.5" /></span> : null}
              <div className={`min-w-0 text-[15px] leading-7 ${message.role === "USER" ? "max-w-[80%] rounded-[22px] bg-[#f4f4f4] px-4 py-2.5 text-slate-950" : "max-w-[calc(100%-40px)] flex-1 pt-0.5 text-slate-800"}`}>
                {message.role === "ASSISTANT" ? <AnswerContent content={message.content} /> : <p className="whitespace-pre-wrap">{message.content}</p>}
                {message.choices?.length ? <div className="mt-3 grid gap-1.5 border-t border-slate-100 pt-2.5">{message.choices.map((choice) => <button className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left text-xs font-semibold text-blue-700 hover:bg-blue-100" disabled={isAsking} key={choice.id} onClick={() => void chooseContext(message, choice.id)} type="button">{choice.label}{choice.description ? <span className="block font-normal text-slate-500">{choice.description}</span> : null}</button>)}</div> : null}
                {message.actionDraft && selectedProjectId ? <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-2.5"><div className="flex gap-2"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" /><div><p className="font-semibold text-amber-900">Đề xuất thao tác</p><p className="text-xs text-amber-700">Mở trang phân tích để xem trước và xác nhận. AI không tự thay đổi dữ liệu.</p></div></div><Link className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-amber-800" href={`/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/assistant`} onClick={() => setIsOpen(false)}>Xem và xác nhận <ExternalLink className="h-3 w-3" /></Link></div> : null}
                {message.sources?.length && selectedWorkspaceId && selectedProjectId ? <details className="mt-3 border-t border-slate-100 pt-2"><summary className="cursor-pointer select-none text-xs font-medium text-slate-500 hover:text-slate-800">{message.sources.length} nguồn kiểm chứng</summary><div className="mt-2 grid min-w-0 gap-1">{message.sources.slice(0, 5).map((source) => <Link className="flex min-w-0 items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900" href={sourceHref(source, selectedWorkspaceId, selectedProjectId)} key={`${source.type}-${source.id}`} onClick={() => setIsOpen(false)}><span className="truncate">{source.label}</span><ExternalLink className="h-3 w-3 shrink-0" /></Link>)}</div></details> : null}
              </div>
            </article>)}
            {isAsking ? <div className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-black text-white"><Sparkles className="h-3.5 w-3.5" /></span><div className="flex gap-1 px-1 py-2"><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-.3s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-.15s]" /><span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" /></div></div> : null}
            {errorMessage ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{errorMessage}</p> : null}
            <div ref={messageEndRef} />
          </div>

          {messages.length > 0 && suggestions.length ? <div className="flex flex-wrap gap-1.5 border-t border-slate-100 bg-white px-5 py-2.5">{suggestions.slice(0, 3).map((item) => <button className="max-w-full rounded-full border border-slate-200 px-3 py-1.5 text-left text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900" key={item} onClick={() => void sendQuestion(item)} type="button">{item}</button>)}</div> : null}
          <form className="bg-white px-5 pb-5 pt-2" onSubmit={submitQuestion}>
            <div className="flex items-end gap-2 rounded-[28px] border border-slate-200 bg-white p-2.5 shadow-[0_4px_20px_rgba(0,0,0,.09)] transition focus-within:border-slate-300 focus-within:shadow-[0_6px_24px_rgba(0,0,0,.12)]"><textarea aria-label="Câu hỏi cho trợ lý" className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] leading-6 text-slate-950 outline-none placeholder:text-slate-400" onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder="Hỏi bất kỳ điều gì về dự án" rows={1} value={question} /><button aria-label="Gửi" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition hover:bg-slate-800 disabled:bg-slate-200" disabled={question.trim().length < 3 || isAsking} type="submit"><Send className="h-4 w-4" /></button></div>
          </form>
        </section>
      ) : null}
      <button aria-label={isOpen ? "Đóng trợ lý" : "Mở trợ lý"} className={`fixed bottom-5 right-5 z-50 flex h-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_12px_30px_rgba(37,99,235,.35)] transition hover:-translate-y-0.5 hover:bg-blue-700 ${isOpen ? "w-14" : "w-14 sm:w-auto sm:gap-2 sm:px-4"}`} onClick={() => setIsOpen((current) => !current)} type="button">{isOpen ? <X className="h-5 w-5" /> : <><MessageCircle className="h-5 w-5" /><span className="hidden text-sm font-bold sm:inline">Hỏi AI</span></>}</button>
    </>
  );
}
