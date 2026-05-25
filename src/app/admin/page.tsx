import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Vote, Award, Tags, HeartHandshake, ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const revalidate = 300; // Cache admin stats for 5 minutes to handle concurrent admin access

async function StatsGrid() {
  const supabase = await createClient();
  const [{ count: voteCount }, { count: nomineeCount }, { count: categoryCount }, { count: sponsorCount }] =
    await Promise.all([
      supabase.from("votes").select("*", { count: "exact", head: true }),
      supabase.from("nominees").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("sponsors").select("*", { count: "exact", head: true }),
    ]);

  const stats = [
    {
      title: "Total Votes",
      value: voteCount ?? 0,
      icon: Vote,
      color: "text-amber-400",
      bgGlow: "from-amber-500/[0.05]",
    },
    {
      title: "Nominees Registered",
      value: nomineeCount ?? 0,
      icon: Award,
      color: "text-blue-400",
      bgGlow: "from-blue-500/[0.05]",
    },
    {
      title: "Active Categories",
      value: categoryCount ?? 0,
      icon: Tags,
      color: "text-emerald-400",
      bgGlow: "from-emerald-500/[0.05]",
    },
    {
      title: "Event Sponsors",
      value: sponsorCount ?? 0,
      icon: HeartHandshake,
      color: "text-purple-400",
      bgGlow: "from-purple-500/[0.05]",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className="group relative overflow-hidden border border-white/[0.06] bg-zinc-900/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:shadow-xl hover:shadow-black/30">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGlow} to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-xs font-semibold tracking-wider uppercase text-zinc-400 group-hover:text-zinc-300 transition-colors">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 bg-white/[0.02] border border-white/[0.04] ${stat.color} transition-colors group-hover:bg-white/[0.05]`}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                  {stat.value.toLocaleString()}
                </p>
                <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
                  <ArrowUpRight className="h-3.5 w-3.5" />
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
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.04] bg-zinc-900/20 p-6 backdrop-blur-md">
        <div className="relative z-10">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            System Overview
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400 max-w-xl">
            Real-time metric streams and structural data points managing the active voting engine.
          </p>
        </div>
        <div className="absolute right-0 top-0 -z-10 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl" />
      </div>

      {/* Analytics Grid */}
      <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full bg-zinc-900/40 rounded-xl" />)}
      </div>}>
        <StatsGrid />
      </Suspense>
    </div>
  );
}