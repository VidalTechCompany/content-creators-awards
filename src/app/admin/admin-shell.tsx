"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { AdminRole } from "@/types/database";
import {
  LayoutDashboard,
  Tags,
  Award,
  HeartHandshake,
  Users,
  Vote,
  ShieldAlert,
  Settings,
  ArrowLeft,
  UserCircle2,
  LogOut
} from "lucide-react";

// Centralized configuration to remove hard-coded UI strings and identity labels
const ADMIN_SHELL_CONFIG = {
  identityLabel: "Authorized Admin",
  logoutLabel: "Sign Out",
  exitLabel: "Exit to Live Site",
};

// Helper for role presentation to keep the render block clean
const formatAdminRole = (role: string) => role.replace(/_/g, " ");

// Added specific Lucide icons for visual context and creative depth
const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/nominees", label: "Nominees", icon: Award },
  { href: "/admin/sponsors", label: "Sponsors", icon: HeartHandshake },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/votes", label: "Votes", icon: Vote },
  { href: "/admin/suspicious", label: "Suspicious", icon: ShieldAlert },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminShell({ role, children }: { role: AdminRole; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-900 text-zinc-100 selection:bg-amber-500/30 selection:text-amber-200">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-1/2 -z-10 h-[150px] w-full max-w-7xl -translate-x-1/2 bg-gradient-to-b from-amber-500/10 to-transparent blur-3xl" />

      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 md:flex-row lg:px-8">

        {/* Sidebar Container */}
        <aside className="md:w-72 md:sticky md:top-8 md:self-start rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl transition-all duration-300 hover:border-white/[0.1]">

          {/* Refined Admin Identity Card */}
          <div className="relative mb-8 group">
            <div className="relative overflow-hidden rounded-2xl bg-zinc-950/40 p-4 border border-white/[0.08] transition-all duration-300 group-hover:border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 text-amber-500 border border-amber-500/20 group-hover:from-amber-500/30 transition-all duration-500">
                  <UserCircle2 className="h-6 w-6" />
                  <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-zinc-950"></span>
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-500/60 leading-none mb-1">{ADMIN_SHELL_CONFIG.identityLabel}</p>
                  <p className="text-sm font-bold text-zinc-100 capitalize truncate tracking-tight leading-none">{formatAdminRole(role)}</p>
                </div>

                {/* Actionable Profile Settings / Logout trigger */}
                <button
                  type="button"
                  aria-label={ADMIN_SHELL_CONFIG.logoutLabel}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
              <div className="absolute -right-6 -bottom-6 h-20 w-20 rounded-full bg-amber-500/[0.03] blur-2xl group-hover:bg-amber-500/[0.08] transition-all duration-700" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {nav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300",
                    active
                      ? "bg-gradient-to-r from-amber-500/15 to-amber-500/[0.02] text-amber-200 border border-amber-500/20"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-100 border border-transparent"
                  )}
                >
                  {/* Left Indicator bar on active */}
                  {active && (
                    <span className="absolute left-0 top-1/3 h-1/3 w-[3px] rounded-r-full bg-amber-400" />
                  )}

                  <Icon
                    aria-hidden="true"
                    className={cn(
                      "h-4 w-4 transition-transform duration-300 group-hover:scale-110 will-change-transform",
                      active ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"
                    )}
                  />

                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer Area */}
          <div className="mt-6 border-t border-white/[0.06] pt-4">
            <Link
              href="/"
              className="group flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-500 transition-colors duration-200 hover:text-amber-400"
            >
              <ArrowLeft aria-hidden="true" className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-1 will-change-transform" />
              <span>{ADMIN_SHELL_CONFIG.exitLabel}</span>
            </Link>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 bg-zinc-900/20 border border-white/[0.04] rounded-2xl p-6 shadow-sm backdrop-blur-md">
          {children}
        </main>

      </div>
    </div>
  );
}