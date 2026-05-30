import { NomineesManager } from "@/components/admin/nominees-manager";
import { getAdminRole } from "@/lib/admin/server";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AdminRole, CategoryRow, NomineeRow } from "@/types/database";

export default async function AdminNomineesPage() {
  // Initialize client once
  const [supabase, role] = await Promise.all([
    createClient(),
    getAdminRole(),
  ]);

  if (!role) redirect("/auth/login?next=/admin");
  const adminRole = role as AdminRole;

  // Initialize with proper types to match NomineesManager expectations
  let categories: CategoryRow[] = [];
  let nominees: (NomineeRow & {
    categories: { title: string; slug: string } | null;
    subcategories: { name: string } | null;
    nominee_stats: { vote_count: number } | null;
  })[] = [];

  try {
    const [catRes, nomRes] = await Promise.allSettled([
      supabase
        .from("categories")
        .select("*, subcategories(id, name, category_id)")
        .order("sort_order", { ascending: true }),
      supabase
        .from("nominees")
        .select("*, categories (title, slug), subcategories (name), nominee_stats(vote_count)")
        .order("name"),
    ]);

    if (catRes.status === 'fulfilled' && !catRes.value.error) {
      categories = (catRes.value.data as CategoryRow[]) ?? [];
    }

    if (nomRes.status === 'fulfilled' && !nomRes.value.error) {
      nominees = nomRes.value.data ?? [];
    }
  } catch (error) {
    console.error("Supabase connection failed:", error);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-3xl text-amber-50">Nominees</h1>
        <p className="mt-2 text-sm text-zinc-400">Create nominees, upload images, and approve submissions.</p>
      </div>
      <NomineesManager role={adminRole} initialCategories={categories} initialNominees={nominees} />
    </div>
  );
}
