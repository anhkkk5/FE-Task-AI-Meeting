import { TeamReportMetrics } from "../types/ai-report.type";

type TeamReportMetricCardsProps = {
  metrics: TeamReportMetrics | null;
};

type MetricCard = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: "brand" | "blue" | "amber" | "slate";
};

const toneStyles: Record<MetricCard["tone"], string> = {
  brand: "border-brand-200 bg-brand-50 text-brand-800",
  blue: "border-blue-200 bg-blue-50 text-blue-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  slate: "border-slate-200 bg-slate-50 text-slate-800",
};

/**
 * Bon the so lieu dat ngay dau bao cao.
 *
 * So lieu lay tu `metrics` do backend tinh san, khong tinh lai o day: danh sach
 * bao cao khong tra ve `inputData` nen tinh o frontend se ra so khac trang chi
 * tiet.
 */
export function TeamReportMetricCards({ metrics }: TeamReportMetricCardsProps) {
  if (!metrics) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500">
        Báo cáo này được tạo trước khi hệ thống lưu số liệu thống kê.
      </p>
    );
  }

  const cards: MetricCard[] = [
    {
      id: "metric-progress",
      label: "Tỷ lệ tiếp nhận",
      value: `${metrics.progressPercent}%`,
      hint: `${metrics.doneTasks}/${metrics.totalTasks} lượt bàn giao`,
      tone: "brand",
    },
    {
      id: "metric-in-progress",
      label: "Chờ phản hồi",
      value: String(metrics.inProgressTasks),
      hint: "bàn giao cần xử lý",
      tone: "blue",
    },
    {
      id: "metric-blockers",
      label: "Cần làm rõ",
      value: String(metrics.blockerCount),
      hint: "cần tháo gỡ",
      tone: "amber",
    },
    {
      id: "metric-members",
      label: "Thành viên",
      value: String(metrics.memberCount),
      hint: "tham gia bàn giao",
      tone: "slate",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          className={`rounded-2xl border px-4 py-3 ${toneStyles[card.tone]}`}
          data-print-block="true"
          id={card.id}
          key={card.id}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-70">
            {card.label}
          </p>
          <p className="mt-1 text-2xl font-black leading-none">{card.value}</p>
          <p className="mt-1 text-[11px] font-semibold opacity-70">
            {card.hint}
          </p>
        </div>
      ))}
    </div>
  );
}
