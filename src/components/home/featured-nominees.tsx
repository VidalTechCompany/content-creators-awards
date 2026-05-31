// Server-rendered featured nominees list to reduce bundle size.
import Link from "next/link";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { Button } from "@/components/ui/button";
import type { NomineeRow } from "@/types/database";

export function FeaturedNominees({ nominees }: { nominees: NomineeRow[] }) {
  if (!nominees.length) {
    return (
      <p className="text-center text-sm text-zinc-500">
        Nominees will appear here once published in Supabase.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {nominees.map((n) => (
        <div key={n.id}>
          <Link href={`/nominees/${n.id}`}>
            <div className="group overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3 shadow-xl shadow-black/30 backdrop-blur-md transition hover:border-amber-500/40">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-gradient-to-br from-amber-500/20 to-zinc-900">
                {n.image_url ? (
                  <ImageWithFallback
                    src={n.image_url}
                    alt={n.name}
                    fill // Image fills the parent container
                    className="object-cover transition duration-500 group-hover:scale-105"
                    fallbackSrc="/placeholder-nominee.jpg"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Optimize image loading for different screen sizes
                  // Note: If Supabase URLs are external, you'll need to configure
                  // `images.remotePatterns` in `next.config.js` for optimization
                  // to work automatically. Otherwise, images will be served unoptimized.
                  // If using a custom loader for Supabase, it would go here.
                  />
                ) : null}
              </div>
              <h3 className="mt-2 font-serif text-base text-amber-50">{n.name}</h3>
              <p className="line-clamp-2 text-xs text-zinc-400">{n.bio}</p>
              <Button variant="ghost" size="sm" className="mt-1 h-auto py-1 px-0 text-amber-200">
                View profile →
              </Button>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
