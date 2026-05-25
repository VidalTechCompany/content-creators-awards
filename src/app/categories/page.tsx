import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { createClientOrNull } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Molo ni Nyumbani Award",
  description: "Browse every category in the Molo ni Nyumbani Award.",
};

export const revalidate = 60;

export default async function CategoriesPage() {
  const supabase = await createClientOrNull();
  const { data: categories } = supabase
    ? await supabase.from("categories").select("*").order("sort_order", { ascending: true })
    : { data: [] as never[] };

  return (
    <div className="relative isolate overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute left-1/2 top-0 -z-10 h-[300px] w-full -translate-x-1/2 bg-amber-500/5 blur-[120px]" />

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

        {/* Categories Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(categories ?? []).map((c: { id: string; slug: string; title: string; section: string; description: string | null }) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-zinc-900/40 p-6 shadow-xl shadow-black/30 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-amber-500/30 hover:shadow-[0_20px_50px_rgba(251,191,36,0.1)]"
            >
              {/* Ambient hover light effect */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-amber-500/[0.03] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <p className="text-xs uppercase tracking-widest text-amber-300/80 transition-colors group-hover:text-amber-200">
                {c.section}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-amber-50 transition-colors group-hover:text-amber-400">
                {c.title}
              </h2>
              {c.description ? (
                <p className="mt-3 text-sm leading-relaxed text-zinc-400 transition-colors group-hover:text-zinc-300">
                  {c.description}
                </p>
              ) : null}
              <p className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-amber-200/80 transition-colors group-hover:text-amber-400">
                View Nominees <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
