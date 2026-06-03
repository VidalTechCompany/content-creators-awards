import Link from "next/link";
import type { Metadata } from "next";
import { createClientOrNull } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Live leaderboard powered by Supabase Realtime aggregates.",
};

export const revalidate = 15;

type StatRow = {
  nominee_id: string;
  vote_count: number;
  nominees: {
    name: string;
    image_url: string | null;
    categories: { title: string; slug: string } | null;
  } | null;
};

export default async function LeaderboardPage() {
  const supabase = await createClientOrNull();
  const { data: stats } = supabase
    ? await supabase
        .from("nominee_stats")
        .select("nominee_id, vote_count, nominees(name, image_url, categories(title, slug))")
        .order("vote_count", { ascending: false })
        .limit(25)
    : { data: [] as StatRow[] };

  const rows = (stats ?? []) as StatRow[];

  return (
    <div className="mx-auto max-w-4xl py-12">
      <h1 className="font-serif text-4xl text-amber-50">Leaderboard</h1>
      <div className="mt-2 flex items-center gap-2 text-sm text-zinc-400">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
        </span>
        <p>Live standings. Vote counts are automatically updated and verified for integrity.</p>
      </div>
      <ol className="mt-8 space-y-3">
        {rows.map((row, idx) => {
          const nom = row.nominees;
          return (
            <li
              key={row.nominee_id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-zinc-500">#{idx + 1}</span>
                <div>
                  <p className="font-medium text-amber-50">{nom?.name ?? "Nominee"}</p>
                  <p className="text-xs text-zinc-500">{nom?.categories?.title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-amber-200">{Number(row.vote_count).toLocaleString()}</p>
                {nom?.categories?.slug ? (
                  <Link href={`/categories/${nom.categories.slug}`} className="text-xs text-amber-300/80 hover:underline">
                    View category
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
