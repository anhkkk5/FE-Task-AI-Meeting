"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { register } from "@/features/auth/api/auth.api";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { saveAccessToken } from "@/features/auth/utils/token-storage";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEmail = email.trim();
    const nextFullName = fullName.trim();
    const nextPassword = password.trim();

    if (!nextFullName || !nextEmail || !nextPassword) {
      setMessage("Vui lòng nhập đầy đủ họ tên, email và mật khẩu.");
      return;
    }

    if (nextFullName.length < 2) {
      setMessage("Họ tên phải có ít nhất 2 ký tự.");
      return;
    }

    if (!nextEmail.includes("@")) {
      setMessage("Email không đúng định dạng.");
      return;
    }

    if (nextPassword.length < 8) {
      setMessage("Mật khẩu phải có ít nhất 8 ký tự.");
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
        throw new Error("Tạo tài khoản chưa nhận được phiên làm việc.");
      }

      saveAccessToken(accessToken);
      window.location.assign("/workspaces");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Đăng ký thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Create Account 👋"
      subtitle="Sign up to start managing your team workspace."
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerLinkHref="/login"
    >
      {message ? (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200/80 bg-red-50/90 p-3.5 text-xs text-red-700 shadow-2xs">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0 animate-ping" />
          <span className="font-medium leading-relaxed">{message}</span>
        </div>
      ) : null}

      <form className="space-y-4" noValidate onSubmit={handleSubmit}>
        {/* Full Name Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Full Name
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none transition duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="Nguyen Van A"
              minLength={2}
              maxLength={120}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>
        </div>

        {/* Work Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Work Email
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none transition duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="name@company.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none transition duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
              placeholder="At least 8 characters"
              type={showPassword ? "text" : "password"}
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 text-slate-400 hover:text-slate-600 transition"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          className="w-full mt-2 h-11 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white font-semibold text-sm shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/35 transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
