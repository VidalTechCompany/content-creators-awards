import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/lib/csrf";
import { requireAdmin, isAdminResponse, audit } from "@/lib/admin/auth";
import { categorySchema } from "@/lib/validation/admin";
import { slugify } from "@/lib/slug";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertTrustedOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ctx = await requireAdmin("super_admin");
  if (isAdminResponse(ctx)) return ctx;

  const { id } = await params;
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = categorySchema.partial().safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const patch: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.title && !parsed.data.slug) patch.slug = slugify(parsed.data.title);

  const { data, error } = await ctx.supabase.from("categories").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(ctx.supabase, ctx.userId, "category_update", "categories", id);
  return NextResponse.json({ category: data });
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
  const { error } = await ctx.supabase.from("categories").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(ctx.supabase, ctx.userId, "category_delete", "categories", id);
  return NextResponse.json({ ok: true });
}
