import { NomineesManager } from "@/components/admin/nominees-manager";
import { getAdminRole } from "@/lib/admin/server";
import { createClient } from "@/lib/supabase/server";

export default async function AdminNomineesPage() {
  // Initialize client once
  const [supabase, role] = await Promise.all([
    createClient(),
    getAdminRole()
  ]);

  // Fetch data with error handling to prevent the whole page from crashing
  let categories = [];
  let nominees = [];

  try {
    const [catRes, nomRes] = await Promise.allSettled([
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase
        .from("nominees")
        .select("*, categories (title, slug), nominee_stats(vote_count)")
        .order("name"),
    ]);

    if (catRes.status === 'fulfilled' && !catRes.value.error) {
      categories = catRes.value.data ?? [];
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
      <NomineesManager role={role} initialCategories={categories} initialNominees={nominees} />
    </div>
  );
}
