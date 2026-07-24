import Link from "next/link";
import { ReactNode } from "react";
import { 
  TrendingUp, 
  Calendar, 
  CheckSquare, 
  Sparkles, 
  Zap, 
  Users, 
  BarChart3, 
  ClipboardList 
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
  footerText = "Don't have an account?",
  footerLinkText = "Create one",
  footerLinkHref = "/register",
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between selection:bg-blue-500 selection:text-white font-sans antialiased">
      <div className="grid min-h-screen w-full lg:grid-cols-12 overflow-hidden">
        {/* Left Side - Dynamic Showcase based on variant */}
        <section className="hidden lg:flex lg:col-span-7 relative bg-gradient-to-br from-slate-50 via-sky-50/70 to-indigo-100/50 p-12 flex-col justify-between overflow-hidden border-r border-slate-200/60">
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 right-0 w-80 h-80 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl pointer-events-none" />

          {/* Decorative Grid Overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#000 1px, transparent 1px)`,
              backgroundSize: '24px 24px'
            }}
          />

          {variant === "register" ? (
            /* REGISTER VARIANT SHOWCASE */
            <>
              {/* Top Badge */}
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50/90 backdrop-blur-md px-3.5 py-1.5 text-xs font-bold text-indigo-700 shadow-sm border border-indigo-100">
                  <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600 animate-pulse" />
                  <span>HIGH VELOCITY AGILE</span>
                </div>
              </div>

              {/* Main Register Hero Content */}
              <div className="relative z-10 max-w-xl my-auto py-6">
                <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                  Build Better<br />
                  Projects<br />
                  <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Together
                  </span>
                </h1>
                <p className="mt-4 text-base xl:text-lg text-slate-600 leading-relaxed font-normal">
                  Join thousands of teams using AgileFlow to plan projects, organize tasks and deliver work faster with our high-end neo-glass environment.
                </p>

                {/* 3 Feature Highlight Cards */}
                <div className="mt-8 space-y-3.5">
                  {/* Card 1: Smart Task Management */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] border border-white/90 border-l-4 border-l-cyan-500 flex items-center gap-4 transform hover:translate-x-1 transition duration-200">
                    <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 shrink-0 border border-cyan-100">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Smart Task Management
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        AI-powered prioritization and sprint mapping.
                      </p>
                    </div>
                  </div>

                  {/* Card 2: Team Collaboration */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] border border-white/90 border-l-4 border-l-indigo-600 flex items-center gap-4 transform hover:translate-x-1 transition duration-200">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 border border-indigo-100">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Team Collaboration
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Seamless real-time updates across distributed teams.
                      </p>
                    </div>
                  </div>

                  {/* Card 3: Real-time Progress Tracking */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] border border-white/90 border-l-4 border-l-emerald-600 flex items-center gap-4 transform hover:translate-x-1 transition duration-200">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 border border-emerald-100">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">
                        Real-time Progress Tracking
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Live burn-down charts and velocity metrics.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* LOGIN VARIANT SHOWCASE */
            <>
              {/* Top Brand Pill */}
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 backdrop-blur-md px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-sm border border-white/80">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  <span>Next-Gen Workspace</span>
                </div>
              </div>

              {/* Hero Content */}
              <div className="relative z-10 max-w-xl my-auto py-8">
                <h1 className="text-4xl xl:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                  Manage Projects{" "}
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                    Smarter
                  </span>
                </h1>
                <p className="mt-4 text-base xl:text-lg text-slate-600 leading-relaxed font-normal">
                  Plan sprints, assign tasks, collaborate with your team and track progress in one intelligent workspace.
                </p>

                {/* Interactive Workspace Mockup Visual */}
                <div className="mt-10 relative">
                  {/* Sprint 12 Card */}
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] border border-white/80">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                        Sprint 12
                      </h3>
                      {/* Avatar Stack */}
                      <div className="flex items-center -space-x-2">
                        <div className="w-8 h-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          JD
                        </div>
                        <div className="w-8 h-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          AK
                        </div>
                        <div className="w-8 h-8 rounded-full ring-2 ring-white bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                          SL
                        </div>
                        <div className="w-8 h-8 rounded-full ring-2 ring-white bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shadow-sm">
                          +3
                        </div>
                      </div>
                    </div>

                    {/* Task Columns */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider mb-2 block">
                          TO DO
                        </span>
                        <div className="space-y-2">
                          <div className="bg-slate-100/90 text-slate-700 p-2.5 rounded-lg font-medium border border-slate-200/60 shadow-2xs">
                            API Integration
                          </div>
                          <div className="bg-slate-100/90 text-slate-700 p-2.5 rounded-lg font-medium border border-slate-200/60 shadow-2xs">
                            Mobile Nav
                          </div>
                        </div>
                      </div>

                      <div>
                        <span className="font-semibold text-blue-600 uppercase text-[10px] tracking-wider mb-2 block">
                          IN PROGRESS
                        </span>
                        <div className="bg-blue-50/90 text-blue-900 p-2.5 rounded-lg font-medium border border-blue-200/80 shadow-2xs border-l-4 border-l-blue-600">
                          Glass UI Refactor
                        </div>
                      </div>

                      <div>
                        <span className="font-semibold text-emerald-600 uppercase text-[10px] tracking-wider mb-2 block">
                          DONE
                        </span>
                        <div className="bg-emerald-50/70 text-emerald-800 p-2.5 rounded-lg font-medium border border-emerald-100/80 shadow-2xs opacity-80">
                          User Auth
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating Card: Sprint Velocity */}
                  <div className="absolute -bottom-6 -right-4 bg-white/95 backdrop-blur-xl rounded-xl p-4 shadow-xl shadow-slate-900/10 border border-slate-100 w-52 transform hover:-translate-y-1 transition duration-300">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-slate-800">Sprint Velocity</span>
                    </div>
                    <div className="flex items-end gap-2 h-12 pt-2">
                      <div className="flex-1 bg-cyan-300 rounded-t-sm h-[50%]" />
                      <div className="flex-1 bg-cyan-400 rounded-t-sm h-[75%]" />
                      <div className="flex-1 bg-teal-600 rounded-t-sm h-[100%]" />
                      <div className="flex-1 bg-cyan-300 rounded-t-sm h-[60%]" />
                      <div className="flex-1 bg-cyan-400 rounded-t-sm h-[85%]" />
                    </div>
                  </div>

                  {/* Floating Card: Deadline */}
                  <div className="absolute -bottom-8 -left-4 bg-white/95 backdrop-blur-xl rounded-xl p-4 shadow-xl shadow-slate-900/10 border border-slate-100 flex items-center gap-3.5 transform hover:-translate-y-1 transition duration-300">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">Deadline</span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-extrabold text-indigo-900 leading-none">24</span>
                        <span className="text-[11px] font-bold text-indigo-600 uppercase">OCTOBER</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Left Footer Info */}
          <div className="relative z-10 text-xs text-slate-400">
            Intelligent Agile Workspace Platform
          </div>
        </section>

        {/* Right Side - Form Container */}
        <section className="col-span-12 lg:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 bg-white">
          {/* Header Logo */}
          <div className="flex items-center justify-between mb-6">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition duration-200">
                <CheckSquare className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                AgileFlow
              </span>
            </Link>
          </div>

          {/* Main Auth Form Container */}
          <div className="w-full max-w-md mx-auto my-auto py-2">
            <div className="bg-white rounded-3xl p-7 sm:p-9 shadow-2xl shadow-slate-200/60 border border-slate-100">
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
                  className="font-bold text-indigo-600 hover:text-indigo-700 transition hover:underline"
                >
                  {footerLinkText}
                </Link>
              </p>
            )}
          </div>

          {/* Bottom Page Footer */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center sm:flex sm:items-center sm:justify-between text-xs text-slate-400 space-y-2 sm:space-y-0">
            <span>© {new Date().getFullYear()} AgileFlow Inc. Built for velocity.</span>
            <div className="flex justify-center gap-4 text-slate-400">
              <a href="#" className="hover:text-slate-600 transition">Privacy</a>
              <a href="#" className="hover:text-slate-600 transition">Terms</a>
              <a href="#" className="hover:text-slate-600 transition">Support</a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
