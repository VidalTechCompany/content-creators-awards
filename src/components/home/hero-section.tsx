import Link from "next/link";
import { Sparkles, Award, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CountdownHero } from "@/components/home/countdown-hero";
import { APP_NAME } from "@/lib/constants";

export function HeroSection({ deadlineIso }: { deadlineIso: string | null }) {
  return (
    <section className="relative overflow-hidden border-b border-white/10">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.18),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden">
        <div className="relative mt-12 h-[420px] w-full max-w-6xl overflow-hidden rounded-[2rem] opacity-80">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.24),_transparent_30%),radial-gradient(circle_at_80%_22%,rgba(56,189,248,0.18),_transparent_34%)]" />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-sky-400/10 to-violet-500/10" />
          <div className="absolute inset-0 blur-3xl">
            <svg viewBox="0 0 1200 420" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="heroGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="heroSky" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
              <rect x="0" y="0" width="1200" height="420" fill="url(#heroSky)" opacity="0.08" />
              <path d="M430 330c24-22 62-36 98-36s74 14 98 36" stroke="#ffffff" strokeWidth="8" strokeLinecap="round" opacity="0.14" fill="none" />
              <path d="M430 348c26-28 68-44 110-44s84 16 110 44" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.1" fill="none" />
              <circle cx="200" cy="96" r="14" fill="#ffffff" opacity="0.16" />
              <circle cx="980" cy="86" r="16" fill="#ffffff" opacity="0.14" />
              <circle cx="720" cy="66" r="12" fill="#ffffff" opacity="0.12" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-black/20 mix-blend-overlay" />
        </div>
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-16 text-center md:pt-24">
        {/* MP Badge - Message from Hon. Francis Kuria Kimani */}
        <div className="mb-6 inline-flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-600/10 px-4 py-1.5 text-xs uppercase tracking-[0.2em] text-amber-200/90 backdrop-blur-sm">
            <Award className="h-3.5 w-3.5" />
            Message from Your Molo MP
          </div>
          <div className="mt-2 max-w-2xl rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-6 backdrop-blur-sm">
            <p className="text-lg font-medium text-amber-200/90">
              📢 Molo Creators, This Is Your Moment!
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              Sponsored By <span className="font-semibold text-amber-300">Hon FCPA Francis Kuria Kimani Foundation</span>
            </p>
            <div className="mt-4 border-l-2 border-amber-500/40 pl-4 italic text-zinc-300">
              <p>
                &quot;A premium, secure platform celebrating creators across TikTok, YouTube, Instagram, podcasts, and beyond – 
                with verified voters, audit trails, and live results.&quot;
              </p>
            </div>
            <p className="mt-3 text-sm font-medium text-amber-300">
              That&apos;s the Molo Content Creators Awards.
            </p>
          </div>
        </div>

        {/* Main Headline */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-amber-200/90">
            <Sparkles className="h-3.5 w-3.5" />
            Official public voting
          </div>
          <h1 className="mt-6 bg-gradient-to-b from-amber-100 via-amber-300 to-amber-700 bg-clip-text font-serif text-4xl font-semibold leading-tight text-transparent sm:text-6xl md:text-7xl">
            {APP_NAME}
          </h1>
        </div>

        {/* Three Key Messages */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-sm">
            <Users className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-zinc-300">Your talent</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-sm">
            <Shield className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-zinc-300">Your platform</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-sm">
            <Award className="h-4 w-4 text-amber-400" />
            <span className="text-sm text-zinc-300">Your time</span>
          </div>
        </div>

        {/* Description */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-zinc-400">
          TikTokers, YouTubers, influencers, podcasters – <span className="text-amber-300">Molo sees you.</span>
        </p>

        {/* Call to Action */}
        <div className="mt-4">
          <p className="text-md text-zinc-500">
            Let&apos;s show Kenya what we&apos;ve got.
          </p>
        </div>

        {/* Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700">
            <Link href="/categories">Vote Now</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/about">How it works</Link>
          </Button>
        </div>

        {/* Stats / Social Proof */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-zinc-500">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Verified Voters</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Audit Trails</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Live Results</span>
          </div>
        </div>

        {/* Countdown Timer */}
        <CountdownHero deadlineIso={deadlineIso} />
      </div>
    </section>
  );
}