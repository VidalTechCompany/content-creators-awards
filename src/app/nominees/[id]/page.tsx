import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClientOrNull } from "@/lib/supabase/server";
import Image from "next/image";
import { VoteWithCaptchaButton } from "@/components/voting/vote-with-captcha-button";
import { NomineeLiveVotes } from "@/components/realtime/nominee-live-votes";
import { SocialShareButtons } from "@/components/voting/social-share-buttons";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClientOrNull();
  if (!supabase) return { title: "Nominee" };

  const { data } = await supabase.from("nominees").select("name, bio, image_url, categories(title, slug)").eq("id", id).maybeSingle();

  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  if (!process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV === "production") {
    console.warn("[PRODUCTION WARNING] NEXT_PUBLIC_SITE_URL is not set. Social sharing images may fail.");
  }

  const nomineeUrl = `${site}/nominees/${id}`;
  const title = data?.name ?? "Nominee";
  const description = data?.bio ? data.bio.trim().substring(0, 157) + "..." : "Vote for this nominee in the Content Creators Awards";

  // Safer category extraction
  const rawCat = data?.categories;
  const category = Array.isArray(rawCat) ? rawCat[0] : rawCat;
  const categoryTitle = (category as { title?: string })?.title;

  const imageUrl = data?.image_url || `${site}/og-image.png`;

  return {
    title,
    description,
    openGraph: {
      type: "profile",
      url: nomineeUrl,
      title: `${title} - Content Creators Awards`,
      description: `Vote for ${title}${categoryTitle ? ` in ${categoryTitle}` : ''} at the Content Creators Awards!`,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `Vote for ${title}`,
      description: `Support ${title} in the Content Creators Awards`,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export const revalidate = 30;

export default async function NomineeProfilePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClientOrNull();
  if (!supabase) notFound();

  // Fetch nominee and site settings in parallel for speed
  const [nomineeRes, settingsRes] = await Promise.all([
    supabase
      .from("nominees")
      .select("*, categories (id, slug, title), subcategories (id, name), nominee_stats(vote_count)")
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle(),
    supabase
      .from("site_settings")
      .select("voting_open, voting_deadline")
      .eq("id", 1)
      .maybeSingle()
  ]);

  const nominee = nomineeRes.data;
  const settings = settingsRes.data;

  if (!nominee) notFound();

  // Safe data extraction for production stability
  const category = (Array.isArray(nominee.categories) ? nominee.categories[0] : nominee.categories) as { slug: string; title: string; id: string } | null;

  if (!category) {
    console.error(`[PRODUCTION ERROR] Nominee ${id} is missing an associated category.`);
    notFound();
  }

  const rawSub = nominee.subcategories;
  const subcategory = (Array.isArray(rawSub) ? rawSub[0] : rawSub) as { id: string; name: string } | null;
  const subcategoryId = subcategory?.id ?? null;
  const rawStats = nominee.nominee_stats;
  const initialVotes = Array.isArray(rawStats) ? rawStats[0]?.vote_count ?? 0 : (rawStats as { vote_count: number } | null)?.vote_count ?? 0;
  const socials = (nominee.social_links as Record<string, string>) ?? {};

  // Determine if voting is active based on server-side settings
  const isDeadlinePassed = settings?.voting_deadline
    ? new Date(settings.voting_deadline).getTime() < Date.now()
    : false;

  const canVote = settings?.voting_open !== false && !isDeadlinePassed;

  const verifyNote = isDeadlinePassed
    ? "Voting has ended for this year."
    : settings?.voting_open === false
      ? "Voting is temporarily paused."
      : null;

  return (
    <div className="mx-auto max-w-4xl py-12">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="aspect-square bg-gradient-to-br from-amber-500/25 to-zinc-950 md:aspect-auto md:min-h-[420px]">
            {nominee.image_url && (
              <div className="relative h-full w-full">
                <Image
                  src={nominee.image_url}
                  alt={nominee.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-4 p-8">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-amber-300/80">
                <Link href={`/categories/${category.slug}`} className="hover:text-amber-100">
                  {category.title}
                </Link>
              </p>
              <SocialShareButtons nomineeId={nominee.id} nomineeName={nominee.name} />
            </div>

            <div className="space-y-1">
              <h1 className="font-serif text-4xl text-amber-50">{nominee.known_name || nominee.name}</h1>
              {nominee.known_name && (
                <p className="text-sm text-zinc-400">
                  <span className="font-medium text-zinc-500 uppercase tracking-tight mr-2">Official Name:</span>
                  {nominee.name}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1 border-y border-white/5 py-3">
              <p className="text-sm text-zinc-300"><span className="text-amber-500/50 font-medium">Category:</span> {category.title}</p>
              {subcategory && (
                <p className="text-sm text-zinc-300"><span className="text-amber-500/50 font-medium">SubCategory:</span> {subcategory.name}</p>
              )}
            </div>

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
                subcategoryId={subcategoryId}
                nomineeSubcategoryName={subcategory?.name ?? null}
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
