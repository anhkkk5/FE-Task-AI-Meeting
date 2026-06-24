import Link from "next/link";
import { DailyMood, DailyUpdate } from "../types/daily-update.type";

type DailyUpdateCardProps = {
  dailyUpdate: DailyUpdate;
  workspaceId: string;
  projectId: string;
};

const moodStyles: Record<DailyMood, string> = {
  GOOD: "border-emerald-100 bg-emerald-50 text-emerald-700",
  NORMAL: "border-blue-100 bg-blue-50 text-blue-700",
  BLOCKED: "border-amber-100 bg-amber-50 text-amber-800",
  TIRED: "border-zinc-200 bg-zinc-50 text-zinc-700",
};

const moodLabels: Record<DailyMood, string> = {
  GOOD: "Tốt",
  NORMAL: "Bình thường",
  BLOCKED: "Bị chặn",
  TIRED: "Mệt",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("vi-VN");
}

export function DailyUpdateCard({
  dailyUpdate,
  workspaceId,
  projectId,
}: DailyUpdateCardProps) {
  const mood = dailyUpdate.mood;

  return (
    <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">
            {dailyUpdate.user?.fullName?.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-900">
              {dailyUpdate.user?.fullName ?? "Thành viên"}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {dailyUpdate.user?.email ?? dailyUpdate.userId}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-600">
                {formatDate(dailyUpdate.updateDate)}
              </span>
              <span className="rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">
                {dailyUpdate.sprint?.name ?? "Không gắn sprint"}
              </span>
              {mood ? (
                <span
                  className={`rounded-lg border px-2 py-1 text-[10px] font-bold ${moodStyles[mood]}`}
                >
                  {moodLabels[mood]}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <Link
          className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-bold text-zinc-700 transition hover:bg-zinc-50"
          href={`/workspaces/${workspaceId}/projects/${projectId}/daily-updates/${dailyUpdate.id}`}
        >
          Chi tiết
        </Link>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Hôm qua
          </h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
            {dailyUpdate.yesterdayWork}
          </p>
        </section>
        <section className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
            Hôm nay
          </h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-zinc-700">
            {dailyUpdate.todayPlan}
          </p>
        </section>
      </div>

      {dailyUpdate.blockers ? (
        <section className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-amber-700">
            Blocker
          </h3>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-amber-900">
            {dailyUpdate.blockers}
          </p>
        </section>
      ) : null}
    </article>
  );
}
