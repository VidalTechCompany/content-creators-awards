import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClientOrNull } from "@/lib/supabase/server";
import { VoteWithCaptchaButton } from "@/components/voting/vote-with-captcha-button";
import Image from "next/image";
import { NomineeLiveVotes } from "@/components/realtime/nominee-live-votes";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClientOrNull();
  if (!supabase) return { title: "Category" };
  const { data } = await supabase.from("categories").select("title").eq("slug", slug).maybeSingle();
  return { title: data?.title ?? "Category" };
}

export const revalidate = 30;

export default async function CategoryDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClientOrNull();
  if (!supabase) notFound();

  const { data: category } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
  if (!category) notFound();

  const { data: nominees } = await supabase
    .from("nominees")
    .select("*, subcategories(name), nominee_stats(vote_count)")
    .eq("category_id", category.id)
    .eq("status", "approved")
    .order("name");

  await supabase.auth.getUser();

  // Transitioning to anonymous voting: 
  // Authentication is no longer a prerequisite for the UI button.
  const canVote = true;
  const verifyNote: string | null = null;

  return (
    <div className="mx-auto max-w-6xl py-12">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-widest text-amber-300/80">{category.section}</p>
        <h1 className="mt-2 font-serif text-4xl text-amber-50">{category.title}</h1>
        {category.description ? <p className="mt-3 text-zinc-400">{category.description}</p> : null}
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {(nominees ?? []).map((n: Record<string, unknown>) => {
          const stats = n.nominee_stats as { vote_count: number } | { vote_count: number }[] | null;
          const count = Array.isArray(stats) ? stats[0]?.vote_count ?? 0 : stats?.vote_count ?? 0;
          const id = String(n.id);
          const officialName = String(n.name);
          const knownName = n.known_name ? String(n.known_name) : officialName;
          const rawSub = n.subcategories;
          const subcategoryName = Array.isArray(rawSub) ? rawSub[0]?.name : (rawSub as Record<string, unknown>)?.name;
          const bio = n.bio ? String(n.bio) : "";
          const imageUrl = n.image_url ? String(n.image_url) : null;
          const socials = (n.social_links as Record<string, string>) ?? {};

          return (
            <div
              key={id}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/30 backdrop-blur-md"
            >
              <div className="aspect-[16/9] w-full bg-gradient-to-br from-amber-500/15 to-zinc-900">
                {imageUrl && (
                  <div className="relative h-full w-full">
                    <Image
                      src={imageUrl}
                      alt={knownName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    {subcategoryName && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500/60">{subcategoryName}</span>
                    )}
                    <Link href={`/nominees/${id}`} className="font-serif text-xl text-amber-50 hover:text-amber-200">
                      {knownName}
                    </Link>
                    <NomineeLiveVotes nomineeId={id} initial={count} />
                  </div>
                </div>
                {bio ? <p className="line-clamp-3 text-sm text-zinc-400">{bio}</p> : null}
                <div className="mt-auto flex flex-wrap gap-2 text-xs">
                  {Object.entries(socials).map(([k, v]) =>
                    v ? (
                      <a
                        key={k}
                        href={v}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/10 px-2 py-1 text-amber-100/90 hover:border-amber-500/40"
                      >
                        {k}
                      </a>
                    ) : null,
                  )}
                </div>
                <VoteWithCaptchaButton
                  categoryId={category.id}
                  nomineeId={id}
                  nomineeName={knownName}
                  canVote={canVote}
                  verifyNote={verifyNote}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
