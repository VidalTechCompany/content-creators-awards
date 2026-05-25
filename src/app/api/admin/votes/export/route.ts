import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: adminRow } = await supabase.from("admins").select("role").eq("user_id", user.id).maybeSingle();
  if (!adminRow) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createServiceClient();
  const { data: votes, error } = await admin
    .from("votes")
    .select("id, created_at, ip_address, user_id, category_id, nominee_id")
    .order("created_at", { ascending: false })
    .limit(20000);

  if (error) {
    console.error(error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }

  const header = ["id", "created_at", "ip_address", "user_id", "category_id", "nominee_id"];
  const lines = [header.join(",")];
  for (const row of votes ?? []) {
    lines.push(
      [
        row.id,
        row.created_at,
        row.ip_address ?? "",
        row.user_id,
        row.category_id,
        row.nominee_id,
      ]
        .map((v) => `"${String(v).replaceAll('"', '""')}"`)
        .join(","),
    );
  }

  const csv = lines.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="votes-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
