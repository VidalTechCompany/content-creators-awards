import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { createClientOrNull } from "@/lib/supabase/server";
import type { CategoryRow } from "@/types/database";

type CategoryWithSubs = CategoryRow & {
  subcategories: { name: string }[];
};

export default async function CategoriesPage() {
  const supabase = await createClientOrNull();

  // Handle case when supabase client fails to initialize
  if (!supabase) {
    console.error("Failed to initialize Supabase client");
    return (
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
          <div className="text-center">
            <h1 className="font-serif text-5xl font-bold text-amber-50 sm:text-6xl">
              Molo ni Nyumbani Award
            </h1>
            <p className="mt-4 text-lg text-red-400">
              Unable to load categories. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch categories with error handling
  let categories: CategoryWithSubs[] = [];
  let fetchError = null;

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, slug, title, section, description, status, sort_order, subcategories(name)")
      .filter("status", "in", '("active","approved")') // Cleaner syntax for multiple statuses
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("title", { ascending: true });

    if (error) {
      console.error("Supabase categories fetch error:", error);
      fetchError = error.message;
    } else {
      // Supabase returns an array or null; coerce safely to our typed shape
      categories = Array.isArray(data) ? (data as unknown as CategoryWithSubs[]) : [];
    }
  } catch (err) {
    console.error("Unexpected error fetching categories:", err);
    fetchError = "Failed to fetch categories";
  }

  return (
    <div className="relative isolate overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute left-1/2 top-0 -z-10 h-[300px] w-full -translate-x-1/2 bg-amber-500/5 blur-[120px]" />
      <div className="absolute bottom-0 right-0 -z-10 h-[200px] w-[200px] bg-amber-500/5 blur-[100px]" />

      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
          {/* Header */}
          <div>
            <h1 className="bg-gradient-to-b from-amber-100 via-amber-300 to-amber-700 bg-clip-text font-serif text-5xl font-bold tracking-tight text-transparent sm:text-6xl">
              Molo ni Nyumbani Award
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-zinc-400 md:mx-0">
              Explore every section, meet the nominees, and cast your verified vote once per category.
            </p>
          </div>
          <Badge variant="outline" className="border-amber-500/20 bg-amber-500/5 px-4 py-2 text-sm text-amber-200">
            Secure Voting
          </Badge>
        </div>

        {/* Error State */}
        {fetchError && (
          <div className="mt-8 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-center">
            <p className="text-red-400">Error loading categories: {fetchError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-amber-400 hover:text-amber-300"
            >
              Click to retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!fetchError && categories.length === 0 && (
          <div className="mt-16 text-center py-12">
            <div className="text-amber-50/60 text-lg">
              No categories available at the moment.
            </div>
            <p className="text-zinc-500 mt-2">
              Check back soon for updated award categories!
            </p>
          </div>
        )}

        {/* Categories Grid */}
        {categories.length > 0 && (
          <>
            <div className="mt-4 text-center text-sm text-zinc-500">
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'} Available
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                // Safely get subcategories for this category
                const subcategories = (category.subcategories || []).map(s => s.name);

                return (
                  <Link
                    key={category.id}
                    href={`/categories/${category.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-500/30 hover:shadow-[0_20px_50px_rgba(251,191,36,0.1)]"
                  >
                    {/* Ambient hover light effect */}
                    <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-500/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Category Section Badge */}
                    <p className="text-xs uppercase tracking-widest text-amber-300/80 transition-colors group-hover:text-amber-200">
                      {category.section || "General"}
                    </p>

                    {/* Category Title */}
                    <h2 className="mt-2 font-serif text-2xl font-semibold text-amber-50 transition-colors group-hover:text-amber-400 line-clamp-2">
                      {category.title}
                    </h2>

                    {/* Category Description */}
                    {category.description && (
                      <p className="mt-3 text-sm leading-relaxed text-zinc-400 transition-colors group-hover:text-zinc-300 line-clamp-3">
                        {category.description}
                      </p>
                    )}

                    {/* Subcategories Section */}
                    {subcategories.length > 0 && (
                      <div className="mt-5 space-y-3 rounded-3xl border border-amber-500/10 bg-amber-500/5 p-4 text-sm text-zinc-300 shadow-sm shadow-black/10">
                        <p className="text-xs uppercase tracking-[0.24em] text-amber-300/80">
                          Subcategories ({subcategories.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {subcategories.slice(0, 6).map((sub) => (
                            <span
                              key={sub}
                              className="inline-flex items-center rounded-full border border-white/10 bg-zinc-950/80 px-3 py-1 text-xs text-zinc-200"
                            >
                              {sub}
                            </span>
                          ))}
                          {subcategories.length > 6 && (
                            <span className="inline-flex items-center rounded-full border border-white/10 bg-zinc-950/80 px-3 py-1 text-xs text-zinc-400">
                              +{subcategories.length - 6} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Call to Action */}
                    <p className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-amber-200/80 transition-colors group-hover:text-amber-400">
                      View Nominees
                      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">
                        →
                      </span>
                    </p>
                  </Link>
                );
              })}
            </div>
          </>
        )}

        {/* Footer Info */}
        <div className="mt-16 text-center text-xs text-zinc-500 border-t border-white/10 pt-6">
          <p>Each category allows one verified vote per device. Voting is secure and anonymous.</p>
          <p className="mt-1">Questions? Contact our support team.</p>
        </div>
      </div>
    </div>
  );
}