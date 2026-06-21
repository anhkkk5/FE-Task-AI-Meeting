"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { register } from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { saveAccessToken } from "@/features/auth/utils/token-storage";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await register({ email, fullName, password });
      saveAccessToken(response.data.tokens.accessToken);
      router.push("/workspaces");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Register failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      asideText="Khoi tao tai khoan, tao workspace dau tien va moi thanh vien vao dung vai tro."
      asideTitle="Set up your team workspace in minutes."
      subtitle="Tao tai khoan moi de bat dau quan ly workspace va project."
      title="Create your account"
    >
        {message ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Full name
            <input
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="Nguyen Van A"
              minLength={2}
              maxLength={120}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Email
            <input
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="you@company.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Password
            <input
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="At least 8 characters"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button
            className="mt-1 h-11 rounded-md bg-[#0f172a] px-5 text-sm font-semibold text-white transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:bg-zinc-400"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Creating..." : "Register"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link className="font-semibold text-emerald-700" href="/login">
            Login
          </Link>
        </p>
    </AuthShell>
  );
}
