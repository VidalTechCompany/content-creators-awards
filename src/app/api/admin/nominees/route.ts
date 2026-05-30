import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/lib/csrf";
import { requireAdmin, isAdminResponse, audit } from "@/lib/admin/auth";
import { nomineeSchema } from "@/lib/validation/admin";
import { slugify } from "@/lib/slug";
import { type SupabaseClient } from "@supabase/supabase-js";

async function generateUniqueNomineeSlug(supabase: SupabaseClient, categoryId: string, baseSlug: string) {
  const slugBase = baseSlug || `nominee`;
  let slug = slugBase;
  let index = 1;

  while (true) {
    const { data, error } = await supabase
      .from("nominees")
      .select("id")
      .eq("category_id", categoryId)
      .eq("slug", slug)
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

export async function GET(request: Request) {
  const ctx = await requireAdmin();
  if (isAdminResponse(ctx)) return ctx;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");

  let query = ctx.supabase
    .from("nominees")
    .select("*, categories(title, slug), nominee_stats(vote_count)")
    .order("created_at", { ascending: false });

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ nominees: data });
}

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
  } catch {
    const origin = request.headers.get("origin") || "missing";
    return NextResponse.json({ error: `Invalid origin: ${origin}` }, { status: 403 });
  }

  const ctx = await requireAdmin();
  if (isAdminResponse(ctx)) return ctx;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = nomineeSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const baseSlug = slugify(parsed.data.slug ?? parsed.data.name) || `nominee`;
  const slug = await generateUniqueNomineeSlug(ctx.supabase, parsed.data.category_id, baseSlug);
  const social = parsed.data.social_links ?? {};

  const { data, error } = await ctx.supabase
    .from("nominees")
    .insert({
      category_id: parsed.data.category_id,
      subcategory_id: parsed.data.subcategory_id ?? null,
      name: parsed.data.name,
      known_name: parsed.data.known_name ?? null,
      slug,
      bio: parsed.data.bio ?? null,
      image_url: parsed.data.image_url ?? null,
      social_links: social,
      status: parsed.data.status ?? "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await ctx.supabase.from("nominee_stats").upsert({ nominee_id: data.id, vote_count: 0 });
  await audit(ctx.supabase, ctx.userId, "nominee_create", "nominees", data.id);
  return NextResponse.json({ nominee: data }, { status: 201 });
}
