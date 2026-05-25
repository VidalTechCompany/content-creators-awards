import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClientOrNull } from "@/lib/supabase/server";
import { VoteWithCaptchaButton } from "@/components/voting/vote-with-captcha-button";
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
    .select("*, nominee_stats(vote_count)")
    .eq("category_id", category.id)
    .eq("status", "approved")
    .order("name");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canVote = false;
  let verifyNote: string | null = null;
  if (!user) verifyNote = "Log in to vote";
  else if (!user.email_confirmed_at) verifyNote = "Verify your email to vote";
  else canVote = true;

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
          const name = String(n.name);
          const bio = n.bio ? String(n.bio) : "";
          const imageUrl = n.image_url ? String(n.image_url) : null;
          const socials = (n.social_links as Record<string, string>) ?? {};

          return (
            <div
              key={id}
              className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/30 backdrop-blur-md"
            >
              <div className="aspect-[16/9] w-full bg-gradient-to-br from-amber-500/15 to-zinc-900">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imageUrl} alt={name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/nominees/${id}`} className="font-serif text-xl text-amber-50 hover:text-amber-200">
                      {name}
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
                  nomineeName={name}
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
