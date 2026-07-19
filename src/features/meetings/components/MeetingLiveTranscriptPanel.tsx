"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  appendLiveTranscriptSegment,
  getMeetingTranscript,
} from "../api/meetings.api";
import { MeetingTranscriptSegment } from "../types/meeting.type";

type MeetingLiveTranscriptPanelProps = {
  workspaceId: string;
  projectId: string;
  meetingId: string;
  disabled?: boolean;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((event: {
        resultIndex: number;
        results: {
          length: number;
          [index: number]: {
            isFinal: boolean;
            [index: number]: { transcript: string; confidence: number };
          };
        };
      }) => void)
    | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

export function MeetingLiveTranscriptPanel({
  workspaceId,
  projectId,
  meetingId,
  disabled,
}: MeetingLiveTranscriptPanelProps) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const shouldKeepListeningRef = useRef(false);
  const segmentStartedAtRef = useRef<string | null>(null);
  const [segments, setSegments] = useState<MeetingTranscriptSegment[]>([]);
  const [manualText, setManualText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [message, setMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const recognitionSupported = useMemo(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition),
    [],
  );

  const loadSegments = useCallback(async () => {
    try {
      const response = await getMeetingTranscript(workspaceId, projectId, meetingId);
      setSegments(response.data.transcript.liveSegments ?? []);
    } catch {
      setSegments([]);
    }
  }, [meetingId, projectId, workspaceId]);

  useEffect(() => {
    void loadSegments();

    return () => {
      shouldKeepListeningRef.current = false;
      recognitionRef.current?.abort();
    };
  }, [loadSegments]);

  const saveSegment = useCallback(
    async (text: string, confidence?: number, startedAt?: string) => {
      const cleanText = text.trim();

      if (!cleanText) {
        return;
      }

      setIsSaving(true);
      setMessage("");

      try {
        const response = await appendLiveTranscriptSegment(
          workspaceId,
          projectId,
          meetingId,
          {
            text: cleanText,
            startedAt: startedAt ?? new Date().toISOString(),
            endedAt: new Date().toISOString(),
            confidence,
            source: recognitionSupported ? "browser-speech" : "manual",
          },
        );
        setSegments(response.data.transcript.liveSegments ?? []);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Không lưu được nội dung cuộc họp.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [meetingId, projectId, recognitionSupported, workspaceId],
  );

  function startListening() {
    if (!recognitionSupported || disabled) {
      setMessage(
        "Trình duyệt này chưa hỗ trợ nhận giọng nói. Bạn có thể nhập nội dung thủ công bên dưới.",
      );
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "vi-VN";
    shouldKeepListeningRef.current = true;
    segmentStartedAtRef.current = new Date().toISOString();

    recognition.onresult = (event) => {
      let finalText = "";
      let nextInterimText = "";
      let confidence: number | undefined;

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const firstAlternative = result[0];
        const transcript = firstAlternative?.transcript ?? "";

        if (result.isFinal) {
          finalText += transcript;
          confidence = firstAlternative?.confidence;
        } else {
          nextInterimText += transcript;
        }
      }

      setInterimText(nextInterimText.trim());

      if (finalText.trim()) {
        const startedAt =
          segmentStartedAtRef.current ?? new Date().toISOString();
        segmentStartedAtRef.current = new Date().toISOString();
        void saveSegment(finalText, confidence, startedAt);
      }
    };

    recognition.onerror = (event) => {
      setMessage(
        event.error
          ? `Nhận giọng nói bị lỗi: ${event.error}`
          : "Nhận giọng nói bị lỗi.",
      );
    };

    recognition.onend = () => {
      if (shouldKeepListeningRef.current) {
        recognition.start();
        return;
      }

      setIsListening(false);
      setInterimText("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setMessage("");
  }

  function stopListening() {
    shouldKeepListeningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
    setInterimText("");
  }

  async function handleManualSubmit() {
    await saveSegment(manualText, undefined, new Date().toISOString());
    setManualText("");
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-white">Ghi nội dung cuộc họp</h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-400">
            Mỗi người ghi phần mình nói để tóm tắt cuối buổi rõ ràng hơn.
          </p>
        </div>
        <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-black text-zinc-200">
          {segments.length}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          className={`rounded-xl px-3 py-3 text-xs font-black transition ${
            isListening
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-white text-zinc-950 hover:bg-zinc-200"
          }`}
          disabled={disabled}
          type="button"
          onClick={isListening ? stopListening : startListening}
        >
          {isListening ? "Dừng ghi" : "Ghi lời nói"}
        </button>
        <button
          className="rounded-xl bg-white/10 px-3 py-3 text-xs font-black text-white transition hover:bg-white/15"
          disabled={disabled}
          type="button"
          onClick={() => void loadSegments()}
        >
          Tải lại
        </button>
      </div>

      {!recognitionSupported ? (
        <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100">
          Trình duyệt này chưa hỗ trợ nhận giọng nói. Bạn vẫn có thể nhập nội
          dung thủ công.
        </p>
      ) : null}

      {interimText ? (
        <p className="mt-3 rounded-xl border border-blue-300/30 bg-blue-400/10 px-3 py-2 text-xs font-semibold text-blue-100">
          Đang nghe: {interimText}
        </p>
      ) : null}

      {message ? (
        <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100">
          {message}
        </p>
      ) : null}

      <div className="mt-4 space-y-2">
        <textarea
          className="min-h-20 w-full resize-none rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs font-semibold text-white outline-none transition placeholder:text-zinc-500 focus:border-blue-400"
          placeholder="Nhập nhanh nội dung vừa trao đổi..."
          value={manualText}
          onChange={(event) => setManualText(event.target.value)}
        />
        <button
          className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-700"
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
            key={`${segment.startedAt}-${index}`}
            className="rounded-xl bg-white/[0.06] px-3 py-2"
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
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-xs font-semibold text-zinc-500">
            Chưa có nội dung nào.
          </p>
        ) : null}
      </div>
    </section>
  );
}
