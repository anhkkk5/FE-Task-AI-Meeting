type GenerateMode = "me" | "member" | "all";

type PersonalizedMeetingSummaryGenerateButtonProps = {
  canManage: boolean;
  disabled?: boolean;
  hasMeetingSummary: boolean;
  hasSummary: boolean;
  selectedMemberId?: string;
  onGenerate: (mode: GenerateMode, forceRegenerate: boolean) => void;
};

export function PersonalizedMeetingSummaryGenerateButton({
  canManage,
  disabled,
  hasMeetingSummary,
  hasSummary,
  selectedMemberId,
  onGenerate,
}: PersonalizedMeetingSummaryGenerateButtonProps) {
  const mode: GenerateMode = selectedMemberId ? "member" : "me";
  const primaryLabel = selectedMemberId
    ? "Tạo cho thành viên"
    : hasSummary
      ? "Dùng tóm tắt mới nhất"
      : "Tạo tóm tắt của tôi";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:bg-zinc-400 disabled:shadow-none"
        disabled={disabled || !hasMeetingSummary}
        type="button"
        onClick={() => onGenerate(mode, false)}
      >
        {primaryLabel}
      </button>
      <button
        className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50 disabled:text-zinc-400"
        disabled={disabled || !hasMeetingSummary}
        type="button"
        onClick={() => onGenerate(mode, true)}
      >
        Tạo lại
      </button>
      {canManage ? (
        <button
          className="h-10 rounded-xl border border-violet-200 bg-violet-50 px-4 text-xs font-bold text-violet-700 transition hover:bg-violet-100 disabled:text-zinc-400"
          disabled={disabled || !hasMeetingSummary}
          type="button"
          onClick={() => onGenerate("all", false)}
        >
          Tạo cho tất cả thành viên
        </button>
      ) : null}
    </div>
  );
}
