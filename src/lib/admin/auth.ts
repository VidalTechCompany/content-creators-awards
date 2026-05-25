import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/types/database";

export type AdminContext = {
  userId: string;
  role: AdminRole;
  supabase: Awaited<ReturnType<typeof createClient>>;
};

export async function requireAdmin(minRole: AdminRole = "moderator"): Promise<AdminContext | NextResponse> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const role = adminRow.role as AdminRole;
  if (minRole === "super_admin" && role !== "super_admin") {
    return NextResponse.json({ error: "Super admin required" }, { status: 403 });
  }

  return { userId: user.id, role, supabase };
}

export function isAdminResponse(v: AdminContext | NextResponse): v is NextResponse {
  return v instanceof NextResponse;
}

export async function audit(
  supabase: AdminContext["supabase"],
  actorId: string,
  action: string,
  entity: string,
  entityId?: string,
  meta?: Record<string, unknown>,
) {
  await supabase.from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId ?? null,
    meta: meta ?? null,
  });
}
