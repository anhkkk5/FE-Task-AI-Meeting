"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "agile_ai_access_token";

type AccessTokenBarProps = {
  onTokenChange?: (token: string) => void;
};

export function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

export function AccessTokenBar({ onTokenChange }: AccessTokenBarProps) {
  const [token, setToken] = useState(() => getStoredAccessToken());

  useEffect(() => {
    onTokenChange?.(token);
  }, [onTokenChange, token]);

  function saveToken() {
    window.localStorage.setItem(STORAGE_KEY, token.trim());
    onTokenChange?.(token.trim());
  }

  function clearToken() {
    window.localStorage.removeItem(STORAGE_KEY);
    setToken("");
    onTokenChange?.("");
  }

  return (
    <div className="flex flex-col gap-3 border-b border-zinc-200 bg-white px-6 py-4 md:flex-row md:items-center">
      <label className="text-sm font-medium text-zinc-700" htmlFor="token">
        Access token
      </label>
      <input
        id="token"
        className="h-10 min-w-0 flex-1 border border-zinc-300 px-3 text-sm outline-none focus:border-zinc-900"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="Paste JWT access token"
      />
      <div className="flex gap-2">
        <button
          className="h-10 bg-zinc-900 px-4 text-sm font-medium text-white"
          type="button"
          onClick={saveToken}
        >
          Save
        </button>
        <button
          className="h-10 border border-zinc-300 px-4 text-sm font-medium text-zinc-700"
          type="button"
          onClick={clearToken}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
