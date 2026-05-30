import { Suspense } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, Award, Tags, HeartHandshake, ArrowUpRight, Users } from "lucide-react";
import { getAdminRole } from "@/lib/admin/server";

export const revalidate = 0; // Disable cache to ensure admin sees real-time data from the DB

// Define metrics configuration to remove hard-coded table queries and UI mapping from component logic
const METRICS_CONFIG = [
  { key: "votes", table: "votes", title: "Total Votes", icon: Vote, color: "text-amber-400", bgGlow: "from-amber-500/[0.05]" },
  { key: "nominees", table: "nominees", title: "Nominees Registered", icon: Award, color: "text-blue-400", bgGlow: "from-blue-500/[0.05]" },
  { key: "categories", table: "categories", title: "Active Categories", icon: Tags, color: "text-emerald-400", bgGlow: "from-emerald-500/[0.05]" },
  { key: "sponsors", table: "sponsors", title: "Event Sponsors", icon: HeartHandshake, color: "text-purple-400", bgGlow: "from-purple-500/[0.05]" },
  { key: "users", table: "profiles", title: "System Users", icon: Users, color: "text-zinc-400", bgGlow: "from-zinc-500/[0.05]" },
];

const DASHBOARD_STRINGS = {
  status: "System Live",
  title: "System Overview",
  description: "Operational command center monitoring real-time metric streams and structural data points for the active voting engine.",
};

async function StatsGrid() {
  const supabase = await createClient();
  const statsData: Record<string, number> = {};

  try {
    const results = await Promise.all(
      METRICS_CONFIG.map(m => supabase.from(m.table).select("*", { count: "exact", head: true }))
    );

    METRICS_CONFIG.forEach((m, i) => {
      statsData[m.key] = results[i].count ?? 0;
    });
  } catch (error) {
    console.error("Failed to fetch admin statistics:", error);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {METRICS_CONFIG.map((metric) => {
        const Icon = metric.icon;
        const value = statsData[metric.key] ?? 0;
        return (
          <Card key={metric.title} className="group relative overflow-hidden border border-white/[0.06] bg-zinc-900/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/30">
            <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgGlow} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-zinc-300 transition-colors">
                {metric.title}
              </CardTitle>
              <div className={`rounded-lg p-2 bg-white/[0.02] border border-white/[0.04] ${metric.color} transition-colors group-hover:bg-white/[0.05]`}>
                <Icon aria-hidden="true" className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                  {value.toLocaleString()}
                </p>
                <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                  <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default async function AdminHomePage() {
  const supabase = await createClient();

  // Safely fetch user and role with error checking for higher robustness
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const role = await getAdminRole();

  const user = userData?.user;
  if (userError) console.error("Admin identity verification error:", userError);

  const displayRole = role ? role.replace(/_/g, " ") : "Administrator";
  const userName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.email?.split('@')[0] ?? "Operator";

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <header className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-8 backdrop-blur-md shadow-2xl shadow-black/20 transition-all duration-500">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className={cn("h-1.5 w-1.5 rounded-full animate-pulse", user && !userError ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500")} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80">{DASHBOARD_STRINGS.status}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            Welcome back, <span className="text-amber-400">{userName}</span>
          </h1>
          <p className="mt-2 text-sm text-zinc-400 max-w-xl leading-relaxed">
            You are managing the system as <span className="capitalize text-amber-500/90 font-semibold">{displayRole}</span>. {DASHBOARD_STRINGS.description}
          </p>
        </div>
        <div className="absolute right-0 top-0 -z-10 h-32 w-32 rounded-full bg-amber-500/[0.08] blur-3xl" />
      </header>

      {/* Analytics Grid - Optimized Fallback to prevent Layout Shift */}
      <Suspense fallback={
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[...Array(METRICS_CONFIG.length)].map((_, i) => (
            <div
              key={i}
              className="h-32 w-full rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-6 animate-pulse"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="h-2 w-24 rounded-full bg-white/10" />
                  <div className="h-8 w-16 rounded-lg bg-white/10" />
                </div>
                <div className="h-8 w-8 rounded-lg bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      }>
        <StatsGrid />
      </Suspense>
    </div>
  );
}