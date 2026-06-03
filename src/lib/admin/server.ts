import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/types/database";

/**
 * Fetches the current user's admin role for the current request.
 * Avoid caching across requests so auth state cannot leak between users.
 * @returns The AdminRole if the user is an admin, otherwise null.
 */
export async function getAdminRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  return (adminRow?.role as AdminRole | null) ?? null;
}