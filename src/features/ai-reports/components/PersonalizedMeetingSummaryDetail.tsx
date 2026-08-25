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
  Printer,
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

function cleanDisplayTitle(title?: string) {
  return (title || "Tóm tắt dành cho tôi")
    .replace(/^\s*\[[A-Z0-9_-]+\]\s*/i, "")
    .replace(/^(Tóm tắt|Tom tat) (cuộc họp |cuoc hop )?(cá nhân hóa|ca nhan hoa)?\s*[-–:]\s*/i, "")
    .trim();
}

function cleanLegacySummary(text?: string | null) {
  return (text || "Chưa có nội dung tóm tắt.")
    .replace(/\[AI_SUMMARY_[A-Z0-9_]+\]\s*/gi, "")
    .replace(/Action items lien quan:/gi, "Việc cần ưu tiên:")
    .replace(/\s*Transcript co nhac den:[\s\S]*$/i, "")
    .replace(/Chua co noi dung lien quan truc tiep/gi, "Chưa có nội dung liên quan trực tiếp.")
    .trim();
}

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

  if (parsedItems.length === 0) return null;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4">
      <div>
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${toneClasses.iconBg}`}>
              <Icon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${toneClasses.badge}`}>
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
                className={`flex items-start gap-2 rounded-lg border p-3 text-[13px] font-normal leading-6 ${toneClasses.itemBg}`}
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
          className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
        >
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-6 text-slate-800">{item.title}</p>
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
  const reportTitle = cleanDisplayTitle(output.title);

  const escapeHtml = (value: string) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const handleExportPdf = () => {
    const reportWindow = window.open("", "_blank", "width=900,height=1000");
    if (!reportWindow) return;
    const list = (items: string[]) => items.length
      ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
      : '<p class="empty">Không có nội dung.</p>';
    const actions = myActions.length
      ? `<table><thead><tr><th>#</th><th>Việc cần làm</th><th>Thời hạn</th></tr></thead><tbody>${myActions.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.title)}</td><td>${escapeHtml(item.deadline || "—")}</td></tr>`).join("")}</tbody></table>`
      : '<p class="empty">Không có việc được giao trực tiếp.</p>';
    reportWindow.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(reportTitle)}</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#20242b;line-height:1.55;font-size:13px}header{border-bottom:2px solid #7654b5;padding-bottom:16px;margin-bottom:26px}.eyebrow{color:#7654b5;text-transform:uppercase;letter-spacing:.12em;font-weight:700;font-size:11px}h1{font-size:25px;margin:6px 0}h2{font-size:19px;margin:26px 0 12px;border-bottom:1px solid #d9d1e7;padding-bottom:7px}ul{margin:0;padding-left:22px}li{margin:9px 0}.summary{border-left:4px solid #7654b5;background:#faf8fd;padding:15px 18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ded8e8;padding:10px;text-align:left;vertical-align:top}th{background:#f4f1f8}.meta{color:#69707d}.empty{color:#8a9099;font-style:italic}</style></head><body><header><div class="eyebrow">Báo cáo AI cá nhân sau cuộc họp</div><h1>${escapeHtml(reportTitle)}</h1><div class="meta">Thời điểm tạo: ${escapeHtml(summary.createdAt?.slice(0,16).replace("T"," ") || "—")}</div></header><h2>1. Tóm tắt dành cho tôi</h2><div class="summary">${escapeHtml(cleanLegacySummary(output.personalSummary || summary.personalSummary))}</div><h2>2. Việc cần làm của tôi</h2>${actions}<h2>3. Quyết định liên quan</h2>${list(decisions)}<h2>4. Rủi ro cần theo dõi</h2>${list(risks)}<h2>5. Bước tiếp theo</h2>${list(nextSteps)}</body></html>`);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 250);
  };

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
    <div className="space-y-4">
      {/* Header Card */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700 border border-violet-100">
                <User className="h-3 w-3" />
                Báo cáo cá nhân
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="h-3 w-3" />
                Đã xử lý
              </span>
            </div>

            <h1 className="max-w-3xl text-lg font-semibold leading-7 text-slate-900">
              {reportTitle}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Thời điểm tạo: <b>{summary.createdAt?.slice(0, 16).replace("T", " ") ?? "-"}</b></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
            >
              <Printer className="h-3.5 w-3.5" />
              Xuất PDF
            </button>
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
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <div className="rounded-lg bg-violet-50 px-3 py-2 text-sm text-violet-800">
            <span className="font-semibold">{myActions.length}</span> việc cần làm
          </div>
          <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <span className="font-semibold">{decisions.length}</span> quyết định
          </div>
          <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">
            <span className="font-semibold">{risks.length}</span> rủi ro
          </div>
        </div>
      </section>

      {/* Tóm tắt góc nhìn cá nhân */}
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2 text-violet-900 mb-2 font-bold text-sm">
          <Sparkles className="h-4 w-4 text-violet-600" />
          <span>Tóm tắt góc nhìn cá nhân</span>
        </div>
        <p className="max-w-3xl whitespace-pre-line text-[15px] font-normal leading-7 text-slate-600">
          {cleanLegacySummary(output.personalSummary || summary.personalSummary)}
        </p>
      </section>

      {/* Việc của tôi */}
      {myActions.length > 0 ? <section className="rounded-xl border border-slate-200 bg-white p-5">
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
      </section> : null}

      {/* 4 Cards Lưới */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <InsightCard
          title="Quyết định liên quan đến tôi"
          items={decisions}
          emptyText="Chưa có quyết định trực tiếp liên quan."
          icon={Lightbulb}
          tone="blue"
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

      {mentions.length > 0 ? (
        <details className="group rounded-xl border border-slate-200 bg-white px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-slate-700">
            <span className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-slate-400" />
              Lời thoại dùng để đối chiếu
            </span>
            <span className="text-xs font-normal text-slate-400">
              {mentions.length} đoạn
            </span>
          </summary>
          <div className="mt-4 border-t border-slate-100 pt-4">
            <InsightCard
              title="Nội dung liên quan"
              items={mentions}
              emptyText=""
              icon={Quote}
              tone="emerald"
            />
          </div>
        </details>
      ) : null}
    </div>
  );
}
