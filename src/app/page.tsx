"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getStoredAccessToken } from "@/features/auth/utils/token-storage";

export default function Home() {
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(!!getStoredAccessToken());
  }, []);

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col justify-between">
      {/* Navbar */}
      <nav className="mx-auto max-w-7xl w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-slate-950 font-black shadow-md">
            A
          </div>
          <span className="text-lg font-bold tracking-wide">Agile AI</span>
        </div>
        <div className="flex items-center gap-4">
          {hasToken ? (
            <Link
              className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 transition"
              href="/workspaces"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link className="text-sm font-medium hover:text-slate-300 transition" href="/login">
                Đăng nhập
              </Link>
              <Link
                className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition"
                href="/register"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center flex-1 flex flex-col justify-center items-center">
        <span className="rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20 mb-6">
          Nền tảng quản lý dự án Agile/Scrum thế hệ mới
        </span>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight max-w-3xl">
          Quản lý dự án Agile hiệu quả với <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">Trợ lý AI cá nhân</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl leading-relaxed">
          Tối ưu hóa quy trình làm việc Scrum, theo dõi tiến độ dự án, tự động tổng hợp báo cáo và tóm tắt cuộc họp hàng ngày nhờ sức mạnh của Trí tuệ nhân tạo.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          {hasToken ? (
            <Link
              className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 hover:scale-105 transition"
              href="/workspaces"
            >
              Đi tới Dashboard của bạn
            </Link>
          ) : (
            <>
              <Link
                className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-950 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 hover:scale-105 transition"
                href="/register"
              >
                Bắt đầu miễn phí ngay
              </Link>
              <Link
                className="rounded-xl border border-slate-700 bg-slate-800/50 backdrop-blur px-6 py-3.5 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition"
                href="/login"
              >
                Đăng nhập tài khoản
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Agile AI Project Management. Bảo lưu mọi quyền.</p>
      </footer>
    </main>
  );
}
