"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getMeetingDetail } from "@/features/meetings/api/meetings.api";
import { MeetingLiveTranscriptPanel } from "@/features/meetings/components/MeetingLiveTranscriptPanel";
import { MeetingVideoTile } from "@/features/meetings/components/MeetingVideoTile";
import { useMeetingWebRtc } from "@/features/meetings/hooks/useMeetingWebRtc";
import { Meeting } from "@/features/meetings/types/meeting.type";
import { getProjectDetail } from "@/features/projects/api/projects.api";
import { Project } from "@/features/projects/types/project.type";
import { useAuth } from "@/hooks/useAuth";

function getMeetingEndTime(meeting: Meeting) {
  if (meeting.endTime) {
    return new Date(meeting.endTime).getTime();
  }

  return new Date(`${meeting.meetingDate}T23:59:59`).getTime();
}

// IN_PROGRESS van mo: nguoi bi mat mang giua buoi hop can quay lai phong.
const openStatuses: Meeting["status"][] = ["SCHEDULED", "IN_PROGRESS"];

function isMeetingClosed(meeting: Meeting) {
  const endTime = getMeetingEndTime(meeting);

  return (
    !openStatuses.includes(meeting.status) ||
    (Number.isFinite(endTime) && endTime < Date.now())
  );
}

export default function MeetingRoomPage() {
  const params = useParams<{
    workspaceId: string;
    projectId: string;
    meetingId: string;
  }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth(true);
  const [project, setProject] = useState<Project | null>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const roomClosed = meeting ? isMeetingClosed(meeting) : false;

  const {
    localStream,
    remotePeers,
    selfPeer,
    joinRequests,
    isWaitingApproval,
    isConnecting,
    isConnected,
    audioEnabled,
    videoEnabled,
    screenSharing,
    error,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    leaveMeeting,
    admitParticipant,
  } = useMeetingWebRtc({
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    meetingId: params.meetingId,
    user,
    enabled: Boolean(user && meeting && !roomClosed),
  });

  const participantCount = remotePeers.length + (selfPeer ? 1 : 0);
  const roomStatus = useMemo(() => {
    if (isConnecting) return "Đang kết nối";
    if (isWaitingApproval) return "Chờ duyệt";
    if (isConnected) return "Đang online";
    return "Chưa kết nối";
  }, [isConnecting, isConnected, isWaitingApproval]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setMessage("");

    try {
      const [projectRes, meetingRes] = await Promise.all([
        getProjectDetail(params.workspaceId, params.projectId),
        getMeetingDetail(params.workspaceId, params.projectId, params.meetingId),
      ]);

      setProject(projectRes.data.project);
      setMeeting(meetingRes.data.meeting);
      if (isMeetingClosed(meetingRes.data.meeting)) {
        setMessage(
          "Cuộc họp đã hết thời gian hoặc không còn ở trạng thái đã lên lịch nên không thể vào phòng.",
        );
      }
    } catch (loadError) {
      setMessage(
        loadError instanceof Error
          ? loadError.message
          : "Tải thông tin phòng họp thất bại.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [params.meetingId, params.projectId, params.workspaceId]);

  useEffect(() => {
    if (user) {
      void loadData();
    }
  }, [loadData, user]);

  function handleLeave() {
    leaveMeeting();
    router.push(
      `/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}`,
    );
  }

  async function handleEnableRemoteAudio() {
    const audioElements = Array.from(
      document.querySelectorAll<HTMLAudioElement>(
        'audio[data-meeting-audio="true"]',
      ),
    );

    if (!audioElements.length) {
      setMessage("Chưa có âm thanh từ người khác trong phòng họp.");
      return;
    }

    try {
      await Promise.all(
        audioElements.map((audio) => {
          audio.muted = false;
          audio.volume = 1;
          return audio.play();
        }),
      );
      setMessage("Đã bật âm thanh cuộc họp.");
    } catch {
      setMessage(
        "Trình duyệt đang chặn âm thanh tự động. Hãy bấm lại nút bật âm thanh và kiểm tra âm lượng thiết bị.",
      );
    }
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppShell
      projectId={params.projectId}
      title={project?.name}
      workspaceId={params.workspaceId}
    >
      <div className="mx-auto max-w-7xl space-y-5 pb-10">
        {roomClosed ? (
          <section className="rounded border border-[#f5cd47] bg-[#fff7d6] p-5">
            <h1 className="text-xl font-semibold text-[#172b4d]">
              Không thể vào phòng họp
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7f5f01]">
              Cuộc họp này đã quá thời gian kết thúc hoặc đã được đóng. Bạn vẫn
              có thể xem chi tiết, biên bản và tóm tắt nếu đã có dữ liệu.
            </p>
            <Link
              className="mt-4 inline-flex h-9 items-center rounded bg-[#172b4d] px-3 text-sm font-semibold text-white hover:bg-[#0c1f3f]"
              href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}`}
            >
              Quay lại chi tiết cuộc họp
            </Link>
          </section>
        ) : null}
        {!roomClosed ? (
        <section className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl shadow-zinc-950/20">
          <div className="flex flex-col gap-4 border-b border-white/10 bg-white/[0.03] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-500 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">
                  Phòng họp
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                    isConnected
                      ? "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/20"
                      : "bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/20"
                  }`}
                >
                  {roomStatus}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-zinc-200">
                  {participantCount} đang online
                </span>
              </div>
              <h1 className="truncate text-2xl font-black">
                {meeting?.title ?? "Phòng họp"}
              </h1>
              <p className="mt-1 truncate text-sm font-medium text-zinc-400">
                {project?.name ?? "Dự án"} / {params.meetingId}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-zinc-100 transition hover:bg-white/10"
                href={`/workspaces/${params.workspaceId}/projects/${params.projectId}/meetings/${params.meetingId}`}
              >
                Chi tiết
              </Link>
              <button
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white transition hover:bg-red-700"
                type="button"
                onClick={handleLeave}
              >
                Rời phòng
              </button>
            </div>
          </div>

          <div className="grid gap-5 p-5 xl:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {message || error ? (
                <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-100">
                  {message || error}
                </div>
              ) : null}

              {isWaitingApproval ? (
                <div className="rounded-2xl border border-blue-300/30 bg-blue-400/10 px-4 py-3 text-sm font-semibold text-blue-100">
                  Bạn đang ở phòng chờ. Chủ phòng hoặc quản lý dự án cần bấm
                  cho vào phòng họp.
                </div>
              ) : null}

              {isLoading ? (
                <div className="flex min-h-96 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                </div>
              ) : (
                <div
                  className={`grid gap-4 ${
                    remotePeers.length > 1
                      ? "lg:grid-cols-2"
                      : "lg:grid-cols-[1.25fr_0.75fr]"
                  }`}
                >
                  <MeetingVideoTile
                    audioEnabled={audioEnabled}
                    isLocal
                    label={user?.fullName ?? "Bạn"}
                    muted
                    screenSharing={screenSharing}
                    stream={localStream}
                    videoEnabled={videoEnabled}
                  />

                  {remotePeers.length ? (
                    remotePeers.map((peer) => (
                      <MeetingVideoTile
                        key={peer.socketId}
                        audioEnabled={peer.audioEnabled}
                        label={peer.fullName || peer.email || "Người tham gia"}
                        screenSharing={peer.screenSharing}
                        stream={peer.stream}
                        videoEnabled={peer.videoEnabled}
                      />
                    ))
                  ) : (
                    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center">
                      <div>
                        <p className="text-sm font-black text-white">
                          Đang chờ người khác vào phòng
                        </p>
                        <p className="mt-2 max-w-sm text-xs leading-relaxed text-zinc-400">
                          Mở cùng URL này trên trình duyệt khác hoặc gửi link
                          phòng họp cho thành viên.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <aside className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-white">
                  Người tham gia
                </h2>
                <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black text-zinc-200">
                  {participantCount}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <ParticipantRow
                  audioEnabled={audioEnabled}
                  fullName={user?.fullName ?? "Bạn"}
                  isLocal
                  videoEnabled={videoEnabled}
                />
                {remotePeers.map((peer) => (
                  <ParticipantRow
                    key={peer.socketId}
                    audioEnabled={peer.audioEnabled}
                    fullName={peer.fullName || peer.email || "Người tham gia"}
                    screenSharing={peer.screenSharing}
                    videoEnabled={peer.videoEnabled}
                  />
                ))}
              </div>

              {joinRequests.length ? (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-white">
                      Phòng chờ
                    </h3>
                    <span className="rounded-lg bg-amber-400/15 px-2 py-1 text-[10px] font-black text-amber-100 ring-1 ring-amber-300/20">
                      {joinRequests.length}
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {joinRequests.map((request) => (
                      <div
                        key={request.socketId}
                        className="rounded-xl bg-white/[0.06] p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-sm font-black text-white">
                            {(request.fullName || request.email)
                              .trim()
                              .charAt(0)
                              .toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-black text-white">
                              {request.fullName || "Người tham gia"}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] font-semibold text-zinc-400">
                              {request.email}
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-black text-white transition hover:bg-emerald-600"
                            type="button"
                            onClick={() =>
                              admitParticipant(request.socketId, true)
                            }
                          >
                            Cho vào
                          </button>
                          <button
                            className="rounded-lg bg-white/10 px-3 py-2 text-[10px] font-black text-zinc-100 transition hover:bg-white/15"
                            type="button"
                            onClick={() =>
                              admitParticipant(request.socketId, false)
                            }
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  className={`rounded-xl px-3 py-3 text-xs font-black transition ${
                    audioEnabled
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : "bg-red-600 text-white hover:bg-red-700"
                  }`}
                  type="button"
                  onClick={() => void toggleAudio()}
                >
                  {audioEnabled ? "Tắt mic" : "Bật mic"}
                </button>
                <button
                  className={`rounded-xl px-3 py-3 text-xs font-black transition ${
                    videoEnabled
                      ? "bg-white text-zinc-950 hover:bg-zinc-200"
                      : "bg-zinc-700 text-white hover:bg-zinc-600"
                  }`}
                  type="button"
                  onClick={() => void toggleVideo()}
                >
                  {videoEnabled ? "Tắt camera" : "Bật camera"}
                </button>
                <button
                  className={`col-span-2 rounded-xl px-3 py-3 text-xs font-black transition ${
                    screenSharing
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                  type="button"
                  onClick={() =>
                    screenSharing
                      ? void stopScreenShare()
                      : void startScreenShare()
                  }
                >
                  {screenSharing ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
                </button>
                <button
                  className="col-span-2 rounded-xl bg-emerald-600 px-3 py-3 text-xs font-black text-white transition hover:bg-emerald-700"
                  type="button"
                  onClick={() => void handleEnableRemoteAudio()}
                >
                  Bật âm thanh cuộc họp
                </button>
                <button
                  className="col-span-2 rounded-xl bg-red-600 px-3 py-3 text-xs font-black text-white transition hover:bg-red-700"
                  type="button"
                  onClick={handleLeave}
                >
                  Rời phòng họp
                </button>
              </div>

              <div className="mt-5">
                <MeetingLiveTranscriptPanel
                  disabled={!isConnected || isWaitingApproval}
                  meetingId={params.meetingId}
                  projectId={params.projectId}
                  workspaceId={params.workspaceId}
                />
              </div>
            </aside>
          </div>
        </section>
        ) : null}
      </div>
    </AppShell>
  );
}

function ParticipantRow({
  fullName,
  isLocal,
  audioEnabled,
  videoEnabled,
  screenSharing,
}: {
  fullName: string;
  isLocal?: boolean;
  audioEnabled: boolean;
  videoEnabled: boolean;
  screenSharing?: boolean;
}) {
  const initial = fullName.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.06] p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-sm font-black text-white">
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-black text-white">
          {fullName}
          {isLocal ? " (Bạn)" : ""}
        </p>
        <p className="mt-0.5 truncate text-[10px] font-semibold text-zinc-400">
          {screenSharing ? "Đang chia sẻ màn hình" : "Trong phòng"}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <span className="rounded-md bg-white/10 px-1.5 py-1 text-[9px] font-black text-zinc-200">
          {audioEnabled ? "MIC" : "TẮT MIC"}
        </span>
        <span className="rounded-md bg-white/10 px-1.5 py-1 text-[9px] font-black text-zinc-200">
          {videoEnabled ? "CAM" : "TẮT CAM"}
        </span>
      </div>
    </div>
  );
}
