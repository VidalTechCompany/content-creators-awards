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
    const origin = request.headers.get("origin") || request.headers.get("referer") || "missing";
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
    console.error("[VOTE_API] Request validation failed:", parsed.error.format());
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { categoryId, nomineeId, fingerprint, captchaToken } = parsed.data;

  // 1. CAPTCHA Protection
  // Verifies the user is human before proceeding with heavy DB operations
  const isHuman = await verifyTurnstile(captchaToken, ip);
  if (!isHuman) {
    console.error(`[VOTE_API] 403 Forbidden: CAPTCHA verification failed for IP ${ip}`);
    return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 403 });
  }

  const supabase = await createClient();

  // Support for manual Authorization header as an alternative to cookies
  const authHeader = request.headers.get("Authorization");
  const jwtToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;

  // Authentication is now optional to allow "direct" voting from shared links
  const { data: authData } = await supabase.auth.getUser(jwtToken);
  const user = authData?.user;
  const userId = user?.id;

  const ua = request.headers.get("user-agent") ?? "";

  const admin = createServiceClient();

  // 2. Global System Checks (Deadline and Toggle)
  const { data: settings } = await admin.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (settings && settings.voting_open === false) {
    console.warn("[VOTE_API] 403 Forbidden: Voting is currently toggled OFF in settings.");
    return NextResponse.json({ error: "Voting is closed" }, { status: 403 });
  }
  if (settings?.voting_deadline) {
    const deadline = new Date(settings.voting_deadline);
    if (deadline.getTime() < Date.now()) {
      console.warn("[VOTE_API] 403 Forbidden: Voting deadline has passed.");
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

  // Cooldown check only applies to registered users to prevent botting via session switching. 
  // Guests are already throttled by IP and Fingerprint.
  if (userId) {
    const { data: profile } = await admin.from("profiles").select("last_vote_at").eq("id", userId).maybeSingle();
    if (profile?.last_vote_at) {
      const delta = (Date.now() - new Date(profile.last_vote_at).getTime()) / 1000;
      if (delta < VOTE_COOLDOWN_SEC) {
        return NextResponse.json(
          { error: `Please wait ${Math.ceil(VOTE_COOLDOWN_SEC - delta)}s between votes` },
          { status: 429 },
        );
      }
    }
  }

  const { count: ipBurst } = await admin
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  if ((ipBurst ?? 0) > 40) {
    await admin.from("suspicious_activity").insert({
      user_id: userId ?? null,
      reason: "high_ip_volume",
      meta: { ip, count: ipBurst },
    });
  }

  const { error: voteError } = await admin.from("votes").insert({
    user_id: userId ?? null, // Will be NULL for guest voters
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

  if (userId) {
    await admin.from("profiles").update({ last_vote_at: new Date().toISOString() }).eq("id", userId);
  }

  await admin.from("audit_logs").insert({
    actor_id: userId ?? '00000000-0000-0000-0000-000000000000', // Use a zero-UUID for guests
    action: "vote_cast",
    entity: "votes",
    entity_id: nomineeId,
    meta: { categoryId },
  });

  return NextResponse.json({ ok: true });
}
