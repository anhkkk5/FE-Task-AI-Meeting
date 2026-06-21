import Link from "next/link";
import { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  subtitle: string;
  asideTitle: string;
  asideText: string;
  children: ReactNode;
};

const highlights = [
  { label: "Workspace", value: "Team access" },
  { label: "Projects", value: "Delivery flow" },
  { label: "Members", value: "Role control" },
];

export function AuthShell({
  title,
  subtitle,
  asideTitle,
  asideText,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f5f7fb] text-zinc-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl px-5 py-6 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-8 lg:px-8">
        <section className="hidden min-h-[calc(100vh-48px)] flex-col justify-between rounded-lg border border-zinc-200 bg-[#0f172a] p-8 text-white lg:flex">
          <div className="flex items-center justify-between">
            <Link className="text-sm font-semibold tracking-wide" href="/">
              Agile AI
            </Link>
            <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-sky-100">
              SaaS Console
            </span>
          </div>

          <div className="max-w-xl">
            <p className="mb-4 w-fit rounded-md bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
              Project Management
            </p>
            <h1 className="text-4xl font-semibold leading-tight">
              {asideTitle}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
              {asideText}
            </p>
          </div>

          <div className="grid gap-3">
            {highlights.map((item) => (
              <div
                className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.06] px-4 py-3"
                key={item.label}
              >
                <span className="text-sm text-slate-300">{item.label}</span>
                <span className="text-sm font-semibold text-white">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex min-h-[calc(100vh-48px)] items-center justify-center">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <Link className="text-sm font-semibold text-zinc-900" href="/">
                Agile AI
              </Link>
            </div>

            <div className="rounded-lg border border-zinc-200 bg-white p-7 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
              <div className="mb-7">
                <h2 className="text-2xl font-semibold text-zinc-950">
                  {title}
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {subtitle}
                </p>
              </div>
              {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
