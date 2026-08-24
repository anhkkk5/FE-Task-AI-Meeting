"use client";

import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";

type MeetingSummaryGenerateButtonProps = {
  canManage: boolean;
  disabled?: boolean;
  hasSummary: boolean;
  hasTranscript: boolean;
  onGenerate: (forceRegenerate: boolean) => void;
};

export function MeetingSummaryGenerateButton({
  canManage,
  disabled,
  hasSummary,
  hasTranscript,
  onGenerate,
}: MeetingSummaryGenerateButtonProps) {
  if (!canManage) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-500">
        <AlertCircle className="h-4 w-4 shrink-0 text-slate-400" />
        <span>Chỉ Owner, Scrum Master hoặc Quản lý dự án mới có quyền tạo tóm tắt.</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none"
        disabled={disabled || !hasTranscript}
        type="button"
        onClick={() => onGenerate(false)}
      >
        <Sparkles className="h-4 w-4" />
        {hasSummary ? "Dùng tóm tắt mới nhất" : "Tạo tóm tắt AI"}
      </button>

      <button
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:text-slate-400 disabled:opacity-60"
        disabled={disabled || !hasTranscript}
        type="button"
        onClick={() => onGenerate(true)}
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Tạo lại phiên bản mới
      </button>
    </div>
  );
}
