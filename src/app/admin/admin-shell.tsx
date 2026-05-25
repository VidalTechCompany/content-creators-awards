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
  ArrowLeft
} from "lucide-react";

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

          {/* Header Profile Info */}
          <div className="relative mb-6 overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/[0.07] to-transparent p-4 border border-amber-500/[0.15]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              System Operator
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-200 capitalize">
              {role.replace("_", " ")}
            </p>
            <div className="absolute -right-2 -top-2 h-12 w-12 rounded-full bg-amber-500/10 blur-xl" />
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

                  <Icon className={cn(
                    "h-4 w-4 transition-transform duration-300 group-hover:scale-110",
                    active ? "text-amber-400" : "text-zinc-500 group-hover:text-zinc-300"
                  )} />

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
              <ArrowLeft className="h-3 w-3 transition-transform duration-200 group-hover:-translate-x-1" />
              <span>Exit to Live Site</span>
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