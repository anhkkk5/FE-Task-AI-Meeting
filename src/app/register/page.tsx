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

    const nextEmail = email.trim();
    const nextFullName = fullName.trim();
    const nextPassword = password.trim();

    if (!nextFullName || !nextEmail || !nextPassword) {
      setMessage("Vui long nhap day du ho ten, email va mat khau.");
      return;
    }

    if (nextFullName.length < 2) {
      setMessage("Ho ten phai co it nhat 2 ky tu.");
      return;
    }

    if (!nextEmail.includes("@")) {
      setMessage("Email khong dung dinh dang.");
      return;
    }

    if (nextPassword.length < 8) {
      setMessage("Mat khau phai co it nhat 8 ky tu.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    try {
      const response = await register({
        email: nextEmail,
        fullName: nextFullName,
        password: nextPassword,
      });
      const accessToken = response.data.tokens.accessToken;

      if (!accessToken) {
        throw new Error("Backend khong tra ve access token.");
      }

      saveAccessToken(accessToken);
      router.replace("/workspaces");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dang ky that bai.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      asideText="Khoi tao tai khoan, tao workspace dau tien va moi thanh vien vao dung vai tro."
      asideTitle="Set up your team workspace in minutes."
      subtitle="Tao tai khoan moi de bat dau quan ly workspace va project."
      title="Tao tai khoan"
    >
        {message ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Ho ten
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
            Mat khau
            <input
              className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm font-normal outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              placeholder="It nhat 8 ky tu"
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
            {isSubmitting ? "Dang tao..." : "Dang ky"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600">
          Da co tai khoan?{" "}
          <Link className="font-semibold text-emerald-700" href="/login">
            Dang nhap
          </Link>
        </p>
    </AuthShell>
  );
}
