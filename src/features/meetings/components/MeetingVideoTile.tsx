"use client";

import { useEffect, useRef } from "react";

type MeetingVideoTileProps = {
  label: string;
  stream?: MediaStream | null;
  muted?: boolean;
  isLocal?: boolean;
  audioEnabled?: boolean;
  videoEnabled?: boolean;
  screenSharing?: boolean;
};

export function MeetingVideoTile({
  label,
  stream,
  muted,
  isLocal,
  audioEnabled = true,
  videoEnabled = true,
  screenSharing = false,
}: MeetingVideoTileProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const audio = audioRef.current;

    if (video) {
      video.srcObject = stream ?? null;
      void video.play().catch(() => undefined);
    }

    if (audio) {
      audio.srcObject = stream ?? null;
      audio.muted = Boolean(muted || isLocal);
      audio.volume = 1;
      void audio.play().catch(() => undefined);
    }
  }, [isLocal, muted, stream, videoEnabled]);

  const initial = label.trim().charAt(0).toUpperCase() || "U";

  return (
    <article className="relative min-h-64 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-zinc-950/20">
      {stream && !isLocal ? (
        <audio ref={audioRef} autoPlay data-meeting-audio="true" />
      ) : null}

      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          className="h-full min-h-64 w-full bg-zinc-950 object-cover"
          muted
          playsInline
        />
      ) : (
        <div className="flex h-full min-h-64 w-full items-center justify-center bg-[radial-gradient(circle_at_top_left,#1d4ed8,#18181b_55%)]">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 text-3xl font-black text-white ring-1 ring-white/20">
            {initial}
          </div>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/85 to-transparent px-4 pb-4 pt-12">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">
            {label}
            {isLocal ? " (Bạn)" : ""}
          </p>
          {screenSharing ? (
            <p className="mt-1 text-[11px] font-bold text-blue-200">
              Đang chia sẻ màn hình
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <span
            className={`rounded-lg px-2 py-1 text-[10px] font-black ${
              audioEnabled
                ? "bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/20"
                : "bg-red-400/15 text-red-100 ring-1 ring-red-300/20"
            }`}
          >
            {audioEnabled ? "MIC" : "TẮT MIC"}
          </span>
          <span
            className={`rounded-lg px-2 py-1 text-[10px] font-black ${
              videoEnabled
                ? "bg-blue-400/15 text-blue-100 ring-1 ring-blue-300/20"
                : "bg-zinc-400/15 text-zinc-100 ring-1 ring-zinc-300/20"
            }`}
          >
            {videoEnabled ? "CAM" : "TẮT CAM"}
          </span>
        </div>
      </div>
    </article>
  );
}
