import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/types/database";
import { cache } from "react";

/**
 * Fetches the current user's admin role, leveraging React's cache to deduplicate
 * database calls within the same request.
 * @returns The AdminRole if the user is an admin, otherwise null.
 */
export const getAdminRole = cache(async () => {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log("[getAdminRole] getUser result:", { user: user?.email, userError });
  if (!user) return null;

  console.log("[getAdminRole] Querying database for admin role for userId:", user.id);
  const { data: adminRow, error: dbError } = await supabase
    .from("admins")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  console.log("[getAdminRole] DB Query result:", { adminRow, dbError });
  return (adminRow?.role as AdminRole | null) ?? null;
});