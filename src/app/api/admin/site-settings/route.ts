import { z } from "zod";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertTrustedOrigin } from "@/lib/csrf";

const schema = z.object({
  voting_open: z.boolean().optional(),
  voting_deadline: z.union([z.string(), z.null()]).optional(),
});

export async function PATCH(request: Request) {
  try {
    assertTrustedOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (typeof parsed.data.voting_open === "boolean") patch.voting_open = parsed.data.voting_open;
  if (parsed.data.voting_deadline !== undefined) {
    if (parsed.data.voting_deadline === null) {
      patch.voting_deadline = null;
    } else {
      const ts = Date.parse(parsed.data.voting_deadline);
      if (Number.isNaN(ts)) {
        return NextResponse.json({ error: "Invalid deadline" }, { status: 400 });
      }
      patch.voting_deadline = new Date(ts).toISOString();
    }
  }

  const { error } = await supabase.from("site_settings").update(patch).eq("id", 1);
  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
