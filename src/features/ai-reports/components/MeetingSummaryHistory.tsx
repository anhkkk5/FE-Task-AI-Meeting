"use client";

import Link from "next/link";
import { History, Clock, ChevronRight } from "lucide-react";
import { AiMeetingSummary } from "../types/ai-report.type";

type MeetingSummaryHistoryProps = {
  items: AiMeetingSummary[];
  workspaceId: string;
  projectId: string;
  currentSummaryId?: string;
};

export function MeetingSummaryHistory({
  items,
  workspaceId,
  projectId,
  currentSummaryId,
}: MeetingSummaryHistoryProps) {
  if (!items.length) {
    return (
      <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-xs">
        <History className="mx-auto h-7 w-7 text-slate-400 mb-2" />
        <p className="text-sm font-bold text-slate-700">Chưa có lịch sử tóm tắt</p>
        <p className="mt-1 text-xs text-slate-500">
          Hãy thêm biên bản nội dung, sau đó tạo tóm tắt AI để lưu các phiên bản.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="mb-3 flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">Lịch sử tóm tắt</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
          {items.length} phiên bản
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isCurrent = item.id === currentSummaryId;

          return (
            <Link
              key={item.id}
              className={`group block rounded-xl border p-3.5 transition ${
                isCurrent
                  ? "border-blue-300 bg-blue-50/70 shadow-2xs"
                  : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-white hover:shadow-xs"
              }`}
              href={`/workspaces/${workspaceId}/projects/${projectId}/ai-reports/meeting-summaries/${item.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`text-xs font-bold truncate ${isCurrent ? "text-blue-950" : "text-slate-800"}`}>
                      {item.title || "Tóm tắt cuộc họp"}
                    </p>
                    {isCurrent && (
                      <span className="rounded bg-blue-600 px-1.5 py-0.2 text-[9px] font-bold text-white shrink-0">
                        Đang xem
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    <span>{item.createdAt?.slice(0, 16).replace("T", " ") ?? "-"}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition shrink-0 mt-0.5" />
              </div>

              {item.summary && (
                <p className="mt-2 line-clamp-2 text-xs text-slate-500 leading-relaxed">
                  {item.summary}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
