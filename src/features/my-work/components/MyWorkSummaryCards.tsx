"use client";

import {
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  Loader2,
} from "lucide-react";

export type MyWorkSummary = {
  open: number;
  inProgress: number;
  overdue: number;
  done: number;
};

type MyWorkSummaryCardsProps = {
  summary: MyWorkSummary;
  /** Chua co du lieu thi hien dau gach thay vi so 0 gay hieu nham. */
  isPending: boolean;
};

export function MyWorkSummaryCards({
  summary,
  isPending,
}: MyWorkSummaryCardsProps) {
  const cards = [
    {
      label: "Đang mở",
      value: summary.open,
      icon: CircleDashed,
      tone: "bg-sky-50 text-sky-600 border-sky-100",
    },
    {
      label: "Đang làm",
      value: summary.inProgress,
      icon: Loader2,
      tone: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      label: "Quá hạn",
      value: summary.overdue,
      icon: CalendarClock,
      tone: "bg-rose-50 text-rose-600 border-rose-100",
    },
    {
      label: "Hoàn thành",
      value: summary.done,
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs"
          >
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${card.tone}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900">
              {isPending ? "—" : card.value}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-400">
              {card.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
