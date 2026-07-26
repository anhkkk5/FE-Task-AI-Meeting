import { apiRequest } from "@/lib/api/client";
import {
  AddMeetingParticipantsPayload,
  AppendLiveTranscriptSegmentPayload,
  CreateMeetingPayload,
  Meeting,
  MeetingParticipant,
  MeetingQuery,
  MeetingTranscript,
  SaveMeetingTranscriptPayload,
  UpdateMeetingPayload,
  UpdateParticipantAttendancePayload,
  UploadMeetingAudioChunkPayload,
} from "../types/meeting.type";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

function meetingBasePath(workspaceId: string, projectId: string) {
  return `/workspaces/${workspaceId}/projects/${projectId}/meetings`;
}

function buildMeetingSearch(query: MeetingQuery) {
  const params = new URLSearchParams();

  if (query.status) params.set("status", query.status);
  if (query.meetingType) params.set("meetingType", query.meetingType);
  if (query.sprintId) params.set("sprintId", query.sprintId);
  if (query.fromDate) params.set("fromDate", query.fromDate);
  if (query.toDate) params.set("toDate", query.toDate);
  if (query.keyword) params.set("keyword", query.keyword);
  if (query.page) params.set("page", String(query.page));
  if (query.limit) params.set("limit", String(query.limit));

  const search = params.toString();
  return search ? `?${search}` : "";
}

export function createMeeting(
  workspaceId: string,
  projectId: string,
  payload: CreateMeetingPayload,
) {
  return apiRequest<ApiResponse<{ meeting: Meeting }>>(
    meetingBasePath(workspaceId, projectId),
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getMeetings(
  workspaceId: string,
  projectId: string,
  query: MeetingQuery = {},
) {
  return apiRequest<
    ApiResponse<{
      items: Meeting[];
      meta: { total: number; page: number; limit: number };
    }>
  >(`${meetingBasePath(workspaceId, projectId)}${buildMeetingSearch(query)}`);
}

export function getMeetingDetail(
  workspaceId: string,
  projectId: string,
  meetingId: string,
) {
  return apiRequest<ApiResponse<{ meeting: Meeting }>>(
    `${meetingBasePath(workspaceId, projectId)}/${meetingId}`,
  );
}

export function updateMeeting(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  payload: UpdateMeetingPayload,
) {
  return apiRequest<ApiResponse<{ meeting: Meeting }>>(
    `${meetingBasePath(workspaceId, projectId)}/${meetingId}`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function cancelMeeting(
  workspaceId: string,
  projectId: string,
  meetingId: string,
) {
  return apiRequest<ApiResponse<null>>(
    `${meetingBasePath(workspaceId, projectId)}/${meetingId}/cancel`,
    {
      method: "PATCH",
    },
  );
}

export function completeMeeting(
  workspaceId: string,
  projectId: string,
  meetingId: string,
) {
  return apiRequest<ApiResponse<null>>(
    `${meetingBasePath(workspaceId, projectId)}/${meetingId}/complete`,
    {
      method: "PATCH",
    },
  );
}

export function deleteMeeting(
  workspaceId: string,
  projectId: string,
  meetingId: string,
) {
  return apiRequest<ApiResponse<null>>(
    `${meetingBasePath(workspaceId, projectId)}/${meetingId}`,
    {
      method: "DELETE",
    },
  );
}

export function addMeetingParticipants(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  payload: AddMeetingParticipantsPayload,
) {
  return apiRequest<ApiResponse<{ items: MeetingParticipant[] }>>(
    `${meetingBasePath(workspaceId, projectId)}/${meetingId}/participants`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getMeetingParticipants(
  workspaceId: string,
  projectId: string,
  meetingId: string,
) {
  return apiRequest<ApiResponse<{ items: MeetingParticipant[] }>>(
    `${meetingBasePath(workspaceId, projectId)}/${meetingId}/participants`,
  );
}

export function updateParticipantAttendance(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  participantId: string,
  payload: UpdateParticipantAttendancePayload,
) {
  return apiRequest<ApiResponse<{ participant: MeetingParticipant }>>(
    `${meetingBasePath(
      workspaceId,
      projectId,
    )}/${meetingId}/participants/${participantId}/attendance`,
    {
      method: "PATCH",
      body: payload,
    },
  );
}

export function saveMeetingTranscript(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  payload: SaveMeetingTranscriptPayload,
) {
  return apiRequest<ApiResponse<{ transcript: MeetingTranscript }>>(
    `${meetingBasePath(workspaceId, projectId)}/${meetingId}/transcript`,
    {
      method: "POST",
      body: payload,
    },
  );
}

export function getMeetingTranscript(
  workspaceId: string,
  projectId: string,
  meetingId: string,
) {
  return apiRequest<ApiResponse<{ transcript: MeetingTranscript }>>(
    `${meetingBasePath(workspaceId, projectId)}/${meetingId}/transcript`,
  );
}

export function appendLiveTranscriptSegment(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  payload: AppendLiveTranscriptSegmentPayload,
) {
  return apiRequest<
    ApiResponse<{
      segment: MeetingTranscript["liveSegments"] extends Array<infer T>
        ? T
        : never;
      transcript: MeetingTranscript;
    }>
  >(`${meetingBasePath(workspaceId, projectId)}/${meetingId}/transcript/live-segments`, {
    method: "POST",
    body: payload,
  });
}

/**
 * Whisper suy ra codec mot phan tu phan mo rong tep, nen phai dat ten dung
 * dinh dang thuc te. Hook thu am gui WAV 16kHz mono.
 */
function getAudioExtension(mimeType: string) {
  const type = mimeType.split(";")[0].trim().toLowerCase();

  if (type === "audio/wav" || type === "audio/x-wav") return "wav";
  if (type === "audio/mp4" || type === "audio/x-m4a") return "m4a";
  if (type === "audio/mpeg") return "mp3";
  if (type === "audio/ogg") return "ogg";

  return "webm";
}

export function uploadMeetingAudioChunk(
  workspaceId: string,
  projectId: string,
  meetingId: string,
  payload: UploadMeetingAudioChunkPayload,
) {
  const formData = new FormData();
  formData.append(
    "audio",
    payload.audio,
    `meeting-chunk.${getAudioExtension(payload.audio.type)}`,
  );
  formData.append("chunkId", payload.chunkId);
  formData.append("startedAt", payload.startedAt);
  formData.append("endedAt", payload.endedAt);

  return apiRequest<
    ApiResponse<{
      segment: MeetingTranscript["liveSegments"] extends Array<infer T>
        ? T
        : never;
      transcript: MeetingTranscript;
    }>
  >(`${meetingBasePath(workspaceId, projectId)}/${meetingId}/transcript/audio-chunks`, {
    method: "POST",
    body: formData,
    timeoutMs: 60000,
  });
}
