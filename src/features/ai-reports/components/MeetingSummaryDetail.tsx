"use client";

import { useMemo, useState } from "react";
import {
  Sparkles,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  FileText,
  ListTodo,
  Quote,
  Clock,
  Printer,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AiMeetingSummary } from "../types/ai-report.type";
import { MeetingSummaryActionItems } from "./MeetingSummaryActionItems";
import { MeetingClaims } from "./MeetingClaims";

type MeetingSummaryDetailProps = {
  summary: AiMeetingSummary;
};

// Hàm phân tách các đoạn văn dài hoặc nội dung transcript thành bullet point sạch sẽ
function parseTextToBullets(text: string): string[] {
  if (!text) return [];
  // Nếu đã chứa dấu xuống dòng
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;

  // Nếu text là một đoạn dài dằng dặc không xuống dòng nhưng có các câu ngăn cách bởi dấu chấm
  if (text.length > 150) {
    const sentences = text
      .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ỹ0-9])/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);
    if (sentences.length > 1) return sentences;
  }

  return [text];
}

type InsightBoxProps = {
  title: string;
  items?: string[];
  emptyText: string;
  icon: React.ElementType;
  tone: "blue" | "emerald" | "amber" | "purple" | "slate";
};

function InsightCard({
  title,
  items = [],
  emptyText,
  icon: Icon,
  tone,
}: InsightBoxProps) {
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
    slate: {
      badge: "bg-slate-100 text-slate-700 border-slate-200",
      bullet: "bg-slate-500",
      itemBg: "bg-slate-50 border-slate-200 text-slate-800",
      iconBg: "bg-slate-100 text-slate-600",
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
            {displayItems.map((item, idx) => {
              // Kiểm tra xem item có format Speaker: content không
              const matchSpeaker = item.match(/^([^:]{2,20}):\s*(.+)$/);
              return (
                <li
                  key={`${item}-${idx}`}
                  className={`rounded-xl border p-3 text-xs font-medium leading-relaxed ${toneClasses.itemBg}`}
                >
                  {matchSpeaker ? (
                    <div>
                      <span className="inline-block rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-200 shadow-2xs mr-1.5">
                        {matchSpeaker[1]}
                      </span>
                      <span className="text-slate-800">{matchSpeaker[2]}</span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${toneClasses.bullet}`} />
                      <span className="text-slate-800">{item}</span>
                    </div>
                  )}
                </li>
              );
            })}
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

export function MeetingSummaryDetail({ summary }: MeetingSummaryDetailProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "actions" | "claims" | "raw">("overview");
  const [copied, setCopied] = useState(false);

  const output = summary.aiOutput || {};
  const title = output.title || summary.title;
  const generalSummary = output.summary || summary.summary;
  const keyPoints = output.keyPoints ?? summary.keyPoints ?? [];
  const decisions = output.decisions ?? summary.decisions ?? [];
  const actionItems = output.actionItems ?? summary.actionItems ?? [];
  const risks = output.risks ?? summary.risks ?? [];
  const openQuestions = output.openQuestions ?? summary.openQuestions ?? [];
  const nextSteps = output.nextSteps ?? summary.nextSteps ?? [];
  const claims = summary.claims ?? [];

  const cleanTitle = (title || "Tóm tắt cuộc họp")
    .replace(/^\s*\[[A-Z0-9_-]+\]\s*/i, "")
    .replace(/^(Tom tat meeting|Tóm tắt cuộc họp)\s*[-–:]\s*/i, "")
    .trim();

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
    const actions = actionItems.length
      ? `<table><thead><tr><th>#</th><th>Công việc</th><th>Người phụ trách</th><th>Hạn</th></tr></thead><tbody>${actionItems.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.text)}</td><td>${escapeHtml(item.assigneeName || "Chưa xác định")}</td><td>${escapeHtml(item.dueDate || "—")}</td></tr>`).join("")}</tbody></table>`
      : '<p class="empty">Không có công việc cần làm.</p>';
    reportWindow.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${escapeHtml(cleanTitle)}</title><style>@page{size:A4;margin:16mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#20242b;line-height:1.55;font-size:13px}header{border-bottom:2px solid #b96f3c;padding-bottom:16px;margin-bottom:26px}.eyebrow{color:#b96f3c;text-transform:uppercase;letter-spacing:.12em;font-weight:700;font-size:11px}h1{font-size:25px;margin:6px 0}h2{font-size:19px;margin:26px 0 12px;border-bottom:1px solid #dbc8bb;padding-bottom:7px}ul{margin:0;padding-left:22px}li{margin:9px 0}.summary{border-left:4px solid #c87943;background:#fbf8f5;padding:15px 18px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dfd5ce;padding:10px;text-align:left;vertical-align:top}th{background:#f4eee9}.meta{color:#69707d}.empty{color:#8a9099;font-style:italic}</style></head><body><header><div class="eyebrow">Báo cáo AI sau cuộc họp</div><h1>${escapeHtml(cleanTitle)}</h1><div class="meta">Thời điểm tạo: ${escapeHtml(summary.createdAt?.slice(0,16).replace("T"," ") || "—")}</div></header><h2>1. Tóm tắt nhanh</h2><div class="summary">${escapeHtml(generalSummary)}</div><h2>2. Nội dung chính theo thành viên</h2>${list(keyPoints)}<h2>3. Quyết định quan trọng</h2>${list(decisions)}<h2>4. Việc cần làm</h2>${actions}<h2>5. Rủi ro và vấn đề cần theo dõi</h2>${list(risks)}</body></html>`);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 250);
  };

  const handleCopy = () => {
    const fullText = [
      `# ${title}`,
      `Thời điểm tạo: ${summary.createdAt?.slice(0, 16).replace("T", " ") ?? ""}`,
      `\n## TỔNG QUAN\n${generalSummary}`,
      `\n## Ý CHÍNH\n${keyPoints.map((k) => `- ${k}`).join("\n")}`,
      `\n## QUYẾT ĐỊNH\n${decisions.map((d) => `- ${d}`).join("\n")}`,
      `\n## VIỆC CẦN LÀM\n${actionItems.map((a) => `- ${a.text} (Người phụ trách: ${a.assigneeName || "Chưa có"}, Hạn: ${a.dueDate || "Chưa có"})`).join("\n")}`,
      `\n## RỦI RO\n${risks.map((r) => `- ${r}`).join("\n")}`,
      `\n## CÂU HỎI MỞ\n${openQuestions.map((q) => `- ${q}`).join("\n")}`,
      `\n## BƯỚC TIẾP THEO\n${nextSteps.map((s) => `- ${s}`).join("\n")}`,
    ].join("\n");

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Card Tóm tắt */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 border border-blue-100">
                <Sparkles className="h-3 w-3" />
                Tóm tắt AI Cuộc họp
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-100">
                <CheckCircle2 className="h-3 w-3" />
                Đã xử lý
              </span>
              {summary.model ? (
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                  Mô hình: {summary.model}
                </span>
              ) : null}
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-snug">
              {cleanTitle}
            </h1>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Thời điểm tạo: <b>{summary.createdAt?.slice(0, 16).replace("T", " ") ?? "-"}</b></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={handleExportPdf} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800">
              <Printer className="h-3.5 w-3.5" /> Xuất PDF
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 transition"
              title="Sao chép toàn bộ tóm tắt vào bộ nhớ tạm"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copied ? "Đã sao chép" : "Sao chép tóm tắt"}</span>
            </button>
          </div>
        </div>

        {/* Thanh đếm thống kê nhanh (Metric Highlights) */}
        <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-5 border-t border-slate-100 pt-4">
          <div className="rounded-xl bg-blue-50/60 border border-blue-100/80 p-3 text-center">
            <p className="text-[11px] font-bold text-blue-700">Ý chính</p>
            <p className="text-lg font-black text-blue-950 mt-0.5">{keyPoints.length}</p>
          </div>
          <div className="rounded-xl bg-emerald-50/60 border border-emerald-100/80 p-3 text-center">
            <p className="text-[11px] font-bold text-emerald-700">Quyết định</p>
            <p className="text-lg font-black text-emerald-950 mt-0.5">{decisions.length}</p>
          </div>
          <div className="rounded-xl bg-amber-50/60 border border-amber-100/80 p-3 text-center">
            <p className="text-[11px] font-bold text-amber-800">Cần làm</p>
            <p className="text-lg font-black text-amber-950 mt-0.5">{actionItems.length}</p>
          </div>
          <div className="rounded-xl bg-rose-50/60 border border-rose-100/80 p-3 text-center">
            <p className="text-[11px] font-bold text-rose-700">Rủi ro</p>
            <p className="text-lg font-black text-rose-950 mt-0.5">{risks.length}</p>
          </div>
          <div className="rounded-xl bg-purple-50/60 border border-purple-100/80 p-3 text-center col-span-2 sm:col-span-1">
            <p className="text-[11px] font-bold text-purple-700">Câu hỏi mở</p>
            <p className="text-lg font-black text-purple-950 mt-0.5">{openQuestions.length}</p>
          </div>
        </div>
      </section>

      {/* Điều hướng Tab trực quan */}
      <div className="flex border-b border-slate-200 bg-white px-2 rounded-t-2xl shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-bold transition ${
            activeTab === "overview"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Trọng tâm & Điểm chính
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("actions")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-bold transition ${
            activeTab === "actions"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ListTodo className="h-4 w-4" />
          Việc cần làm & Duyệt Task
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
            {actionItems.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("claims")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-bold transition ${
            activeTab === "claims"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Quote className="h-4 w-4" />
          Trích dẫn & Đối chiếu gốc
          {claims.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {claims.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("raw")}
          className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-bold transition ${
            activeTab === "raw"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileText className="h-4 w-4" />
          Toàn văn báo cáo
        </button>
      </div>

      {/* Nội dung theo Tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 4 Cards Lưới: Ý chính, Quyết định, Rủi ro, Câu hỏi mở */}
          <div className="grid gap-5 lg:grid-cols-2">
            <InsightCard
              title="Nội dung chính theo thành viên"
              items={keyPoints}
              emptyText="Chưa ghi nhận ý chính."
              icon={Sparkles}
              tone="blue"
            />

            <InsightCard
              title="Quyết định đã thống nhất"
              items={decisions}
              emptyText="Chưa có quyết định nào được chốt."
              icon={Lightbulb}
              tone="emerald"
            />

            <InsightCard
              title="Rủi ro & Điểm nghẽn cần chú ý"
              items={risks}
              emptyText="Không phát hiện rủi ro nghiêm trọng."
              icon={AlertTriangle}
              tone="amber"
            />

            <InsightCard
              title="Câu hỏi mở & Vấn đề tồn đọng"
              items={openQuestions}
              emptyText="Không có câu hỏi mở chưa được giải quyết."
              icon={HelpCircle}
              tone="purple"
            />
          </div>

          {/* Bước tiếp theo (Next Steps) */}
          {nextSteps.length > 0 && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <ArrowRight className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Bước tiếp theo (Next Steps)</h3>
                  <p className="text-xs text-slate-500">Các hành động dự kiến triển khai sau cuộc họp</p>
                </div>
              </div>

              <div className="grid gap-2.5">
                {nextSteps.flatMap((st) => parseTextToBullets(st)).map((step, index) => (
                  <div
                    key={`${step}-${index}`}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs font-medium text-slate-800 transition hover:bg-slate-50"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white">
                      {index + 1}
                    </span>
                    <span className="pt-0.5 leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {activeTab === "actions" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900">Danh sách Việc cần làm & Duyệt Task</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rà soát các mục công việc do AI trích xuất từ cuộc họp và bấm tạo task để đưa vào Sprint/Backlog
            </p>
          </div>
          <MeetingSummaryActionItems
            workspaceId={summary.workspaceId}
            projectId={summary.projectId}
            summaryId={summary.id}
            items={actionItems}
          />
        </section>
      )}

      {activeTab === "claims" && (
        <MeetingClaims claims={summary.claims} />
      )}

      {activeTab === "raw" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Toàn văn văn bản do AI tổng hợp</h2>
              <p className="text-xs text-slate-500">Định dạng raw text dùng để tham khảo hoặc lưu trữ</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              {copied ? "Đã chép" : "Sao chép"}
            </button>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-line max-h-[600px] overflow-y-auto">
            {output.generatedText || generalSummary}
          </div>
        </section>
      )}
    </div>
  );
}
