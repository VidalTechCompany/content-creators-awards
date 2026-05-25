import Link from "next/link";
// Render as a plain server component for faster page load.
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownHero } from "@/components/home/countdown-hero";
import { APP_NAME } from "@/lib/constants";

export function HeroSection({ deadlineIso }: { deadlineIso: string | null }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_55%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center md:pt-24">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-amber-200/90">
            <Sparkles className="h-3.5 w-3.5" />
            Official public voting
          </div>
          <h1 className="mt-6 bg-gradient-to-b from-amber-100 via-amber-300 to-amber-700 bg-clip-text font-serif text-4xl font-semibold leading-tight text-transparent sm:text-6xl md:text-7xl">
            {APP_NAME}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
            A premium, secure platform celebrating creators across TikTok, YouTube, Instagram, podcasts, and beyond —
            with verified voters, audit trails, and live results.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/categories">Explore categories</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/about">How it works</Link>
            </Button>
          </div>
        </div>

        <CountdownHero deadlineIso={deadlineIso} />
      </div>
    </section>
  );
}
