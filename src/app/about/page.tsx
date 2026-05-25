import { ShieldCheck, Trophy, Users, Zap, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 86400; // Static content, cache for 24 hours

export default function AboutPage() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Verified Voting",
      description: "Our enterprise-grade verification system ensures one vote per person, eliminating bots and fraudulent activity.",
      color: "text-amber-400",
    },
    {
      icon: Zap,
      title: "Real-time Analytics",
      description: "Watch the leaderboard shift in real-time as the community voices their choice for the year's best creators.",
      color: "text-blue-400",
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "From niche micro-influencers to global icons, the power is entirely in the hands of the audience.",
      color: "text-emerald-400",
    },
    {
      icon: Trophy,
      title: "Premium Standards",
      description: "A prestigious platform built to honor the hard work, creativity, and impact of digital storytelling.",
      color: "text-purple-400",
    },
  ];

  return (
    <div className="relative isolate overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-full -translate-x-1/2 bg-amber-500/5 blur-[120px]" />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:py-20">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="bg-gradient-to-b from-amber-100 via-amber-300 to-amber-700 bg-clip-text font-serif text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
            Celebrating the <br /> Digital Frontier
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-zinc-400">
            The Content Creators Awards is a premier digital recognition platform.
            We believe that every pixel of creativity deserves a stage, and every
            voice in the community deserves to be heard securely.
          </p>
        </div>

        {/* Mission Grid */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-5 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/20"
              >
                <div className={`mb-3 inline-flex rounded-lg bg-white/[0.03] p-2 ${feature.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-zinc-100">{feature.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* How it Works / Trust Section */}
        <div className="mt-16 rounded-3xl border border-white/[0.06] bg-gradient-to-br from-zinc-900/80 to-black/80 p-6 md:p-12 backdrop-blur-xl">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="font-serif text-4xl text-amber-50">Our Commitment to Integrity</h2>
              <p className="mt-4 text-zinc-400">
                In an era of digital manipulation, we stand for authenticity. Our platform uses a multi-layered approach to protect the sanctity of your vote:
              </p>

              <ul className="mt-6 space-y-2">
                {[
                  "Email verification required for all participants",
                  "Advanced bot-detection and IP rate limiting",
                  "Immutable audit trails for final results",
                  "Transparent category guidelines and judging criteria"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="h-5 w-5 text-amber-500/60" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative aspect-video lg:aspect-square max-w-sm mx-auto lg:ml-auto w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-800/50">
              {/* Visual Placeholder for an image or graphic */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-transparent to-transparent opacity-40" />
              <div className="flex h-full flex-col items-center justify-center p-12 text-center">
                <ShieldCheck className="h-16 w-16 text-amber-400/20 mb-4" />
                <p className="text-xs uppercase tracking-[0.2em] text-amber-400/40">Secure Ecosystem</p>
                <div className="mt-6 space-y-2 w-full">
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-amber-500/20" />
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full w-4/5 bg-amber-500/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="font-serif text-3xl text-zinc-100">Ready to cast your vote?</h2>
          <p className="mt-2 text-zinc-400 italic">Support your favorite creators today.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="rounded-full px-8">
              <Link href="/categories">Explore Categories</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-white/10">
              <Link href="/auth/signup">Join the Community</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}