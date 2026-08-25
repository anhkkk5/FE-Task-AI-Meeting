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
  disabled,
  hasMeetingSummary,
  hasSummary,
  selectedMemberId,
  onGenerate,
}: PersonalizedMeetingSummaryGenerateButtonProps) {
  const mode: GenerateMode = selectedMemberId ? "member" : "me";
  const primaryLabel = hasSummary
    ? "Làm mới báo cáo"
    : "Thử tạo báo cáo ngay";

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className="h-10 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-700 disabled:bg-zinc-400 disabled:shadow-none"
        disabled={disabled || !hasMeetingSummary}
        type="button"
        onClick={() => onGenerate(mode, hasSummary)}
      >
        {primaryLabel}
      </button>
      <span className="flex items-center text-xs font-medium text-emerald-700">
        AI tự tạo sau khi cuộc họp kết thúc
      </span>
    </div>
  );
}
