import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/lib/csrf";
import { requireAdmin, isAdminResponse, audit } from "@/lib/admin/auth";
import { categorySchema } from "@/lib/validation/admin";
import { slugify } from "@/lib/slug";

export async function GET() {
  const ctx = await requireAdmin();
  if (isAdminResponse(ctx)) return ctx;

  const { data, error } = await ctx.supabase
    .from("categories")
    .select("*, subcategories(id, name, category_id)")
    .order("sort_order");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ categories: data });
}

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ctx = await requireAdmin("super_admin");
  if (isAdminResponse(ctx)) return ctx;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = categorySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const slug = parsed.data.slug ?? slugify(parsed.data.title);
  const { data, error } = await ctx.supabase
    .from("categories")
    .insert({
      title: parsed.data.title,
      section: parsed.data.section,
      slug,
      description: parsed.data.description ?? null,
      sort_order: parsed.data.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await audit(ctx.supabase, ctx.userId, "category_create", "categories", data.id);
  return NextResponse.json({ category: data }, { status: 201 });
}
