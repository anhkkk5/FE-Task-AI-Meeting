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
      <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-bold text-zinc-500">
        Chỉ OWNER, SCRUM_MASTER hoặc PROJECT_MANAGER mới được tạo tóm tắt.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:bg-zinc-400 disabled:shadow-none"
        disabled={disabled || !hasTranscript}
        type="button"
        onClick={() => onGenerate(false)}
      >
        {hasSummary ? "Dùng tóm tắt mới nhất" : "Tạo tóm tắt"}
      </button>
      <button
        className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:text-zinc-400"
        disabled={disabled || !hasTranscript}
        type="button"
        onClick={() => onGenerate(true)}
      >
        Tạo lại
      </button>
    </div>
  );
}
