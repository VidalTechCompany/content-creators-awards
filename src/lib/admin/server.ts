import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/types/database";
import { cache } from "react";
import { unstable_cache } from "next/cache";

/**
 * Fetches the current user's admin role, leveraging React's cache to deduplicate
 * database calls within the same request.
 * @returns The AdminRole if the user is an admin, otherwise null.
 */
export const getAdminRole = cache(async () => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Wrap the DB query in a persistent cache
  return unstable_cache(
    async (userId: string) => {
      const { data: adminRow } = await supabase
        .from("admins")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();
      return adminRow?.role as AdminRole | null;
    },
    [`admin-role-${user.id}`],
    {
      revalidate: 600, // Cache for 10 minutes
      tags: [`user-${user.id}`]
    }
  )(user.id);
});