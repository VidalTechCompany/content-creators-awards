import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/lib/csrf";
import { requireAdmin, isAdminResponse, audit } from "@/lib/admin/auth";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Params) {
  try {
    assertTrustedOrigin(request);
  } catch {
    const origin = request.headers.get("origin") || "missing";
    return NextResponse.json({ error: `Invalid origin: ${origin}` }, { status: 403 });
  }

  // Require Super Admin to delete subcategories
  const ctx = await requireAdmin("super_admin");
  if (isAdminResponse(ctx)) return ctx;

  try {
    const { id } = await params;
    const { error } = await ctx.supabase.from("subcategories").delete().eq("id", id);

    if (error) throw error;

    await audit(ctx.supabase, ctx.userId, "subcategory_delete", "subcategories", id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[SUBCATEGORIES_DELETE]", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}