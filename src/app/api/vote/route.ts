import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { voteRequestSchema } from "@/lib/validation/vote";
import { assertTrustedOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { VOTE_COOLDOWN_SEC } from "@/lib/constants";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return request.headers.get("x-real-ip");
}

async function verifyTurnstile(token: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  // Dev bypass logic as described in README
  if (!secret && process.env.NODE_ENV !== "production") return true;
  if (!secret) {
    console.error("[VOTE_API] CAPTCHA Error: TURNSTILE_SECRET_KEY is not defined.");
    return false;
  }
  if (!token) {
    console.error("[VOTE_API] CAPTCHA Error: No response token provided by client.");
    return false;
  }

  const params = new URLSearchParams({
    secret: secret,
    response: token,
  });
  if (ip) params.append("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json();
    if (!data.success) {
      console.error("[VOTE_API] Turnstile verification failed. Error codes:", data["error-codes"]);
    }
    return data.success;
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
  } catch {
    const origin = request.headers.get("origin") || "missing";
    return NextResponse.json({ error: `Invalid origin: ${origin}` }, { status: 403 });
  }

  const ip = clientIp(request) ?? "0.0.0.0";
  if (!rateLimit(`vote:${ip}`, 25, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = voteRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Extract captchaToken from raw JSON as it may be missing from the Zod schema
  const captchaToken = (json as { captchaToken?: string })?.captchaToken ?? "";

  if (!captchaToken) {
    console.error("[VOTE_API] CAPTCHA Error: No token found in request body. Received keys:", Object.keys(json as object));
  }

  const { categoryId, nomineeId, fingerprint } = parsed.data;

  // 1. CAPTCHA Protection
  // Verifies the user is human before proceeding with heavy DB operations
  const isHuman = await verifyTurnstile(captchaToken, ip);
  if (!isHuman) {
    return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: "Email verification required before voting" }, { status: 403 });
  }

  const ua = request.headers.get("user-agent") ?? "";

  const admin = createServiceClient();

  // 2. Global System Checks (Deadline and Toggle)
  const { data: settings } = await admin.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (settings && settings.voting_open === false) {
    return NextResponse.json({ error: "Voting is closed" }, { status: 403 });
  }
  if (settings?.voting_deadline) {
    const deadline = new Date(settings.voting_deadline);
    if (deadline.getTime() < Date.now()) {
      return NextResponse.json({ error: "Voting deadline has passed" }, { status: 403 });
    }
  }

  const { data: nominee, error: nomErr } = await admin
    .from("nominees")
    .select("id, category_id, status")
    .eq("id", nomineeId)
    .maybeSingle();

  if (nomErr || !nominee || nominee.status !== "approved" || nominee.category_id !== categoryId) {
    return NextResponse.json({ error: "Invalid nominee or category" }, { status: 400 });
  }

  // 3. Device Fingerprinting check 
  // Prevents "account farming" where one person uses 10 emails on the same laptop.
  const { count: fingerprintCount } = await admin
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .eq("fingerprint", fingerprint);

  if ((fingerprintCount ?? 0) > 0) {
    return NextResponse.json({ error: "This device has already been used to vote in this category" }, { status: 409 });
  }

  const { data: profile } = await admin.from("profiles").select("last_vote_at").eq("id", user.id).maybeSingle();
  if (profile?.last_vote_at) {
    const delta = (Date.now() - new Date(profile.last_vote_at).getTime()) / 1000;
    if (delta < VOTE_COOLDOWN_SEC) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(VOTE_COOLDOWN_SEC - delta)}s between votes` },
        { status: 429 },
      );
    }
  }

  const { count: ipBurst } = await admin
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  if ((ipBurst ?? 0) > 40) {
    await admin.from("suspicious_activity").insert({
      user_id: user.id,
      reason: "high_ip_volume",
      meta: { ip, count: ipBurst },
    });
  }

  const { error: voteError } = await admin.from("votes").insert({
    user_id: user.id,
    category_id: categoryId,
    nominee_id: nomineeId,
    ip_address: ip,
    user_agent: ua.slice(0, 512),
    fingerprint: fingerprint.slice(0, 512),
  });

  if (voteError) {
    if (voteError.code === "23505") {
      return NextResponse.json({ error: "You have already voted in this category" }, { status: 409 });
    }
    console.error(voteError);
    return NextResponse.json({ error: "Could not record vote" }, { status: 500 });
  }

  await admin.from("profiles").update({ last_vote_at: new Date().toISOString() }).eq("id", user.id);

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "vote_cast",
    entity: "votes",
    entity_id: nomineeId,
    meta: { categoryId },
  });

  return NextResponse.json({ ok: true });
}
