"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  appendLiveTranscriptSegment,
  getMeetingTranscript,
} from "../api/meetings.api";
import { useLiveSpeechPreview } from "../hooks/useLiveSpeechPreview";
import { MeetingTranscriptSegment } from "../types/meeting.type";

type MeetingLiveTranscriptPanelProps = {
  workspaceId: string;
  projectId: string;
  meetingId: string;
  disabled?: boolean;
};

/**
 * Bat log bang cach chay trong Console:
 *   localStorage.setItem("debugVad", "1")
 * Log cho biet moi cau da chot co duoc luu thanh cong hay khong.
 */
function isTranscriptDebugEnabled() {
  if (typeof window === "undefined") return false;

  try {
    return window.localStorage.getItem("debugVad") === "1";
  } catch {
    return false;
  }
}

/**
 * Ghi noi dung cuoc hop tu dong:
 * - Tu lang nghe ngay khi vao phong, khong can bam nut.
 * - Chu hien ngay theo tung tu trong luc noi.
 * - Moi khi trinh duyet chot xong mot cau thi luu ngay cau do vao bien ban.
 *
 * Truoc day ban ghi chinh thuc di qua Whisper: client tu cat doan am thanh roi
 * gui len server. Cach do bi bo vi hai ly do da xay ra tren thuc te - buoc phat
 * hien tieng noi o client co the chan sach moi doan khien bien ban trong rong,
 * va Whisper tu "doan" ra cau quang cao YouTube khi dau vao gan nhu im lang.
 */
export function MeetingLiveTranscriptPanel({
  workspaceId,
  projectId,
  meetingId,
  disabled,
}: MeetingLiveTranscriptPanelProps) {
  const mountedRef = useRef(true);
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const listRef = useRef<HTMLDivElement | null>(null);

  const [segments, setSegments] = useState<MeetingTranscriptSegment[]>([]);
  const [manualText, setManualText] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingSaves, setPendingSaves] = useState(0);

  const loadSegments = useCallback(async () => {
    try {
      const response = await getMeetingTranscript(
        workspaceId,
        projectId,
        meetingId,
      );
      setSegments(response.data.transcript.liveSegments ?? []);
    } catch {
      setSegments([]);
    }
  }, [meetingId, projectId, workspaceId]);

  /**
   * Luu ngay mot cau vua duoc trinh duyet chot.
   *
   * Dung hang doi tuan tu de cac cau duoc ghi dung thu tu nguoi noi, vi moi
   * lan luu deu tra ve toan bo danh sach segment va lan tra ve sau se ghi de
   * len state cua lan truoc.
   */
  const handleFinalText = useCallback(
    (text: string) => {
      const cleanText = text.trim();

      if (!cleanText) return;

      const spokenAt = new Date().toISOString();

      if (mountedRef.current) {
        setPendingSaves((current) => current + 1);
      }

      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const response = await appendLiveTranscriptSegment(
              workspaceId,
              projectId,
              meetingId,
              {
                text: cleanText,
                startedAt: spokenAt,
                endedAt: new Date().toISOString(),
                source: "browser-speech",
              },
            );

            if (isTranscriptDebugEnabled()) {
              console.info(`[transcript] da luu: "${cleanText}"`);
            }

            if (mountedRef.current) {
              setSegments(response.data.transcript.liveSegments ?? []);
              setMessage("");
            }
          } catch (error) {
            if (isTranscriptDebugEnabled()) {
              console.error(`[transcript] luu that bai: "${cleanText}"`, error);
            }

            if (mountedRef.current) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "Không thể lưu nội dung vừa nói.",
              );
            }
          } finally {
            if (mountedRef.current) {
              setPendingSaves((current) => Math.max(0, current - 1));
            }
          }
        });
    },
    [meetingId, projectId, workspaceId],
  );

  // Vua hien chu tuc thi, vua tra ve cau da chot de luu vao bien ban.
  const { interimText, isListening, isSupported } = useLiveSpeechPreview({
    enabled: !disabled,
    onFinalText: handleFinalText,
  });
  const hasLivePreview = Boolean(pendingSaves || interimText);
  // Bo doan khong co noi dung: truoc day chung hien thanh mot dong chi co ten
  // nguoi noi ma khong co chu nao.
  const visibleSegments = segments.filter((segment) => segment.text?.trim());

  useEffect(() => {
    mountedRef.current = true;
    void loadSegments();

    return () => {
      mountedRef.current = false;
    };
  }, [loadSegments]);

  // Luon cuon xuong luot noi moi nhat.
  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [visibleSegments.length, hasLivePreview, interimText]);

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
        error instanceof Error
          ? error.message
          : "Không thể lưu nội dung cuộc họp.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  const statusLabel = !isSupported
    ? "Trình duyệt không hỗ trợ nhận diện giọng nói"
    : !isListening
      ? "Đang chờ micro"
      : interimText
        ? "Đang nghe bạn nói..."
        : "Tự động ghi khi có người nói";
  // Chrome va Edge co san Web Speech API; Firefox thi khong nen phai noi ro de
  // nguoi dung biet ma go tay thay vi tuong he thong bi loi.
  const visibleMessage =
    message ||
    (isSupported
      ? ""
      : "Trình duyệt này không nhận diện được giọng nói. Hãy dùng Chrome hoặc Edge, hoặc nhập nội dung bằng tay.");

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-white">
            Ghi nội dung cuộc họp
          </h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-400">
            AI tự động nghe và ghi lại theo từng câu nói từ micro của bạn.
          </p>
        </div>
        <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-black text-zinc-200">
          {segments.length}
        </span>
      </div>

      <div
        className={`mt-4 flex items-center justify-between gap-3 rounded border px-3 py-2.5 transition ${
          isListening
            ? "border-emerald-300/30 bg-emerald-400/10"
            : "border-white/10 bg-white/[0.03]"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`h-2.5 w-2.5 rounded-full ${
              interimText
                ? "animate-pulse bg-emerald-400"
                : isListening
                  ? "bg-emerald-400/50"
                  : "bg-zinc-500"
            }`}
          />
          <p
            aria-live="polite"
            className={`text-xs font-black ${
              isListening ? "text-emerald-100" : "text-zinc-400"
            }`}
          >
            {statusLabel}
          </p>
        </div>
        <button
          className="rounded bg-white/10 px-3 py-1.5 text-[11px] font-black text-white transition hover:bg-white/15"
          id="meeting-transcript-reload"
          type="button"
          onClick={() => void loadSegments()}
        >
          Tải lại
        </button>
      </div>

      {pendingSaves ? (
        <p className="mt-2 text-[11px] font-bold text-zinc-400">
          Đang lưu {pendingSaves} câu vừa nói...
        </p>
      ) : null}

      {visibleMessage ? (
        <p className="mt-3 rounded border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100">
          {visibleMessage}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        <label className="sr-only" htmlFor="meeting-transcript-manual-input">
          Nhập nhanh nội dung vừa trao đổi
        </label>
        <textarea
          className="min-h-20 w-full resize-none rounded border border-white/10 bg-zinc-950 px-3 py-2 text-xs font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-400"
          id="meeting-transcript-manual-input"
          placeholder="Nhập nhanh nội dung vừa trao đổi..."
          value={manualText}
          onChange={(event) => setManualText(event.target.value)}
        />
        <button
          className="w-full rounded bg-blue-600 px-3 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-700"
          disabled={disabled || isSaving || !manualText.trim()}
          id="meeting-transcript-manual-submit"
          type="button"
          onClick={() => void handleManualSubmit()}
        >
          {isSaving ? "Đang lưu..." : "Gửi nội dung"}
        </button>
      </div>

      <div
        ref={listRef}
        className="mt-4 max-h-56 space-y-2 overflow-auto pr-1"
        id="meeting-transcript-segments"
      >
        {visibleSegments.slice(-8).map((segment, index) => (
          <div
            key={segment.chunkId ?? `${segment.startedAt}-${index}`}
            className="rounded bg-white/[0.06] px-3 py-2"
          >
            <p className="truncate text-[11px] font-black text-white">
              {segment.speakerName || "Thành viên"}
            </p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-300">
              {segment.text}
            </p>
          </div>
        ))}

        {/* Chu hien ngay theo tung tu trong luc noi. Khi trinh duyet chot cau,
            cau do duoc luu va chuyen xuong danh sach ben tren. */}
        {hasLivePreview ? (
          <div className="rounded border border-emerald-300/20 bg-emerald-400/[0.07] px-3 py-2">
            <p className="truncate text-[11px] font-black text-emerald-100">
              Bạn
            </p>
            <p
              aria-live="polite"
              className="mt-1 text-xs font-medium leading-relaxed text-emerald-200/90"
            >
              {interimText ? (
                interimText
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-200/70">
                  Đang lưu
                  <span aria-hidden="true" className="inline-flex gap-0.5">
                    <span className="animate-pulse">.</span>
                    <span className="animate-pulse [animation-delay:150ms]">
                      .
                    </span>
                    <span className="animate-pulse [animation-delay:300ms]">
                      .
                    </span>
                  </span>
                </span>
              )}
            </p>
          </div>
        ) : null}

        {!visibleSegments.length && !hasLivePreview ? (
          <p className="rounded border border-dashed border-white/10 px-3 py-4 text-center text-xs font-semibold text-zinc-500">
            Chưa có nội dung nào.
          </p>
        ) : null}
      </div>
    </section>
  );
}
