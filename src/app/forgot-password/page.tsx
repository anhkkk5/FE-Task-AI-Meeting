"use client";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { forgotPassword, resetPassword } from "@/features/auth/api/auth.api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState(""); const [otp, setOtp] = useState(""); const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setBusy(true); setMessage(""); try { if (!sent) { const response = await forgotPassword(email.trim()); setSent(true); setMessage(response.message); } else { const response = await resetPassword({ email: email.trim(), otp, newPassword: password }); setMessage(`${response.message}. Bạn có thể đăng nhập lại.`); } } catch (error) { setMessage(error instanceof Error ? error.message : "Không thể xử lý yêu cầu."); } finally { setBusy(false); } }
  return <AuthShell title="Đặt lại mật khẩu" subtitle="Mã xác thực có hiệu lực trong 10 phút." footerText="Đã nhớ mật khẩu?" footerLinkText="Đăng nhập" footerLinkHref="/login"><form className="space-y-4" onSubmit={submit}><input className="h-11 w-full rounded-xl border px-3" disabled={sent} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />{sent ? <><input className="h-11 w-full rounded-xl border px-3 text-center tracking-[0.4em]" maxLength={6} placeholder="Mã OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} /><input className="h-11 w-full rounded-xl border px-3" minLength={8} placeholder="Mật khẩu mới" type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></> : null}{message ? <p className="text-sm text-slate-600">{message}</p> : null}<button className="h-11 w-full rounded-xl bg-blue-600 font-semibold text-white disabled:opacity-50" disabled={busy || !email || (sent && (otp.length !== 6 || password.length < 8))}>{sent ? "Đặt lại mật khẩu" : "Gửi mã xác thực"}</button></form></AuthShell>;
}
