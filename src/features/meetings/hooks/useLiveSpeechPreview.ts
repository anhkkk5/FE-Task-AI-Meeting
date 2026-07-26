"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Web Speech API chua co trong lib.dom mac dinh nen phai tu khai bao.
 */
type SpeechRecognitionAlternativeLike = {
  transcript: string;
  confidence: number;
};

type SpeechRecognitionResultLike = {
  readonly length: number;
  readonly isFinal: boolean;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultListLike = {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionEventLike = Event & {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = Event & {
  readonly error: string;
};

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function getRecognitionConstructor() {
  if (typeof window === "undefined") return null;

  const candidate = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return (
    candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null
  );
}

type UseLiveSpeechPreviewOptions = {
  enabled?: boolean;
  lang?: string;
  /**
   * Goi khi trinh duyet CHOT xong mot cau. Day la van ban chinh thuc, dung de
   * luu vao DB.
   */
  onFinalText?: (text: string) => void;
};

/**
 * Nghe micro va tra ve van ban theo thoi gian thuc.
 *
 * - interimText: chu hien ngay trong luc dang noi (chua chot).
 * - onFinalText: cau da chot, dung lam ban ghi chinh thuc.
 *
 * Vi sao dung day lam nguon chinh thay vi Whisper: Whisper chay theo lo, phai
 * cat tron mot cau roi gui len server, nen vua cham vua phu thuoc vao buoc phat
 * hien tieng noi o client. Web Speech API nhan dien truc tiep va tra ket qua
 * ngay khi nguoi dung dang noi.
 */
export function useLiveSpeechPreview({
  enabled = true,
  lang = "vi-VN",
  onFinalText,
}: UseLiveSpeechPreviewOptions = {}) {
  const [interimText, setInterimText] = useState("");
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onFinalTextRef = useRef(onFinalText);

  // Dong bo callback moi nhat de effect khong phai khoi tao lai recognition.
  useEffect(() => {
    onFinalTextRef.current = onFinalText;
  }, [onFinalText]);

  useEffect(() => {
    if (!enabled) {
      setInterimText("");
      return;
    }

    const RecognitionCtor = getRecognitionConstructor();

    if (!RecognitionCtor) {
      setIsSupported(false);
      return;
    }

    let disposed = false;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;
    const recognition = new RecognitionCtor();
    recognitionRef.current = recognition;
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      if (disposed) return;

      let interim = "";
      let finalText = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) finalText += transcript;
        else interim += transcript;
      }

      setInterimText(interim.trim());

      // Cau da chot moi duoc luu. Truoc day doan nay bi bo di nen du man hinh
      // co hien chu, khong co gi duoc ghi vao bien ban.
      const cleanFinalText = finalText.trim();
      if (cleanFinalText) onFinalTextRef.current?.(cleanFinalText);
    };

    recognition.onerror = (event) => {
      // "no-speech" va "aborted" la trang thai binh thuong khi im lang.
      if (
        event.error === "not-allowed" ||
        event.error === "service-not-allowed"
      ) {
        setIsSupported(false);
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (disposed) return;

      setInterimText("");
      // Trinh duyet tu ngat sau mot khoang im lang, phai tu khoi dong lai de
      // giu che do nghe lien tuc suot cuoc hop.
      restartTimer = setTimeout(() => {
        try {
          recognition.start();
        } catch {
          // Bo qua khi recognition dang chay hoac da bi huy.
        }
      }, 400);
    };

    try {
      recognition.start();
      setIsListening(true);
    } catch {
      setIsSupported(false);
    }

    return () => {
      disposed = true;

      if (restartTimer) clearTimeout(restartTimer);

      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
      setInterimText("");
      setIsListening(false);
    };
  }, [enabled, lang]);

  return { interimText, isSupported, isListening };
}
