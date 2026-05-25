import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/home/hero-section";
import { FeaturedNominees } from "@/components/home/featured-nominees";
import { createClientOrNull } from "@/lib/supabase/server";
import { Skeleton } from "@/components/ui/skeleton";

export const revalidate = 3600; // Cache for 1 hour. Drastically reduces DB load during high traffic.

async function FeaturedSection() {
  const supabase = await createClientOrNull();
  if (!supabase) {
    return null;
  }

  const { data: stats } = await
    supabase.from("nominee_stats").select("nominee_id, vote_count").order("vote_count", { ascending: false }).limit(6);

  if (stats && stats.length > 0) {
    const ids = stats.map((s) => s.nominee_id).filter(Boolean);
    if (ids.length > 0) {
      const { data: nom } = await supabase.from("nominees").select("*").in("id", ids).eq("status", "approved");
      const order = new Map(ids.map((id, idx) => [id, idx]));
      const featured = (nom ?? []).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      return <FeaturedNominees nominees={featured} />;
    }
  }
  return null;
}

export default async function HomePage() {
  const supabase = await createClientOrNull();

  const [settingsResult, sponsorsResult] = await Promise.all([
    supabase ? supabase.from("site_settings").select("voting_deadline").eq("id", 1).maybeSingle() : Promise.resolve({ data: null }),
    supabase ? supabase.from("sponsors").select("id, name, website_url").eq("active", true).order("sort_order") : Promise.resolve({ data: [] })
  ]);

  const settings = settingsResult?.data;
  const sponsors = (sponsorsResult?.data as any[]) ?? [];

  return (
    <div>
      <HeroSection deadlineIso={settings?.voting_deadline ?? null} />

      <section className="relative mx-auto max-w-6xl px-4 py-24">
        <div className="absolute left-1/2 top-0 -z-10 h-[300px] w-full -translate-x-1/2 bg-amber-500/5 blur-[120px]" />

        <div className="flex items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div>
            <h2 className="font-serif text-4xl text-amber-50 tracking-tight">Featured Nominees</h2>
            <p className="mt-2 text-zinc-400 italic">Spotlighting the top creators currently leading the charts.</p>
          </div>
          <Button asChild variant="outline" className="border-amber-500/20 bg-amber-500/5 text-amber-200 hover:bg-amber-500/10">
            <Link href="/nominees">Explore all nominees</Link>
          </Button>
        </div>
        <div className="mt-12">
          <Suspense fallback={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full bg-zinc-800/50 rounded-xl" />)}
          </div>}>
            <FeaturedSection />
          </Suspense>
        </div>
      </section>

      <section className="border-y border-white/10 bg-black/40 py-14">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="font-serif text-2xl text-amber-50">Proud partners</h2>
          <p className="mt-2 text-sm text-zinc-500">Thank you to our sponsors for powering this celebration.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 opacity-90">
            {sponsors.length ? (
              sponsors.map((s) => (
                <div key={s.id} className="text-sm font-medium text-zinc-300">
                  {s.website_url ? (
                    <a href={s.website_url} className="hover:text-amber-200" target="_blank" rel="noreferrer">
                      {s.name}
                    </a>
                  ) : (
                    s.name
                  )}
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-600">Add sponsors in Supabase or the admin dashboard.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center">
        <h2 className="font-serif text-3xl text-amber-50">Ready to make your voice heard?</h2>
        <p className="mx-auto mt-3 max-w-xl text-zinc-400">
          Create a verified account, complete email confirmation, and vote with enterprise-grade anti-fraud
          protections.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/auth/signup">Create account</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/categories">Browse categories</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
