"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendLiveTranscriptSegment,
  getMeetingTranscript,
  uploadMeetingAudioChunk,
} from "../api/meetings.api";
import { MeetingTranscriptSegment } from "../types/meeting.type";

const AUDIO_CHUNK_DURATION_MS = 30_000;

type MeetingLiveTranscriptPanelProps = {
  workspaceId: string;
  projectId: string;
  meetingId: string;
  disabled?: boolean;
  localStream?: MediaStream | null;
};

function getSupportedAudioMimeType() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? "";
}

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function MeetingLiveTranscriptPanel({
  workspaceId,
  projectId,
  meetingId,
  disabled,
  localStream,
}: MeetingLiveTranscriptPanelProps) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldRecordRef = useRef(false);
  const mountedRef = useRef(true);
  const sessionIdRef = useRef("");
  const chunkSequenceRef = useRef(0);
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const [segments, setSegments] = useState<MeetingTranscriptSegment[]>([]);
  const [manualText, setManualText] = useState("");
  const [message, setMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingUploads, setPendingUploads] = useState(0);

  const mediaRecorderSupported =
    typeof window !== "undefined" && typeof MediaRecorder !== "undefined";

  const loadSegments = useCallback(async () => {
    try {
      const response = await getMeetingTranscript(workspaceId, projectId, meetingId);
      setSegments(response.data.transcript.liveSegments ?? []);
    } catch {
      setSegments([]);
    }
  }, [meetingId, projectId, workspaceId]);

  const queueAudioUpload = useCallback(
    (audio: Blob, chunkId: string, startedAt: string, endedAt: string) => {
      if (!audio.size) return;

      if (mountedRef.current) {
        setPendingUploads((current) => current + 1);
      }
      uploadQueueRef.current = uploadQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const response = await uploadMeetingAudioChunk(
              workspaceId,
              projectId,
              meetingId,
              { audio, chunkId, startedAt, endedAt },
            );

            if (mountedRef.current) {
              setSegments(response.data.transcript.liveSegments ?? []);
              setMessage("");
            }
          } catch (error) {
            if (mountedRef.current) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Không thể chuyển đoạn ghi âm thành nội dung.",
              );
            }
          } finally {
            if (mountedRef.current) {
              setPendingUploads((current) => Math.max(0, current - 1));
            }
          }
        });
    },
    [meetingId, projectId, workspaceId],
  );

  function stopCurrentChunk() {
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }

    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }

  function recordNextChunk() {
    const audioTracks = localStream?.getAudioTracks().filter((track) => track.readyState === "live") ?? [];

    if (!shouldRecordRef.current || !audioTracks.length) {
      shouldRecordRef.current = false;
      setIsRecording(false);
      setMessage("Không tìm thấy micro đang hoạt động. Hãy bật micro rồi thử lại.");
      return;
    }

    const mimeType = getSupportedAudioMimeType();
    const recorder = new MediaRecorder(
      new MediaStream(audioTracks),
      mimeType ? { mimeType } : undefined,
    );
    const parts: BlobPart[] = [];
    const startedAt = new Date().toISOString();

    recorder.ondataavailable = (event) => {
      if (event.data.size) parts.push(event.data);
    };

    recorder.onerror = () => {
      shouldRecordRef.current = false;
      setIsRecording(false);
      setMessage("Không thể ghi âm từ micro. Hãy kiểm tra quyền truy cập micro.");
    };

    recorder.onstop = () => {
      if (recorderRef.current === recorder) recorderRef.current = null;

      const endedAt = new Date().toISOString();
      const audio = new Blob(parts, { type: recorder.mimeType || "audio/webm" });
      const chunkId = `${sessionIdRef.current}-${chunkSequenceRef.current}`;
      chunkSequenceRef.current += 1;
      queueAudioUpload(audio, chunkId, startedAt, endedAt);

      if (shouldRecordRef.current) recordNextChunk();
    };

    recorderRef.current = recorder;
    recorder.start();
    chunkTimerRef.current = setTimeout(stopCurrentChunk, AUDIO_CHUNK_DURATION_MS);
  }

  function startRecording() {
    if (disabled) return;

    if (!mediaRecorderSupported) {
      setMessage("Trình duyệt này chưa hỗ trợ ghi âm cuộc họp.");
      return;
    }

    const audioTrack = localStream?.getAudioTracks().find((track) => track.readyState === "live");
    if (!audioTrack || !audioTrack.enabled) {
      setMessage("Hãy bật micro trước khi bắt đầu ghi âm.");
      return;
    }

    sessionIdRef.current = createSessionId();
    chunkSequenceRef.current = 0;
    shouldRecordRef.current = true;
    setIsRecording(true);
    setMessage("");
    recordNextChunk();
  }

  function stopRecording() {
    shouldRecordRef.current = false;
    setIsRecording(false);
    stopCurrentChunk();
  }

  useEffect(() => {
    mountedRef.current = true;
    void loadSegments();

    return () => {
      mountedRef.current = false;
      shouldRecordRef.current = false;
      if (chunkTimerRef.current) clearTimeout(chunkTimerRef.current);
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    };
  }, [loadSegments]);

  useEffect(() => {
    if (!disabled || !shouldRecordRef.current) return;

    shouldRecordRef.current = false;
    setIsRecording(false);
    if (chunkTimerRef.current) {
      clearTimeout(chunkTimerRef.current);
      chunkTimerRef.current = null;
    }
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, [disabled]);

  async function handleManualSubmit() {
    const cleanText = manualText.trim();
    if (!cleanText) return;

    setIsSaving(true);
    setMessage("");
    try {
      const now = new Date().toISOString();
      const response = await appendLiveTranscriptSegment(
        workspaceId,
        projectId,
        meetingId,
        { text: cleanText, startedAt: now, endedAt: now, source: "manual" },
      );
      setSegments(response.data.transcript.liveSegments ?? []);
      setManualText("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Không thể lưu nội dung cuộc họp.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-white">Ghi nội dung cuộc họp</h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-400">
            Mỗi người ghi âm từ micro của mình để hệ thống nhận đúng người nói.
          </p>
        </div>
        <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-black text-zinc-200">
          {segments.length}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className={`rounded px-3 py-3 text-xs font-black transition ${
            isRecording
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-white text-zinc-950 hover:bg-zinc-200"
          }`}
          disabled={disabled}
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
        >
          {isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
        </button>
        <button
          className="rounded bg-white/10 px-3 py-3 text-xs font-black text-white transition hover:bg-white/15"
          disabled={disabled}
          type="button"
          onClick={() => void loadSegments()}
        >
          Tải lại
        </button>
      </div>

      {isRecording || pendingUploads ? (
        <p className="mt-3 rounded border border-emerald-300/30 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100">
          {isRecording ? "Đang ghi và tự động gửi mỗi 30 giây." : "Đã dừng ghi âm."}
          {pendingUploads ? ` Còn ${pendingUploads} đoạn đang xử lý.` : ""}
        </p>
      ) : null}

      {message ? (
        <p className="mt-3 rounded border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100">
          {message}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        <textarea
          className="min-h-20 w-full resize-none rounded border border-white/10 bg-zinc-950 px-3 py-2 text-xs font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-400"
          placeholder="Nhập nhanh nội dung vừa trao đổi..."
          value={manualText}
          onChange={(event) => setManualText(event.target.value)}
        />
        <button
          className="w-full rounded bg-blue-600 px-3 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-700"
          disabled={disabled || isSaving || !manualText.trim()}
          type="button"
          onClick={() => void handleManualSubmit()}
        >
          {isSaving ? "Đang lưu..." : "Gửi nội dung"}
        </button>
      </div>

      <div className="mt-4 max-h-56 space-y-2 overflow-auto pr-1">
        {segments.slice(-8).map((segment, index) => (
          <div
            key={segment.chunkId ?? `${segment.startedAt}-${index}`}
            className="rounded bg-white/[0.06] px-3 py-2"
          >
            <p className="truncate text-[11px] font-black text-white">
              {segment.speakerName || "Người nói"}
            </p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-300">
              {segment.text}
            </p>
          </div>
        ))}
        {!segments.length ? (
          <p className="rounded border border-dashed border-white/10 px-3 py-4 text-center text-xs font-semibold text-zinc-500">
            Chưa có nội dung nào.
          </p>
        ) : null}
      </div>
    </section>
  );
}
