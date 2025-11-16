import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = {
  title: "Dashboard - SchoolMgmt",
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-72 flex-col bg-gradient-to-b from-indigo-700 via-purple-700 to-slate-900 text-white shadow-xl">
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white/10 flex items-center justify-center text-lg font-bold">
              SM
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide">SchoolMgmt</h3>
              <p className="text-[11px] text-indigo-100/80">Dashboard &amp; controls</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-1 text-sm">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wide text-indigo-100/70 mb-2">
            Main
          </p>
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[11px]">
              D
            </span>
            <span>Overview</span>
          </Link>

          <p className="px-3 pt-4 text-[11px] font-semibold uppercase tracking-wide text-indigo-100/70">
            Management
          </p>
          <Link
            href="/dashboard/students"
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/20 text-[11px]">
              S
            </span>
            <span>Students</span>
          </Link>
          <Link
            href="/dashboard/teachers"
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-400/20 text-[11px]">
              T
            </span>
            <span>Teachers</span>
          </Link>
          <Link
            href="/dashboard/events"
            className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10 transition-colors"
          >
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20 text-[11px]">
              E
            </span>
            <span>Events</span>
          </Link>
        </nav>

        <div className="px-5 py-4 border-t border-white/10 text-[11px] text-indigo-100/80">
          <p className="font-medium">Signed in dashboard</p>
          <p className="mt-1 text-indigo-100/70">Manage the day-to-day of your school from one place.</p>
        </div>
      </aside>

      {/* Main content */}
      <section className="flex-1 min-w-0 bg-slate-50/80">{children}</section>
    </div>
  );
}
