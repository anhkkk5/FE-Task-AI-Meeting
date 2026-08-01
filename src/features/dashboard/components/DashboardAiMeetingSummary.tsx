"use client";

import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";

type DashboardAiMeetingSummaryProps = {
  summaryText?: string;
  workspaceId?: string;
  projectId?: string;
};

export function DashboardAiMeetingSummary({
  summaryText,
  workspaceId,
  projectId,
}: DashboardAiMeetingSummaryProps) {
  const content = summaryText || null;

  const detailLink =
    workspaceId && projectId
      ? `/workspaces/${workspaceId}/projects/${projectId}/ai-reports/personal`
      : "/workspaces";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between h-full">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <span>Trợ lý AI — Tóm tắt cuộc họp</span>
          </div>
          <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200/60">
            Tự động
          </span>
        </div>

        <div>
          <span className="block text-[11px] font-extrabold text-blue-600 uppercase tracking-wider mb-1.5">
            Tóm tắt nhanh
          </span>
          {content ? (
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs font-semibold text-slate-700 leading-relaxed">
              {content}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center text-xs font-medium text-slate-400 leading-relaxed">
              Chưa có bản tóm tắt cuộc họp nào được tạo. Người tham gia cần bật ghi biên bản trong phòng họp để AI tổng hợp tự động.
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-start">
        <Link
          href={detailLink}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition"
        >
          <FileText className="h-3.5 w-3.5 text-slate-400" />
          Xem chi tiết
        </Link>
      </div>
    </div>
  );
}
