"use client";

import Link from "next/link";
import { Calendar, Clock, MoreHorizontal, Users, Video } from "lucide-react";
import { formatDateTime } from "@/lib/utils/relative-time";

export type RealMeetingItem = {
  id: string;
  title: string;
  workspaceId: string;
  projectId: string;
  projectName?: string;
  startTime?: string | null;
  endTime?: string | null;
  meetingType?: string;
  status?: string;
  participants?: { id: string; fullName: string; avatarUrl?: string | null }[];
};

type DashboardUpcomingMeetingProps = {
  meetings: RealMeetingItem[];
  isLoading: boolean;
  workspaceId?: string;
};

export function DashboardUpcomingMeeting({
  meetings,
  isLoading,
  workspaceId,
}: DashboardUpcomingMeetingProps) {
  const upcomingMeeting = meetings[0] || null;

  const roomLink =
    upcomingMeeting && upcomingMeeting.workspaceId && upcomingMeeting.projectId
      ? `/workspaces/${upcomingMeeting.workspaceId}/projects/${upcomingMeeting.projectId}/meetings/${upcomingMeeting.id}/room`
      : workspaceId
      ? `/workspaces/${workspaceId}/projects`
      : "/workspaces";

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
            Cuộc họp sắp tới
          </h3>
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 transition"
            title="Tùy chọn"
          >
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>

        {/* Meeting Content Box */}
        {isLoading ? (
          <div className="flex h-28 items-center justify-center rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              Đang tải danh sách cuộc họp...
            </div>
          </div>
        ) : upcomingMeeting ? (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h4 className="truncate text-sm font-extrabold text-slate-900">
                  {upcomingMeeting.title}
                </h4>
                <p className="truncate text-[11px] font-bold text-blue-600">
                  {upcomingMeeting.projectName || "Dự án"}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {upcomingMeeting.startTime
                      ? formatDateTime(upcomingMeeting.startTime)
                      : "Hôm nay"}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href={roomLink}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 shrink-0"
            >
              <Video className="h-3.5 w-3.5" />
              Tham gia
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
            <Users className="h-8 w-8 text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-700">
              Chưa có cuộc họp nào sắp diễn ra
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400 font-medium">
              Các cuộc họp được tạo trong dự án sẽ tự động tổng hợp ở đây.
            </p>
          </div>
        )}
      </div>

      {/* Footer Attendees & Action */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Thành viên:
          </span>
          <div className="flex -space-x-1.5 overflow-hidden">
            {upcomingMeeting?.participants && upcomingMeeting.participants.length > 0 ? (
              upcomingMeeting.participants.map((att, i) => {
                const initials = att.fullName
                  ? att.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                  : "U";
                const colors = [
                  "bg-blue-100 text-blue-700",
                  "bg-purple-100 text-purple-700",
                  "bg-emerald-100 text-emerald-700",
                ];

                return (
                  <div
                    key={att.id || i}
                    title={att.fullName}
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold border-2 border-white ${
                      colors[i % colors.length]
                    }`}
                  >
                    {initials}
                  </div>
                );
              })
            ) : (
              <span className="text-[11px] font-medium text-slate-400">
                {upcomingMeeting ? "Tất cả thành viên" : "Chưa có"}
              </span>
            )}
          </div>
        </div>

        <Link
          href={roomLink}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600 transition border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50 hover:bg-white shrink-0"
        >
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          Chi tiết
        </Link>
      </div>
    </div>
  );
}
