"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  deleteMeeting,
  getMeetings,
} from "@/features/meetings/api/meetings.api";
import { MeetingList } from "@/features/meetings/components/MeetingList";
import {
  Meeting,
  MeetingQuery,
  MeetingStatus,
  MeetingType,
} from "@/features/meetings/types/meeting.type";
import { getMyWorkspaceRole } from "@/features/members/api/members.api";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { getSprints } from "@/features/sprints/api/sprints.api";
import { Sprint } from "@/features/sprints/types/sprint.type";
import { useAuth } from "@/hooks/useAuth";

const managerRoles = ["OWNER", "SCRUM_MASTER", "PROJECT_MANAGER"];

const statusOptions: MeetingStatus[] = [
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "ARCHIVED",
];

const typeOptions: MeetingType[] = [
  "SPRINT_PLANNING",
  "DAILY_SCRUM",
  "SPRINT_REVIEW",
  "RETROSPECTIVE",
  "GENERAL",
];

const statusLabels: Record<MeetingStatus, string> = {
  SCHEDULED: "Đã lên lịch",
  IN_PROGRESS: "Đang diễn ra",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
  ARCHIVED: "Đã lưu trữ",
};

const typeLabels: Record<MeetingType, string> = {
  SPRINT_PLANNING: "Lập kế hoạch sprint",
  DAILY_SCRUM: "Họp daily",
  SPRINT_REVIEW: "Tổng kết sprint",
  RETROSPECTIVE: "Cải tiến sprint",
  GENERAL: "Tổng quan",
};

/**
 * Lay message tu loi de hien cho nguoi dung. apiRequest luon nem ApiError hoac
 * Error nen nhanh fallback chi de an toan voi loi ngoai du kien.
 */
function resolveErrorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}

export default function MeetingsPage() {
  const params = useParams<{ workspaceId: string; projectId: string }>();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [items, setItems] = useState<Meeting[]>([]);
  const [myRole, setMyRole] = useState("");
  const [query, setQuery] = useState<MeetingQuery>({ page: 1, limit: 20 });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(
    null,
  );

  const canManage = managerRoles.includes(myRole);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    // Dung allSettled thay vi all: 4 request nay doc lap nhau nen mot cai loi
    // khong duoc lam mat du lieu cua cac cai con lai. Truoc day danh sach hop
    // loi keo theo mat role, khien nut "Tao cuoc hop" bi an du du quyen.
    const [projectRes, sprintsRes, roleRes, meetingsRes] =
      await Promise.allSettled([
        getProjectDetail(params.workspaceId, params.projectId),
        getSprints(params.workspaceId, params.projectId, {
          page: 1,
          limit: 100,
        }),
        getMyWorkspaceRole(params.workspaceId),
        getMeetings(params.workspaceId, params.projectId, query),
      ]);

    if (projectRes.status === "fulfilled") {
      setProject(projectRes.value.data.project);
    }

    if (sprintsRes.status === "fulfilled") {
      setSprints(sprintsRes.value.data.items);
    }

    if (roleRes.status === "fulfilled") {
      setMyRole(roleRes.value.data.role);
    }

    if (meetingsRes.status === "fulfilled") {
      setItems(meetingsRes.value.data.items);
    } else {
      // Xoa danh sach cu de khong hien du lieu da lac hau ben canh thong bao loi.
      setItems([]);
    }

    const failureMessages = [
      meetingsRes.status === "rejected"
        ? resolveErrorMessage(
            meetingsRes.reason,
            "Tải danh sách cuộc họp thất bại.",
          )
        : null,
      projectRes.status === "rejected"
        ? resolveErrorMessage(projectRes.reason, "Tải thông tin dự án thất bại.")
        : null,
      roleRes.status === "rejected"
        ? resolveErrorMessage(roleRes.reason, "Tải quyền của bạn thất bại.")
        : null,
      sprintsRes.status === "rejected"
        ? resolveErrorMessage(sprintsRes.reason, "Tải danh sách sprint thất bại.")
        : null,
    ].filter((item): item is string => item !== null);

    setMessage(failureMessages.join(" "));
    setIsLoading(false);
  }, [params.projectId, params.workspaceId, query]);

  useEffect(() => {
    if (user && params.workspaceId && params.projectId) {
      void loadData();
    }
  }, [user, params.workspaceId, params.projectId, loadData]);

  function patchQuery(next: Partial<MeetingQuery>) {
    setQuery((current) => ({
      ...current,
      ...next,
      page: 1,
      limit: 20,
    }));
  }

  async function handleDeleteMeeting(meeting: Meeting) {
    if (!window.confirm(`Bạn có chắc muốn xóa cuộc họp "${meeting.title}"?`)) {
      return;
    }

    setDeletingMeetingId(meeting.id);
    setMessage("");

    try {
      await deleteMeeting(params.workspaceId, params.projectId, meeting.id);
      setItems((current) => current.filter((item) => item.id !== meeting.id));
      setMessage("Đã xóa cuộc họp.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Xóa cuộc họp thất bại.",
      );
    } finally {
      setDeletingMeetingId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-900 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      <div className="mx-auto max-w-6xl space-y-4 pb-12">
        <section className="rounded border border-[#dfe1e6] bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#0c66e4]">
                Cuộc họp
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-[#172b4d]">
                Cuộc họp trong dự án
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-[#6b778c]">
                Quản lý lịch họp, người tham gia và biên bản theo từng dự án
                hoặc sprint.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="h-9 rounded border border-[#dfe1e6] bg-white px-3 text-sm font-medium text-[#44546f] hover:bg-[#f1f2f4]"
                type="button"
                onClick={() => void loadData()}
              >
                Làm mới
              </button>
              {canManage ? (
                <Link
                  className="flex h-9 items-center rounded bg-[#0c66e4] px-3 text-sm font-semibold text-white hover:bg-[#0055cc]"
                  href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/create`}
                >
                  Tạo cuộc họp
                </Link>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded border border-[#dfe1e6] bg-white p-3 lg:grid-cols-[1fr_180px_180px_220px_auto]">
          <input
            className="h-9 rounded border border-[#dfe1e6] bg-white px-3 text-sm outline-none hover:bg-[#f7f8f9] focus:border-[#0c66e4]"
            placeholder="Tìm cuộc họp..."
            value={query.keyword ?? ""}
            onChange={(event) => patchQuery({ keyword: event.target.value })}
          />
          <select
            className="h-9 rounded border border-[#dfe1e6] bg-white px-3 text-sm outline-none hover:bg-[#f7f8f9] focus:border-[#0c66e4]"
            value={query.status ?? ""}
            onChange={(event) =>
              patchQuery({
                status: (event.target.value || undefined) as
                  | MeetingStatus
                  | undefined,
              })
            }
          >
            <option value="">Tất cả trạng thái</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded border border-[#dfe1e6] bg-white px-3 text-sm outline-none hover:bg-[#f7f8f9] focus:border-[#0c66e4]"
            value={query.meetingType ?? ""}
            onChange={(event) =>
              patchQuery({
                meetingType: (event.target.value || undefined) as
                  | MeetingType
                  | undefined,
              })
            }
          >
            <option value="">Tất cả loại</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {typeLabels[type]}
              </option>
            ))}
          </select>
          <select
            className="h-9 rounded border border-[#dfe1e6] bg-white px-3 text-sm outline-none hover:bg-[#f7f8f9] focus:border-[#0c66e4]"
            value={query.sprintId ?? ""}
            onChange={(event) =>
              patchQuery({ sprintId: event.target.value || undefined })
            }
          >
            <option value="">Tất cả sprint</option>
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </select>
          <button
            className="h-9 rounded bg-[#172b4d] px-3 text-sm font-semibold text-white hover:bg-[#0c1f3f]"
            type="button"
            onClick={() => setQuery({ page: 1, limit: 20 })}
          >
            Xóa lọc
          </button>
        </section>

        {message ? (
          <div className="rounded border border-[#f5cd47] bg-[#fff7d6] px-3 py-2 text-sm font-medium text-[#7f5f01]">
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex h-48 items-center justify-center rounded border border-[#dfe1e6] bg-white">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#0c66e4] border-t-transparent"></div>
          </div>
        ) : (
          <MeetingList
            canManage={canManage}
            currentUserId={user?.id}
            deletingMeetingId={deletingMeetingId}
            emptyText="Chưa có cuộc họp nào trong bộ lọc hiện tại."
            items={items}
            projectId={params.projectId}
            workspaceId={params.workspaceId}
            onDelete={(meeting) => void handleDeleteMeeting(meeting)}
          />
        )}
      </div>
    </AppShell>
  );
}
