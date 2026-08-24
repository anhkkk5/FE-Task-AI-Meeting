import type { MeetingClaim } from "../types/ai-report.type";
import { CheckCircle2, AlertTriangle, HelpCircle, Lightbulb, FileText, Quote, Clock, User } from "lucide-react";

const categoryConfig = {
  KEY_POINT: {
    label: "Ý chính",
    icon: CheckCircle2,
    bgClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  DECISION: {
    label: "Quyết định",
    icon: Lightbulb,
    bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  BLOCKER: {
    label: "Rủi ro / Trở ngại",
    icon: AlertTriangle,
    bgClass: "bg-rose-50 text-rose-700 border-rose-200",
  },
  OPEN_QUESTION: {
    label: "Câu hỏi mở",
    icon: HelpCircle,
    bgClass: "bg-purple-50 text-purple-700 border-purple-200",
  },
  RECOMMENDATION: {
    label: "Đề xuất",
    icon: FileText,
    bgClass: "bg-amber-50 text-amber-700 border-amber-200",
  },
} as const;

const kindLabel = {
  FACT: "Dữ kiện thực tế",
  INFERENCE: "Suy luận AI",
  RECOMMENDATION: "Đề xuất gợi ý",
} as const;

export function MeetingClaims({ claims = [] }: { claims?: MeetingClaim[] }) {
  if (!claims || claims.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Quote className="h-5 w-5 text-blue-600" />
            Nội dung đã phân loại & Đối chiếu nguồn
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu trích xuất từ cuộc họp kèm căn cứ đoạn nói (transcript segment) để kiểm chứng
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
          {claims.length} dẫn chứng
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-1">
        {claims.map((claim) => {
          const config = categoryConfig[claim.category] || {
            label: claim.category,
            icon: FileText,
            bgClass: "bg-slate-50 text-slate-700 border-slate-200",
          };
          const Icon = config.icon;

          return (
            <article
              key={claim.id}
              className="group rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition hover:bg-white hover:border-slate-300 hover:shadow-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${config.bgClass}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </span>
                  <span className="rounded-lg bg-slate-200/70 px-2 py-0.5 text-[11px] font-medium text-slate-700">
                    {kindLabel[claim.kind] || claim.kind}
                  </span>
                </div>
              </div>

              <p className="mt-2.5 text-sm font-semibold leading-relaxed text-slate-800">
                {claim.text}
              </p>

              {claim.citation ? (
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2 font-bold text-blue-900 mb-1">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    <span>{claim.citation.speakerName || "Người tham gia"}</span>
                    <span className="text-slate-400 font-normal">·</span>
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-medium text-slate-500">
                      {new Date(claim.citation.startedAt).toLocaleTimeString("vi-VN")}
                      {claim.citation.segmentId ? ` (Đoạn #${claim.citation.segmentId})` : ""}
                    </span>
                  </div>
                  <p className="italic text-slate-600 bg-white/60 rounded p-2 border border-blue-50">
                    “{claim.citation.text}”
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-xs font-medium text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Không tìm thấy đoạn trích dẫn đủ tương đồng — AI tổng hợp từ bối cảnh chung.
                </p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
