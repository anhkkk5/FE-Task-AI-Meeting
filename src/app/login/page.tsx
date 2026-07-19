"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login } from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { saveAccessToken } from "@/features/auth/utils/token-storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEmail = email.trim();
    const nextPassword = password.trim();

    if (!nextEmail || !nextPassword) {
      setMessage("Vui long nhap email va mat khau.");
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
      const response = await login({
        email: nextEmail,
        password: nextPassword,
      });
      const accessToken = response.data.tokens.accessToken;

      if (!accessToken) {
        throw new Error("Đăng nhập chưa nhận được phiên làm việc.");
      }

      saveAccessToken(accessToken);
      router.replace("/workspaces");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Dang nhap that bai.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      asideText="Theo doi workspace, quan ly thanh vien va dieu phoi project tren mot man hinh gon gang."
      asideTitle="Move from idea to sprint-ready work."
      subtitle="Dang nhap de tiep tuc quan ly workspace cua nhom."
      title="Chao mung tro lai"
    >
        {message ? (
          <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {message}
          </p>
        ) : null}
        <form className="grid gap-4" noValidate onSubmit={handleSubmit}>
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
              placeholder="Nhap mat khau"
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
            {isSubmitting ? "Dang dang nhap..." : "Dang nhap"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600">
          Chua co tai khoan?{" "}
          <Link className="font-semibold text-emerald-700" href="/register">
            Tao tai khoan
          </Link>
        </p>
    </AuthShell>
  );
}
