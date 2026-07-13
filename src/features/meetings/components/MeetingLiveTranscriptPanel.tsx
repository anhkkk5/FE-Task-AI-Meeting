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
            : "Khong luu duoc transcript live.",
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
        "Trinh duyet nay chua ho tro nhan giong noi. Ban co the nhap transcript thu cong ben duoi.",
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
          ? `Nhan giong noi bi loi: ${event.error}`
          : "Nhan giong noi bi loi.",
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
          <h2 className="text-sm font-black text-white">Transcript live</h2>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-zinc-400">
            Moi nguoi gui loi noi cua minh rieng, AI se biet ai noi gi.
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
          {isListening ? "Dung ghi" : "Ghi loi noi"}
        </button>
        <button
          className="rounded-xl bg-white/10 px-3 py-3 text-xs font-black text-white transition hover:bg-white/15"
          disabled={disabled}
          type="button"
          onClick={() => void loadSegments()}
        >
          Tai lai
        </button>
      </div>

      {!recognitionSupported ? (
        <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-100">
          Trinh duyet nay chua ho tro SpeechRecognition. Test tren Chrome/Edge
          hoac nhap tay transcript.
        </p>
      ) : null}

      {interimText ? (
        <p className="mt-3 rounded-xl border border-blue-300/30 bg-blue-400/10 px-3 py-2 text-xs font-semibold text-blue-100">
          Dang nghe: {interimText}
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
          placeholder="Nhap nhanh mot cau de test transcript..."
          value={manualText}
          onChange={(event) => setManualText(event.target.value)}
        />
        <button
          className="w-full rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-zinc-700"
          disabled={disabled || isSaving || !manualText.trim()}
          type="button"
          onClick={() => void handleManualSubmit()}
        >
          {isSaving ? "Dang luu..." : "Gui transcript"}
        </button>
      </div>

      <div className="mt-4 max-h-56 space-y-2 overflow-auto pr-1">
        {segments.slice(-8).map((segment, index) => (
          <div
            key={`${segment.startedAt}-${index}`}
            className="rounded-xl bg-white/[0.06] px-3 py-2"
          >
            <p className="truncate text-[11px] font-black text-white">
              {segment.speakerName || "Nguoi noi"}
            </p>
            <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-300">
              {segment.text}
            </p>
          </div>
        ))}
        {!segments.length ? (
          <p className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-center text-xs font-semibold text-zinc-500">
            Chua co transcript live.
          </p>
        ) : null}
      </div>
    </section>
  );
}
