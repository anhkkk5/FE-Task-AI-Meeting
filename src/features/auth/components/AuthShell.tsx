import Link from "next/link";
import { ReactNode } from "react";
import { 
  CheckSquare, 
  Zap, 
  Users, 
  BarChart3, 
  ClipboardList,
  Bell
} from "lucide-react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  variant?: "login" | "register";
  footerText?: string;
  footerLinkText?: string;
  footerLinkHref?: string;
};

export function AuthShell({
  title,
  subtitle,
  children,
  variant = "login",
  footerText = "Chưa có tài khoản?",
  footerLinkText = "Tạo tài khoản",
  footerLinkHref = "/register",
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f9fafb] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white font-sans antialiased">
      <div className="grid min-h-screen w-full lg:grid-cols-12 overflow-hidden">
        {/* Left Side - Dynamic Showcase based on variant */}
        <section className="hidden lg:flex lg:col-span-7 relative bg-[#f9fafb] p-12 flex-col justify-between overflow-hidden border-r border-slate-200/50">
          {/* Extremely Subtle Ambient Background Lighting */}
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Decorative Subtle Grid Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          {variant === "register" ? (
            /* REGISTER VARIANT SHOWCASE (Matching new user image) */
            <>
              {/* Top Badge */}
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-50/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-blue-600 shadow-2xs border border-blue-100">
                  <Zap className="w-3.5 h-3.5 text-blue-600 fill-blue-600" />
                  <span>HIỆU SUẤT DOANH NGHIỆP</span>
                </div>
              </div>

              {/* Main Register Hero Content */}
              <div className="relative z-10 max-w-xl my-auto py-6">
                <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                  Làm dự án tốt hơn<br />
                  khi cả nhóm<br />
                  <span className="text-blue-600">
                    cùng nhìn một hướng
                  </span>
                </h1>
                <p className="mt-4 text-base xl:text-lg text-slate-500 leading-relaxed font-normal">
                  Lập kế hoạch dự án, sắp xếp công việc và bàn giao nhanh hơn cùng AgileFlow, trong một không gian làm việc gọn gàng cho doanh nghiệp.
                </p>

                {/* 3 Feature Highlight Cards */}
                <div className="mt-8 space-y-3.5">
                  {/* Card 1: Smart Task Management */}
                  <div className="bg-white rounded-2xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.03)] border border-slate-100 border-l-4 border-l-blue-500 flex items-center gap-4 transform hover:translate-x-1 transition duration-200">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100/60">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Quản lý công việc thông minh
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        AI xếp thứ tự ưu tiên và gợi ý phân bổ vào sprint.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Team Collaboration */}
                  <div className="bg-white rounded-2xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.03)] border border-slate-100 border-l-4 border-l-blue-600 flex items-center gap-4 transform hover:translate-x-1 transition duration-200">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-100/60">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Phối hợp trong nhóm
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Cập nhật tức thời cho cả nhóm ở nhiều nơi khác nhau.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Real-time Progress Tracking */}
                  <div className="bg-white rounded-2xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.03)] border border-slate-100 border-l-4 border-l-slate-400 flex items-center gap-4 transform hover:translate-x-1 transition duration-200">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 border border-slate-200/60">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Theo dõi tiến độ theo thời gian thực
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Biểu đồ burn-down và tốc độ hoàn thành cập nhật liên tục.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* LOGIN VARIANT SHOWCASE */
            <>
              <div />

              {/* Main Login Hero Content */}
              <div className="relative z-10 max-w-xl my-auto py-8">
                <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                  Quản lý dự án{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    thông minh hơn
                  </span>
                </h1>
                <p className="mt-4 text-base xl:text-lg text-slate-500 leading-relaxed font-normal">
                  Lên kế hoạch sprint, giao việc, phối hợp cùng nhóm và theo dõi tiến độ trong một không gian làm việc duy nhất.
                </p>

                {/* Interactive Project Alpha Mockup Visual */}
                <div className="mt-10 relative">
                  {/* Project Alpha Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-[0_15px_40px_rgba(15,23,42,0.04)] border border-slate-200/80">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-6 rounded-full bg-blue-600" />
                        <h3 className="font-extrabold text-slate-900 text-lg font-serif">
                          Dự án Alpha
                        </h3>
                      </div>

                      {/* Avatar Stack */}
                      <div className="flex items-center -space-x-2">
                        <div className="w-7 h-7 rounded-full ring-2 ring-white bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                          JD
                        </div>
                        <div className="w-7 h-7 rounded-full ring-2 ring-white bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                          AK
                        </div>
                        <div className="w-7 h-7 rounded-full ring-2 ring-white bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                          +12
                        </div>
                      </div>
                    </div>

                    {/* Task Columns */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      {/* BACKLOG */}
                      <div>
                        <span className="font-bold text-slate-400 uppercase text-[10px] tracking-wider mb-2 block">
                          CHỜ XỬ LÝ
                        </span>
                        <div className="space-y-2">
                          <div className="bg-slate-50 text-slate-800 p-2.5 rounded-xl font-medium border border-slate-200/70 shadow-2xs">
                            Rà soát bảo mật
                          </div>
                          <div className="bg-slate-50 text-slate-800 p-2.5 rounded-xl font-medium border border-slate-200/70 shadow-2xs">
                            Chuyển hạ tầng lên cloud
                          </div>
                        </div>
                      </div>

                      {/* ACTIVE */}
                      <div>
                        <span className="font-bold text-teal-600 uppercase text-[10px] tracking-wider mb-2 block">
                          ĐANG LÀM
                        </span>
                        <div className="bg-white text-slate-900 p-2.5 rounded-xl font-semibold border-2 border-blue-500 shadow-2xs">
                          Nâng cấp hệ thống giao diện
                        </div>
                      </div>

                      {/* COMPLETED */}
                      <div>
                        <span className="font-bold text-emerald-600 uppercase text-[10px] tracking-wider mb-2 block">
                          HOÀN THÀNH
                        </span>
                        <div className="bg-slate-50 text-slate-400 p-2.5 rounded-xl font-medium border border-slate-200/50">
                          Luồng đăng nhập
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Card 1: Recent Activity */}
                  <div className="absolute -bottom-6 -right-4 bg-white rounded-2xl p-4 shadow-xl shadow-slate-900/5 border border-slate-100 w-56 transform hover:-translate-y-1 transition duration-300">
                    <div className="flex items-center gap-2 mb-2.5">
                      <Bell className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-extrabold text-slate-800">Hoạt động gần đây</span>
                    </div>
                    <div className="space-y-1.5 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="truncate">Minh vừa cập nhật <strong className="font-bold text-slate-800">Sprint 4</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0" />
                        <span className="truncate">Có công việc mới được giao</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating Card 2: Team Velocity */}
                  <div className="absolute -bottom-10 -left-6 bg-white rounded-2xl p-4 shadow-xl shadow-slate-900/5 border border-slate-100 w-52 transform hover:-translate-y-1 transition duration-300">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold text-slate-800">Tốc độ của nhóm</span>
                      <span className="text-[11px] font-extrabold text-blue-600">+14%</span>
                    </div>
                    <div className="flex items-end gap-1.5 h-10 pt-2">
                      <div className="flex-1 bg-slate-200 rounded-sm h-[30%]" />
                      <div className="flex-1 bg-slate-200 rounded-sm h-[50%]" />
                      <div className="flex-1 bg-blue-600 rounded-sm h-[100%]" />
                      <div className="flex-1 bg-slate-200 rounded-sm h-[40%]" />
                      <div className="flex-1 bg-slate-200 rounded-sm h-[60%]" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Left Footer Info */}
          <div className="relative z-10 text-xs text-slate-400">
            Nền tảng làm việc Agile có AI hỗ trợ
          </div>
        </section>

        {/* Right Side - Form Container */}
        <section className="col-span-12 lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-white">
          {/* Header Logo */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition duration-200">
                <CheckSquare className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                AgileFlow
              </span>
            </Link>
          </div>

          {/* Main Auth Form Container */}
          <div className="w-full max-w-md mx-auto my-auto py-2">
            <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-2xl shadow-slate-200/50 border border-slate-100">
              <div className="mb-6 text-center sm:text-left">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed font-normal">
                  {subtitle}
                </p>
              </div>

              {children}
            </div>

            {/* Account Switch Footer */}
            {footerText && footerLinkText && (
              <p className="mt-6 text-center text-sm font-medium text-slate-600">
                {footerText}{" "}
                <Link
                  href={footerLinkHref}
                  className="font-bold text-blue-600 hover:text-blue-700 transition hover:underline"
                >
                  {footerLinkText}
                </Link>
              </p>
            )}
          </div>

          {/* Bottom Page Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-400 space-y-2 sm:space-y-0">
            <span>© {new Date().getFullYear()} AgileFlow. Dành cho những nhóm làm việc nhanh.</span>
            <div className="flex justify-center gap-4 text-slate-400">
              <a href="#" className="hover:text-slate-600 transition">Chính sách bảo mật</a>
              <a href="#" className="hover:text-slate-600 transition">Điều khoản sử dụng</a>
              <a href="#" className="hover:text-slate-600 transition">Hỗ trợ</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
