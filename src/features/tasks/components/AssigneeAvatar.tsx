"use client";

import { useEffect, useState } from "react";

type AssigneeAvatarProps = {
  avatarUrl?: string | null;
  displayName?: string | null;
  className?: string;
  fallbackClassName?: string;
};

function getInitials(displayName?: string | null) {
  const words = displayName?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return "-";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function AssigneeAvatar({
  avatarUrl,
  displayName,
  className = "h-6 w-6",
  fallbackClassName = "bg-[#00875a] text-white",
}: AssigneeAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => setImageFailed(false), [avatarUrl]);

  const sharedClassName = `${className} shrink-0 rounded-full border-2 border-white object-cover shadow-sm`;

  if (avatarUrl && !imageFailed) {
    return (
      <img
        alt={displayName || "Avatar người phụ trách"}
        className={sharedClassName}
        onError={() => setImageFailed(true)}
        src={avatarUrl}
        title={displayName || "Người phụ trách"}
      />
    );
  }

  return (
    <span
      className={`flex items-center justify-center text-xs font-semibold ${sharedClassName} ${fallbackClassName}`}
      title={displayName || "Chưa gán"}
    >
      {getInitials(displayName)}
    </span>
  );
}
