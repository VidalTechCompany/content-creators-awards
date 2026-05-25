import { NextResponse } from "next/server";
import { requireAdmin, isAdminResponse } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const ctx = await requireAdmin();
  if (isAdminResponse(ctx)) return ctx;

  const { data: profiles, error: profileError } = await ctx.supabase
    .from("profiles")
    .select("id, display_name, last_vote_at, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });

  const admin = createServiceClient();
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ perPage: 500 });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });

  const emailById = new Map(authData.users.map((u) => [u.id, u.email ?? ""]));

  const ids = (profiles ?? []).map((p) => p.id);
  const { data: voteRows } = await admin.from("votes").select("user_id").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const voteCounts = new Map<string, number>();
  for (const row of voteRows ?? []) {
    voteCounts.set(row.user_id, (voteCounts.get(row.user_id) ?? 0) + 1);
  }

  const users = (profiles ?? []).map((p) => ({
    ...p,
    email: emailById.get(p.id) ?? "",
    vote_count: voteCounts.get(p.id) ?? 0,
  }));

  return NextResponse.json({ users });
}
