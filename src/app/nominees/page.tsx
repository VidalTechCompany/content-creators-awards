import Link from "next/link";
import type { Metadata } from "next";
import { createClientOrNull } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nominees",
  description: "Discover approved nominees across every category.",
};

export const revalidate = 30;

export default async function NomineesPage() {
  const supabase = await createClientOrNull();
  const { data: nominees } = supabase
    ? await supabase
      .from("nominees")
      .select("id, name, slug, bio, image_url, categories (title, slug)")
      .eq("status", "approved")
      .order("name")
    : { data: [] as never[] };

  return (
    <div className="mx-auto max-w-6xl py-12">
      <h1 className="font-serif text-4xl text-amber-50">Nominees</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-400">
        Every profile links to voting-ready pages with realtime totals.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {(nominees ?? []).map((n: Record<string, unknown>) => {
          const cat = n.categories as { title: string; slug: string } | null;
          return (
            <Link
              key={String(n.id)}
              href={`/nominees/${String(n.id)}`}
              className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:border-amber-500/40"
            >
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-500/20 to-zinc-900">
                {n.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={String(n.image_url)} alt={String(n.name)} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-amber-300/80">{cat?.title}</p>
                <h2 className="font-serif text-xl text-amber-50">{String(n.name)}</h2>
                {n.bio ? <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{String(n.bio)}</p> : null}
                {cat ? <p className="mt-2 text-xs text-zinc-600">Category: {cat.title}</p> : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
