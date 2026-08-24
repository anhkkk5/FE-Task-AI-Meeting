"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  User,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  ListTodo,
  Calendar,
  Clock,
  Quote,
  FileText,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  AiPersonalizedMeetingSummary,
  PersonalizedMeetingActionItem,
} from "../types/personalized-meeting-summary.type";

type PersonalizedMeetingSummaryDetailProps = {
  summary: AiPersonalizedMeetingSummary;
  workspaceId?: string;
  projectId?: string;
};

function parseTextToBullets(text: string): string[] {
  if (!text) return [];
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;

  if (text.length > 150) {
    const sentences = text
      .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ỹ0-9])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
    if (sentences.length > 1) return sentences;
  }

  return [text];
}

function InsightCard({
  title,
  items = [],
  emptyText,
  icon: Icon,
  tone,
}: {
  title: string;
  items?: string[];
  emptyText: string;
  icon: React.ElementType;
  tone: "blue" | "emerald" | "amber" | "purple";
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const parsedItems = useMemo(() => {
    if (!items || !items.length) return [];
    return items.flatMap((it) => parseTextToBullets(it));
  }, [items]);

  const toneClasses = {
    blue: {
      badge: "bg-blue-50 text-blue-700 border-blue-200",
      bullet: "bg-blue-500",
      itemBg: "bg-blue-50/40 border-blue-100/80 text-slate-800",
      iconBg: "bg-blue-100 text-blue-600",
    },
    emerald: {
      badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
      bullet: "bg-emerald-500",
      itemBg: "bg-emerald-50/40 border-emerald-100/80 text-slate-800",
      iconBg: "bg-emerald-100 text-emerald-600",
    },
    amber: {
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      bullet: "bg-amber-500",
      itemBg: "bg-amber-50/40 border-amber-100/80 text-slate-800",
      iconBg: "bg-amber-100 text-amber-600",
    },
    purple: {
      badge: "bg-purple-50 text-purple-700 border-purple-200",
      bullet: "bg-purple-500",
      itemBg: "bg-purple-50/40 border-purple-100/80 text-slate-800",
      iconBg: "bg-purple-100 text-purple-600",
    },
  }[tone];

  const displayItems = isExpanded ? parsedItems : parsedItems.slice(0, 5);
  const hasMore = parsedItems.length > 5;

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-slate-300">
      <div>
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClasses.iconBg}`}>
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${toneClasses.badge}`}>
            {parsedItems.length}
          </span>
        </div>

        {parsedItems.length === 0 ? (
          <p className="py-4 text-center text-xs font-medium text-slate-400 italic">
            {emptyText}
          </p>
        ) : (
          <ul className="space-y-2">
            {displayItems.map((item, idx) => (
              <li
                key={`${item}-${idx}`}
                className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-medium leading-relaxed ${toneClasses.itemBg}`}
              >
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${toneClasses.bullet}`} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition pt-2 border-t border-slate-100"
        >
          {isExpanded ? "Thu gọn bớt" : `Xem thêm (${parsedItems.length - 5} mục)`}
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

function ActionItems({ items }: { items: PersonalizedMeetingActionItem[] }) {
  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-6 text-center text-xs font-semibold text-slate-500">
        Chưa có việc cần làm trực tiếp cho bạn trong cuộc họp này.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item, index) => (
        <article
          key={`${item.title}-${index}`}
          className="rounded-xl border border-slate-200 bg-slate-50/40 p-4 transition hover:bg-white hover:border-slate-300 hover:shadow-xs"
        >
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-900">{item.title}</p>
              {item.source ? (
                <p className="text-xs font-medium text-slate-500 flex items-center gap-1">
                  <Quote className="h-3 w-3 text-slate-400" />
                  Nguồn: {item.source}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                <User className="h-3 w-3" />
                {item.assigneeName ?? "Tôi"}
              </span>
              {item.deadline ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  Hạn: {item.deadline}
                </span>
              ) : null}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function PersonalizedMeetingSummaryDetail({
  summary,
  workspaceId,
  projectId,
}: PersonalizedMeetingSummaryDetailProps) {
  const [copied, setCopied] = useState(false);
  const output = summary.aiOutput || {};
  const activeWorkspaceId = workspaceId ?? summary.workspaceId;
  const activeProjectId = projectId ?? summary.projectId;

  const myActions = output.myActionItems ?? [];
  const decisions = output.relevantDecisions ?? [];
  const mentions = output.mentions ?? [];
  const risks = output.risks ?? [];
  const nextSteps = output.nextSteps ?? [];

  const handleCopy = () => {
    const fullText = [
      `# ${output.title}`,
      `Thời điểm tạo: ${summary.createdAt?.slice(0, 16).replace("T", " ") ?? ""}`,
      `\n## TÓM TẮT DÀNH CHO TÔI\n${output.personalSummary || summary.personalSummary}`,
      `\n## VIỆC CỦA TÔI\n${myActions.map((a) => `- ${a.title} (Hạn: ${a.deadline || "Chưa có"})`).join("\n")}`,
      `\n## QUYẾT ĐỊNH LIÊN QUAN\n${decisions.map((d) => `- ${d}`).join("\n")}`,
      `\n## ĐƯỢC NHẮC ĐẾN\n${mentions.map((m) => `- ${m}`).join("\n")}`,
      `\n## RỦI RO\n${risks.map((r) => `- ${r}`).join("\n")}`,
      `\n## BƯỚC TIẾP THEO\n${nextSteps.map((s) => `- ${s}`).join("\n")}`,
    ].join("\n");

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 border border-violet-100">
                <User className="h-3 w-3" />
                Tóm tắt Cuộc họp Cá nhân
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="h-3 w-3" />
                Đã xử lý
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
              {output.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Thời điểm tạo: <b>{summary.createdAt?.slice(0, 16).replace("T", " ") ?? "-"}</b></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
            </button>
          </div>
        </div>

        {/* Thống kê nhanh */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4 border-t border-slate-100 pt-4">
          <div className="rounded-xl bg-violet-50/60 border border-violet-100/80 p-3 text-center">
            <p className="text-[11px] font-bold text-violet-700">Việc của tôi</p>
            <p className="text-lg font-black text-violet-950 mt-0.5">{myActions.length}</p>
          </div>
          <div className="rounded-xl bg-blue-50/60 border border-blue-100/80 p-3 text-center">
            <p className="text-[11px] font-bold text-blue-700">Quyết định liên quan</p>
            <p className="text-lg font-black text-blue-950 mt-0.5">{decisions.length}</p>
          </div>
          <div className="rounded-xl bg-emerald-50/60 border border-emerald-100/80 p-3 text-center">
            <p className="text-[11px] font-bold text-emerald-700">Lượt nhắc đến</p>
            <p className="text-lg font-black text-emerald-950 mt-0.5">{mentions.length}</p>
          </div>
          <div className="rounded-xl bg-rose-50/60 border border-rose-100/80 p-3 text-center">
            <p className="text-[11px] font-bold text-rose-700">Rủi ro liên quan</p>
            <p className="text-lg font-black text-rose-950 mt-0.5">{risks.length}</p>
          </div>
        </div>
      </section>

      {/* Tóm tắt góc nhìn cá nhân */}
      <section className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-violet-50/40 p-6 shadow-xs">
        <div className="flex items-center gap-2 text-violet-900 mb-2 font-bold text-sm">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span>Tóm tắt góc nhìn cá nhân</span>
        </div>
        <p className="text-sm font-medium leading-relaxed text-slate-800 whitespace-pre-line">
          {output.personalSummary || summary.personalSummary}
        </p>
      </section>

      {/* Việc của tôi */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-blue-600" />
              Việc cần làm của tôi ({myActions.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Các đầu việc được chỉ định trực tiếp cho bạn</p>
          </div>
          <Link
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 shadow-2xs"
            href={`/workspaces/${activeWorkspaceId}/projects/${activeProjectId}/my-meeting-action-items`}
          >
            <span>Tất cả việc của tôi</span>
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        <ActionItems items={myActions} />
      </section>

      {/* 4 Cards Lưới */}
      <div className="grid gap-5 lg:grid-cols-2">
        <InsightCard
          title="Quyết định liên quan đến tôi"
          items={decisions}
          emptyText="Chưa có quyết định trực tiếp liên quan."
          icon={Lightbulb}
          tone="blue"
        />

        <InsightCard
          title="Nội dung được nhắc đến"
          items={mentions}
          emptyText="Không có đoạn phát biểu nào nhắc trực tiếp tên bạn."
          icon={Quote}
          tone="emerald"
        />

        <InsightCard
          title="Rủi ro / Điểm nghẽn cá nhân"
          items={risks}
          emptyText="Không phát hiện rủi ro ảnh hưởng trực tiếp."
          icon={AlertTriangle}
          tone="amber"
        />

        <InsightCard
          title="Bước tiếp theo của tôi"
          items={nextSteps}
          emptyText="Chưa có hành động tiếp theo cụ thể."
          icon={ArrowRight}
          tone="purple"
        />
      </div>
    </div>
  );
}
