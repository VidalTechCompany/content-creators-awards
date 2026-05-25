import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/lib/csrf";
import { requireAdmin, isAdminResponse, audit } from "@/lib/admin/auth";
import { nomineeSchema } from "@/lib/validation/admin";
import { slugify } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertTrustedOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ctx = await requireAdmin();
  if (isAdminResponse(ctx)) return ctx;

  const { id } = await params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = nomineeSchema.partial().safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (parsed.data.category_id) patch.category_id = parsed.data.category_id;
  if (parsed.data.name) patch.name = parsed.data.name;
  if (parsed.data.bio !== undefined) patch.bio = parsed.data.bio;
  if (parsed.data.image_url !== undefined) patch.image_url = parsed.data.image_url;
  if (parsed.data.social_links) patch.social_links = parsed.data.social_links;
  if (parsed.data.status) patch.status = parsed.data.status;
  if (parsed.data.slug) patch.slug = parsed.data.slug;
  else if (parsed.data.name) patch.slug = slugify(parsed.data.name);

  const { data, error } = await ctx.supabase.from("nominees").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(ctx.supabase, ctx.userId, "nominee_update", "nominees", id, patch);
  return NextResponse.json({ nominee: data });
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    assertTrustedOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ctx = await requireAdmin("super_admin");
  if (isAdminResponse(ctx)) return ctx;

  const { id } = await params;
  const { error } = await ctx.supabase.from("nominees").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(ctx.supabase, ctx.userId, "nominee_delete", "nominees", id);
  return NextResponse.json({ ok: true });
}
