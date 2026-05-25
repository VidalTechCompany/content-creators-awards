import { NextResponse } from "next/server";
import { assertTrustedOrigin } from "@/lib/csrf";
import { requireAdmin, isAdminResponse } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
  } catch {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ctx = await requireAdmin();
  if (isAdminResponse(ctx)) return ctx;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  const nomineeId = form.get("nomineeId");
  if (!(file instanceof File) || typeof nomineeId !== "string" || !nomineeId) {
    return NextResponse.json({ error: "file and nomineeId required" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const path = `${nomineeId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const admin = createServiceClient();
  const { error: uploadError } = await admin.storage.from("nominee-images").upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) {
    console.error(uploadError);
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: pub } = admin.storage.from("nominee-images").getPublicUrl(path);

  const { error: updateError } = await ctx.supabase
    .from("nominees")
    .update({ image_url: pub.publicUrl })
    .eq("id", nomineeId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ url: pub.publicUrl });
}
