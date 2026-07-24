"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LayoutDashboard,
  Boxes,
  FolderKanban,
  CheckSquare,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Search,
  Bell,
  HelpCircle,
  Folder,
  ClipboardList,
  Zap,
  PlusCircle,
  FolderPlus,
  Mail,
  Download,
  Clock,
  Sparkles,
  ArrowRight,
  MoreHorizontal,
  CheckCircle2,
  MessageSquare,
  UserPlus,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const { user } = useAuth(false);
  const [activeTab, setActiveTab] = useState("Dashboard");

  const userName = user?.fullName || "Alex Rivera";
  const userInitial = userName.charAt(0).toUpperCase();

  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { name: "Workspaces", icon: Boxes, href: "/workspaces" },
    { name: "Projects", icon: FolderKanban, href: "/workspaces" },
    { name: "Tasks", icon: CheckSquare, href: "#" },
    { name: "Calendar", icon: Calendar, href: "#" },
    { name: "Teams", icon: Users, href: "#" },
    { name: "Reports", icon: BarChart3, href: "#" },
    { name: "Settings", icon: Settings, href: "#" },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-800 font-sans selection:bg-blue-500 selection:text-white">
      {/* 1. Left Sidebar Navigation */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200/80 bg-white md:flex justify-between">
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-100">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                  Nexus Enterprise
                </h1>
                <p className="text-[11px] font-medium text-slate-400">
                  Agile Workspace
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setActiveTab(item.name)}
                  className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition duration-150 ${
                    isActive
                      ? "bg-blue-50 text-blue-600 shadow-2xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="p-4 border-t border-slate-100 text-xs text-slate-400">
          <p>© 2026 AgileFlow Platform</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* 2. Top Header Bar */}
        <header className="h-16 shrink-0 border-b border-slate-200/80 bg-white px-6 flex items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks, people, or projects..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-100/80 text-xs font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition border border-transparent"
            />
          </div>

          {/* Right Action Icons & User Profile */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Bell Icon with dot */}
            <button className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition">
              <Bell className="w-4 h-4" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            </button>

            {/* Help Icon */}
            <button className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100 transition">
              <HelpCircle className="w-4 h-4" />
            </button>

            <div className="h-6 w-[1px] bg-slate-200 mx-1" />

            {/* User Profile */}
            <Link href="/profile" className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 transition">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={userName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500/20"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                  {userInitial}
                </div>
              )}
              <span className="hidden sm:inline text-xs font-bold text-slate-700">
                {userName}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 3. Top Metrics Row (4 Cards Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Active Projects */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Folder className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                  +3 this week
                </span>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">18</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">Active Projects</p>
            </div>

            {/* Card 2: Total Tasks */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600 border border-red-100">
                  28 Due Today
                </span>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">241</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">Total Tasks</p>
            </div>

            {/* Card 3: Team Members */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Users className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                  4 Online
                </span>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">12</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">Team Members</p>
            </div>

            {/* Card 4: Sprint Progress */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                  5 days left
                </span>
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">76%</h3>
              <p className="text-xs font-semibold text-slate-400 mt-1">Sprint Progress</p>
            </div>
          </div>

          {/* Main Dashboard Layout Grid (Left 8 Cols, Right 4 Cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Main Column (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* 4. Active Workspace Showcase Banner */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-sm relative overflow-hidden">
                {/* Top Badge & Avatars */}
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                    ACTIVE
                  </span>

                  {/* Team Avatars */}
                  <div className="flex items-center -space-x-2">
                    <div className="w-7 h-7 rounded-full ring-2 ring-white bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                      JD
                    </div>
                    <div className="w-7 h-7 rounded-full ring-2 ring-white bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                      AK
                    </div>
                    <div className="w-7 h-7 rounded-full ring-2 ring-white bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center">
                      SL
                    </div>
                    <div className="w-7 h-7 rounded-full ring-2 ring-white bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
                      +5
                    </div>
                  </div>
                </div>

                {/* Workspace Title & Description */}
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Product Design Hub
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Centralized space for UI/UX and product strategy
                </p>

                {/* Sub-stats */}
                <div className="flex items-center gap-8 my-5">
                  <div>
                    <span className="text-xl font-extrabold text-slate-900">8</span>
                    <span className="text-xs text-slate-400 ml-2 font-medium">Projects</span>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-200" />
                  <div>
                    <span className="text-xl font-extrabold text-slate-900">42</span>
                    <span className="text-xs text-slate-400 ml-2 font-medium">Tasks</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-6">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">Workspace Progress</span>
                    <span className="text-blue-600 font-bold">65%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full w-[65%]" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/workspaces"
                    className="h-10 px-5 rounded-xl bg-blue-600 text-white font-semibold text-xs flex items-center justify-center hover:bg-blue-700 transition shadow-md shadow-blue-500/20"
                  >
                    Open Workspace
                  </Link>
                  <button
                    type="button"
                    className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                  >
                    Settings
                  </button>
                  <button
                    type="button"
                    className="h-10 px-5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-xs hover:bg-slate-50 transition"
                  >
                    Analytics
                  </button>
                </div>
              </div>

              {/* 5. Middle Charts Row (Productivity & Task Status) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Productivity Bar Chart */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-bold text-slate-800 text-sm">Productivity</h3>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Bars Visual */}
                  <div className="flex items-end gap-3 h-40 pt-4 px-2">
                    {[
                      { day: "MON", height: "30%", active: false },
                      { day: "TUE", height: "45%", active: false },
                      { day: "WED", height: "70%", active: true },
                      { day: "THU", height: "55%", active: false },
                      { day: "FRI", height: "90%", active: true },
                      { day: "SAT", height: "60%", active: false },
                      { day: "SUN", height: "35%", active: false },
                    ].map((item) => (
                      <div key={item.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <div
                          className={`w-full rounded-md transition-all duration-300 ${
                            item.active
                              ? "bg-blue-600 shadow-md shadow-blue-500/20"
                              : "bg-slate-100 hover:bg-slate-200"
                          }`}
                          style={{ height: item.height }}
                        />
                        <span className="text-[10px] font-bold text-slate-400">{item.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task Status Donut Chart */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-800 text-sm">Task Status</h3>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Circular Donut Visual */}
                  <div className="relative w-36 h-36 mx-auto my-3 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-blue-600"
                        strokeDasharray="50, 100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-emerald-500"
                        strokeDasharray="30, 100"
                        strokeDashoffset="-50"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-extrabold text-slate-900 leading-none">241</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">TOTAL</span>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                      Done
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Active
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                      Backlog
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (4 Cols) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition border border-slate-100 group">
                    <PlusCircle className="w-5 h-5 text-slate-500 group-hover:text-blue-600 mb-2" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">New Task</span>
                  </button>

                  <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition border border-slate-100 group">
                    <FolderPlus className="w-5 h-5 text-slate-500 group-hover:text-blue-600 mb-2" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">New Project</span>
                  </button>

                  <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition border border-slate-100 group">
                    <Mail className="w-5 h-5 text-slate-500 group-hover:text-blue-600 mb-2" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Send Invite</span>
                  </button>

                  <button className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition border border-slate-100 group">
                    <Download className="w-5 h-5 text-slate-500 group-hover:text-blue-600 mb-2" />
                    <span className="text-xs font-bold text-slate-700 group-hover:text-blue-600">Export Data</span>
                  </button>
                </div>
              </div>

              {/* Upcoming Deadlines Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-800 text-sm">Upcoming Deadlines</h3>
                  <a href="#" className="text-xs font-bold text-blue-600 hover:underline">
                    View All
                  </a>
                </div>

                <div className="space-y-3">
                  {/* Deadline 1 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-l-red-500 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800">Finalize UI Kit Components</h4>
                    <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
                      <Clock className="w-3.5 h-3.5 text-red-500" />
                      2h left
                    </p>
                  </div>

                  {/* Deadline 2 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-l-blue-500 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800">Client Feedback Implementation</h4>
                    <p className="text-[11px] font-semibold text-slate-500 flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      Tomorrow, 4 PM
                    </p>
                  </div>

                  {/* Deadline 3 */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border-l-4 border-l-slate-300 border border-slate-100">
                    <h4 className="text-xs font-bold text-slate-400 line-through">Sprint 12 Review Deck</h4>
                    <p className="text-[11px] font-semibold text-slate-400 mt-1">
                      Completed
                    </p>
                  </div>
                </div>
              </div>

              {/* AI SUGGESTIONS Card */}
              <div className="bg-indigo-50/70 rounded-3xl p-6 border border-indigo-100 shadow-2xs">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">
                    AI SUGGESTIONS
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Based on your recent activity, the &quot;Product Design Hub&quot; workspace has 4 stagnant tasks. Consider reassigning them or updating the status.
                </p>
                <a
                  href="#"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition mt-4 group"
                >
                  <span>Optimize Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition duration-200" />
                </a>
              </div>

              {/* Recent Activity Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
                <h3 className="font-bold text-slate-800 text-sm mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {/* Activity 1 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-700 leading-snug">
                        <strong className="font-bold text-slate-900">Jordan</strong> completed{" "}
                        <span className="font-semibold text-blue-600">Header Redesign</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">12 mins ago</span>
                    </div>
                  </div>

                  {/* Activity 2 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-700 leading-snug">
                        <strong className="font-bold text-slate-900">Sarah</strong> commented on{" "}
                        <span className="font-semibold text-blue-600">Sprint 12</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">1 hour ago</span>
                    </div>
                  </div>

                  {/* Activity 3 */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-700 leading-snug">
                        <strong className="font-bold text-slate-900">Leo</strong> joined{" "}
                        <span className="font-semibold text-blue-600">UI Team</span>
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">4 hours ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Bottom Page Footer */}
          <footer className="pt-6 border-t border-slate-200/80 text-center text-xs text-slate-400 font-medium">
            Nexus Enterprise Dashboard © 2026 AgileFlow Systems. Minimalist Performance Protocol Active.
          </footer>
        </main>
      </div>
    </div>
  );
}
