import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/lib/csrf";
import { requireAdmin, isAdminResponse, audit } from "@/lib/admin/auth";
import { updateNomineeSchema } from "@/lib/validation/admin";
import { slugify } from "@/lib/slug";
import type { SupabaseClient } from "@supabase/supabase-js";

type Params = { params: Promise<{ id: string }> };

async function generateUniqueNomineeSlug(supabase: SupabaseClient, categoryId: string, baseSlug: string, currentId?: string) {
  const slugBase = baseSlug || `nominee`;
  let slug = slugBase;
  let index = 1;

  while (true) {
    const { data, error } = await supabase
      .from("nominees")
      .select("id")
      .eq("category_id", categoryId)
      .eq("slug", slug)
      .neq("id", currentId)
      .limit(1);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return slug;
    }

    slug = `${slugBase}-${index++}`;
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    assertTrustedOrigin(request);
  } catch {
    const origin = request.headers.get("origin") || "missing";
    return NextResponse.json({ error: `Invalid origin: ${origin}` }, { status: 403 });
  }

  // Require Super Admin for permanent deletion
  const ctx = await requireAdmin("super_admin");
  if (isAdminResponse(ctx)) return ctx;

  try {
    const { id } = await params;
    const { error } = await ctx.supabase
      .from("nominees")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await audit(ctx.supabase, ctx.userId, "nominee_delete", "nominees", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[NOMINEES_DELETE]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    assertTrustedOrigin(request);
  } catch {
    const origin = request.headers.get("origin") || "missing";
    return NextResponse.json({ error: `Invalid origin: ${origin}` }, { status: 403 });
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

  const parsed = updateNomineeSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data: currentNominee, error: currentError } = await ctx.supabase
    .from("nominees")
    .select("id, slug, category_id")
    .eq("id", id)
    .single();

  if (currentError || !currentNominee) {
    return NextResponse.json({ error: currentError?.message || "Nominee not found" }, { status: 404 });
  }

  const categoryId = parsed.data.category_id ?? currentNominee.category_id;
  const updatePayload: Record<string, unknown> = { ...parsed.data };

  if (parsed.data.name || parsed.data.slug) {
    const baseSlug = slugify(parsed.data.slug ?? parsed.data.name ?? currentNominee.slug) || `nominee`;
    updatePayload.slug = await generateUniqueNomineeSlug(ctx.supabase, categoryId, baseSlug, id);
  }

  if (parsed.data.subcategory_id === "") {
    updatePayload.subcategory_id = null;
  }

  const { data, error } = await ctx.supabase
    .from("nominees")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await audit(ctx.supabase, ctx.userId, "nominee_update", "nominees", id);
  return NextResponse.json({ nominee: data });
}