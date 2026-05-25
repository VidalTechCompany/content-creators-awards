import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClientOrNull } from "@/lib/supabase/server";
import { VoteWithCaptchaButton } from "@/components/voting/vote-with-captcha-button";
import { NomineeLiveVotes } from "@/components/realtime/nominee-live-votes";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClientOrNull();
  if (!supabase) return { title: "Nominee" };
  const { data } = await supabase.from("nominees").select("name, bio").eq("id", id).maybeSingle();
  return {
    title: data?.name ?? "Nominee",
    description: data?.bio ?? undefined,
  };
}

export const revalidate = 30;

export default async function NomineeProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClientOrNull();
  if (!supabase) notFound();

  const { data: nominee } = await supabase
    .from("nominees")
    .select("*, categories (id, slug, title), nominee_stats(vote_count)")
    .eq("id", id)
    .eq("status", "approved")
    .maybeSingle();

  if (!nominee) notFound();

  const category = nominee.categories as { id: string; slug: string; title: string };
  const stats = nominee.nominee_stats as { vote_count: number } | { vote_count: number }[] | null;
  const initialVotes = Array.isArray(stats) ? stats[0]?.vote_count ?? 0 : stats?.vote_count ?? 0;
  const socials = (nominee.social_links as Record<string, string>) ?? {};

  const {
    data: { user },
  } = await supabase.auth.getUser();
  let canVote = false;
  let verifyNote: string | null = null;
  if (!user) verifyNote = "Log in to vote";
  else if (!user.email_confirmed_at) verifyNote = "Verify your email to vote";
  else canVote = true;

  return (
    <div className="mx-auto max-w-4xl py-12">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="aspect-square bg-gradient-to-br from-amber-500/25 to-zinc-950 md:aspect-auto md:min-h-[420px]">
            {nominee.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={nominee.image_url} alt={nominee.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
          <div className="flex flex-col gap-4 p-8">
            <p className="text-xs uppercase tracking-widest text-amber-300/80">
              <Link href={`/categories/${category.slug}`} className="hover:text-amber-100">
                {category.title}
              </Link>
            </p>
            <h1 className="font-serif text-4xl text-amber-50">{nominee.name}</h1>
            <NomineeLiveVotes nomineeId={nominee.id} initial={initialVotes} />
            {nominee.bio ? <p className="text-sm leading-relaxed text-zinc-300">{nominee.bio}</p> : null}
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(socials).map(([k, v]) =>
                v ? (
                  <a
                    key={k}
                    href={v}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 px-3 py-1 text-amber-100/90 hover:border-amber-500/40"
                  >
                    {k}
                  </a>
                ) : null,
              )}
            </div>
            <div className="mt-auto pt-4">
              <VoteWithCaptchaButton
                categoryId={category.id}
                nomineeId={nominee.id}
                nomineeName={nominee.name}
                canVote={canVote}
                verifyNote={verifyNote}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
