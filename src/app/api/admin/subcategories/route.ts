import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/lib/csrf";
import { requireAdmin, isAdminResponse, audit } from "@/lib/admin/auth";
import { subcategorySchema } from "@/lib/validation/admin";

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

    const parsed = subcategorySchema.safeParse(json);
    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { category_id, name } = parsed.data;
    const { data, error } = await ctx.supabase
        .from("subcategories")
        .insert({
            category_id,
            name,
            created_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await audit(ctx.supabase, ctx.userId, "subcategory_create", "subcategories", data.id);
    return NextResponse.json({ subcategory: data }, { status: 201 });
}

export async function PATCH(request: Request) {
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

    const parsed = subcategorySchema.safeParse(json);
    if (!parsed.success || !parsed.data.id) {
        return NextResponse.json({ error: "Invalid subcategory payload" }, { status: 400 });
    }

    const { id, name } = parsed.data;
    const { data, error } = await ctx.supabase
        .from("subcategories")
        .update({ name })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await audit(ctx.supabase, ctx.userId, "subcategory_update", "subcategories", id);
    return NextResponse.json({ subcategory: data });
}

export async function DELETE(request: Request) {
    try {
        assertTrustedOrigin(request);
    } catch {
        const origin = request.headers.get("origin") || "missing";
        return NextResponse.json({ error: `Invalid origin: ${origin}` }, { status: 403 });
    }

    const ctx = await requireAdmin("super_admin");
    if (isAdminResponse(ctx)) return ctx;

    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
        return NextResponse.json({ error: "Subcategory ID required" }, { status: 400 });
    }

    const { error } = await ctx.supabase.from("subcategories").delete().eq("id", id);
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await audit(ctx.supabase, ctx.userId, "subcategory_delete", "subcategories", id);
    return NextResponse.json({ ok: true });
}
