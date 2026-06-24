export type MeetingType =
  | "SPRINT_PLANNING"
  | "DAILY_SCRUM"
  | "SPRINT_REVIEW"
  | "RETROSPECTIVE"
  | "GENERAL";

export type MeetingStatus =
  | "SCHEDULED"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type MeetingParticipantRole = "HOST" | "PARTICIPANT" | "NOTE_TAKER";

export type MeetingUserSummary = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
};

export type MeetingSprintSummary = {
  id: string;
  name: string;
  status: string;
};

export type MeetingParticipant = {
  participantId: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: MeetingParticipantRole;
  attended: boolean;
};

export type Meeting = {
  id: string;
  workspaceId: string;
  projectId: string;
  sprintId: string | null;
  title: string;
  description: string | null;
  meetingType: MeetingType;
  meetingDate: string;
  startTime: string | null;
  endTime: string | null;
  status: MeetingStatus;
  createdBy: string;
  creator: MeetingUserSummary | null;
  sprint: MeetingSprintSummary | null;
  participants?: MeetingParticipant[];
  mongoTranscriptId: string | null;
  mongoSummaryId: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type MeetingTranscriptSpeaker = {
  speakerName?: string;
  userId?: string;
  text: string;
};

export type MeetingTranscript = {
  id: string;
  meetingId: string;
  workspaceId: string;
  projectId: string;
  sprintId: string | null;
  rawTranscript: string;
  speakers: MeetingTranscriptSpeaker[];
  createdBy: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MeetingQuery = {
  status?: MeetingStatus;
  meetingType?: MeetingType;
  sprintId?: string;
  fromDate?: string;
  toDate?: string;
  keyword?: string;
  page?: number;
  limit?: number;
};

export type CreateMeetingPayload = {
  sprintId?: string | null;
  title: string;
  description?: string;
  meetingType?: MeetingType;
  meetingDate: string;
  startTime?: string | null;
  endTime?: string | null;
  participantIds?: string[];
};

export type UpdateMeetingPayload = {
  sprintId?: string | null;
  title?: string;
  description?: string | null;
  meetingType?: MeetingType;
  meetingDate?: string;
  startTime?: string | null;
  endTime?: string | null;
};

export type AddMeetingParticipantsPayload = {
  participants: {
    userId: string;
    role?: MeetingParticipantRole;
  }[];
};

export type UpdateParticipantAttendancePayload = {
  attended: boolean;
};

export type SaveMeetingTranscriptPayload = {
  rawTranscript: string;
  speakers?: MeetingTranscriptSpeaker[];
};
