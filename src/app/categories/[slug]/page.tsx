import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClientOrNull } from "@/lib/supabase/server";
import { VoteWithCaptchaButton } from "@/components/voting/vote-with-captcha-button";
import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { NomineeLiveVotes } from "@/components/realtime/nominee-live-votes";

type Props = {
  params: Promise<{ slug: string }>
};

// Types for better type safety
interface NomineeStats {
  vote_count: number;
}

interface Subcategory {
  name: string;
  id: string;
}

interface Nominee {
  id: string;
  name: string;
  known_name: string | null;
  bio: string | null;
  image_url: string | null;
  social_links: Record<string, string> | null;
  status: string;
  category_id: string;
  subcategories: Subcategory | Subcategory[] | null;
  nominee_stats: NomineeStats | NomineeStats[] | null;
}

// Category type is inherited from Supabase rows where needed; explicit local interface removed to avoid unused type warning.

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { slug } = await params;
    const supabase = await createClientOrNull();

    if (!supabase) {
      return { title: "Category Not Found" };
    }

    const { data: category, error } = await supabase
      .from("categories")
      .select("title, description")
      .eq("slug", slug)
      .maybeSingle();

    if (error || !category) {
      return { title: "Category Not Found" };
    }

    return {
      title: `${category.title} | Content Creators Awards`,
      description: category.description || `Vote for your favorite nominees in the ${category.title} category`
    };
  } catch (error) {
    console.error("Metadata generation error:", error);
    return { title: "Category | Content Creators Awards" };
  }
}

export const revalidate = 30;

export default async function CategoryDetailPage({ params }: Props) {
  try {
    const { slug } = await params;

    // Validate slug
    if (!slug || typeof slug !== 'string') {
      console.error("Invalid slug parameter:", slug);
      notFound();
    }

    const supabase = await createClientOrNull();

    if (!supabase) {
      console.error("Failed to create Supabase client");
      notFound();
    }

    // Fetch category with better error handling
    const { data: category, error: categoryError } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (categoryError) {
      console.error("Category fetch error:", categoryError);
      notFound();
    }

    if (!category) {
      console.log(`Category not found for slug: ${slug}`);
      notFound();
    }

    // Check if category is active
    if (category.status !== 'active' && category.status !== 'approved') {
      console.log(`Category ${category.slug} is not active (status: ${category.status})`);
      notFound();
    }

    // Fetch nominees with proper error handling
    const { data: rawNominees, error: nomineesError } = await supabase
      .from("nominees")
      .select(`
        *,
        subcategories:subcategories (
          id,
          name
        ),
        nominee_stats:nominee_stats (
          vote_count
        )
      `)
      .eq("category_id", category.id)
      .eq("status", "approved")
      .order("name", { ascending: true });

    if (nomineesError) {
      console.error("Nominees fetch error:", nomineesError);
      // Don't return 404, just show empty state
    }

    // Process nominees to ensure consistent data structure
    const raw = Array.isArray(rawNominees) ? rawNominees : [];
    const nominees: Nominee[] = raw.map((item) => {
      const nomineeRecord = item as Record<string, unknown>;

      const subcategories = nomineeRecord.subcategories;
      const nominee_stats = nomineeRecord.nominee_stats;

      return {
        id: String(nomineeRecord.id),
        name: String(nomineeRecord.name ?? ""),
        known_name: nomineeRecord.known_name === null ? null : String(nomineeRecord.known_name || ""),
        bio: nomineeRecord.bio === null ? null : String(nomineeRecord.bio || ""),
        image_url: nomineeRecord.image_url === null ? null : String(nomineeRecord.image_url || ""),
        social_links: (nomineeRecord.social_links as Record<string, string> | null) ?? {},
        status: String(nomineeRecord.status ?? "pending"),
        category_id: String(nomineeRecord.category_id || ""),
        subcategories: Array.isArray(subcategories)
          ? (subcategories[0] as Subcategory) || null
          : (subcategories as Subcategory) || null,
        nominee_stats: Array.isArray(nominee_stats)
          ? (nominee_stats[0] as NomineeStats) || null
          : (nominee_stats as NomineeStats) || null,
      };
    });

    // Get user authentication status (optional for voting)
    const { data: { user } } = await supabase.auth.getUser();
    const canVote = true; // Anonymous voting enabled
    const verifyNote = user ? null : "You're voting as a guest. Your vote is anonymous but tracked for fraud prevention.";

    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        {/* Category Header */}
        <div className="max-w-3xl">
          {category.section && (
            <p className="text-xs uppercase tracking-widest text-amber-300/80">
              {category.section}
            </p>
          )}
          <h1 className="mt-2 font-serif text-4xl text-amber-50">
            {category.title}
          </h1>
          {category.description && (
            <p className="mt-3 text-zinc-400">
              {category.description}
            </p>
          )}
        </div>

        {/* Nominees Grid */}
        {!nominees || nominees.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="text-amber-50/60 text-lg">
              No nominees have been approved for this category yet.
            </div>
            <p className="text-zinc-500 mt-2">
              Check back soon for updates!
            </p>
          </div>
        ) : (
          <>
            <div className="mt-2 text-sm text-zinc-500 mb-6">
              {nominees.length} {nominees.length === 1 ? 'Nominee' : 'Nominees'}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {nominees.map((nominee: Nominee) => {
                // Safely extract vote count
                let voteCount = 0;
                const stats = nominee.nominee_stats;
                if (stats) {
                  if (Array.isArray(stats)) {
                    voteCount = stats[0]?.vote_count ?? 0;
                  } else {
                    voteCount = stats.vote_count ?? 0;
                  }
                }

                const id = nominee.id;
                const officialName = nominee.name;
                const knownName = nominee.known_name || officialName;

                // Safely extract subcategory name
                let subcategoryName = null;
                const rawSub = nominee.subcategories;
                if (rawSub) {
                  if (Array.isArray(rawSub) && rawSub.length > 0) {
                    subcategoryName = rawSub[0].name;
                  } else if (rawSub && typeof rawSub === 'object' && 'name' in rawSub) {
                    subcategoryName = (rawSub as Subcategory).name;
                  }
                }

                const bio = nominee.bio || "";
                const imageUrl = nominee.image_url;
                const socials = nominee.social_links || {};

                return (
                  <div
                    key={id}
                    className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-xl shadow-black/30 backdrop-blur-md transition-all hover:scale-[1.02] hover:border-amber-500/30"
                  >
                    {/* Image Section */}
                    <div className="aspect-[16/9] w-full bg-gradient-to-br from-amber-500/15 to-zinc-900 relative">
                      {imageUrl ? (
                        <div className="relative h-full w-full">
                          <ImageWithFallback
                            src={imageUrl}
                            alt={knownName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            fallbackSrc="/placeholder-nominee.jpg"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-amber-500/30">
                          <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 5h16v14H4V5zm2 2v10h12V7H6zm2 2h8v6H8V9z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          {subcategoryName && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500/60">
                              {subcategoryName}
                            </span>
                          )}
                          <Link
                            href={`/nominees/${id}`}
                            className="font-serif text-xl text-amber-50 hover:text-amber-200 transition-colors block mt-1"
                          >
                            {knownName}
                          </Link>
                          <div className="mt-2">
                            <NomineeLiveVotes
                              nomineeId={id}
                              initial={voteCount}
                            />
                          </div>
                        </div>
                      </div>

                      {bio && (
                        <p className="line-clamp-3 text-sm text-zinc-400">
                          {bio}
                        </p>
                      )}

                      {/* Social Links */}
                      {Object.keys(socials).length > 0 && (
                        <div className="mt-auto flex flex-wrap gap-2 text-xs">
                          {Object.entries(socials).map(([platform, url]) => {
                            if (!url || typeof url !== 'string') return null;
                            const platformName = platform.replace(/_/g, ' ').toLowerCase();
                            return (
                              <a
                                key={platform}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-full border border-white/10 px-3 py-1.5 text-amber-100/90 hover:border-amber-500/40 hover:bg-amber-500/10 transition-all"
                              >
                                {platformName}
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {/* Vote Button */}
                      <div className="mt-4">
                        <VoteWithCaptchaButton
                          categoryId={category.id}
                          nomineeId={id}
                          nomineeName={knownName}
                          canVote={canVote}
                          verifyNote={verifyNote}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Voting Info Footer */}
        <div className="mt-12 text-center text-xs text-zinc-500 border-t border-white/10 pt-6">
          <p>Your vote helps creators get recognized for their work.</p>
          <p className="mt-1">Votes are verified for fairness and counted in real-time.</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error("CategoryDetailPage error:", error);
    notFound();
  }
}