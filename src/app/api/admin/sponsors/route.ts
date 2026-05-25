import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/lib/csrf";
import { requireAdmin, isAdminResponse, audit } from "@/lib/admin/auth";
import { sponsorSchema } from "@/lib/validation/admin";

export async function GET() {
  const ctx = await requireAdmin();
  if (isAdminResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase.from("sponsors").select("*").order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sponsors: data });
}

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ctx = await requireAdmin();
  if (isAdminResponse(ctx)) return ctx;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = sponsorSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await ctx.supabase
    .from("sponsors")
    .insert({
      name: parsed.data.name,
      logo_url: parsed.data.logo_url ?? null,
      website_url: parsed.data.website_url ?? null,
      tier: parsed.data.tier ?? "partner",
      sort_order: parsed.data.sort_order ?? 0,
      active: parsed.data.active ?? true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await audit(ctx.supabase, ctx.userId, "sponsor_create", "sponsors", data.id);
  return NextResponse.json({ sponsor: data }, { status: 201 });
}
