import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { voteRequestSchema } from "@/lib/validation/vote";
import { assertTrustedOrigin } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { VOTE_COOLDOWN_SEC } from "@/lib/constants";

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}

async function verifyTurnstile(token: string, ip?: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // Dev bypass: If secret is missing and we're not in production, allow for easier testing.
  if (!secret && process.env.NODE_ENV !== "production") {
    console.warn("[VOTE_API] CAPTCHA: No secret provided in dev mode, bypassing verification.");
    return true;
  }

  if (!secret) {
    console.error("[VOTE_API] CAPTCHA Error: TURNSTILE_SECRET_KEY environment variable is missing.");
    return false;
  }

  if (!token || token === "dev-bypass-placeholder") {
    // Allow placeholder only in dev mode
    if (process.env.NODE_ENV !== "production" && token === "dev-bypass-placeholder") {
      console.warn("[VOTE_API] CAPTCHA: Dev bypass placeholder accepted.");
      return true;
    }
    console.error("[VOTE_API] CAPTCHA Error: Missing or invalid token from client.");
    return false;
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secret);
    formData.append("response", token);
    if (ip) formData.append("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
      cache: 'no-store',
    });

    let data;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error("[VOTE_API] Failed to parse Turnstile response:", e);
      data = {};
    }

    if (!res.ok) {
      console.error(`[VOTE_API] Turnstile siteverify failed: ${data.error || data.message}`);
      return false;
    }

    if (data.success) return true;

    console.error(`[VOTE_API] CAPTCHA failed for ${ip}:`, data["error-codes"] || "Unknown error");
    return false;
  } catch (err) {
    console.error("[VOTE_API] Turnstile connection error:", err);
    return false;
  }
}

export async function POST(request: Request) {
  // 1. Origin check
  try {
    await assertTrustedOrigin(request);
  } catch {
    const origin = request.headers.get("origin") || request.headers.get("referer") || "missing";
    return NextResponse.json({ error: `Invalid origin: ${origin}` }, { status: 403 });
  }

  // 2. Rate limiting by IP
  const ip = clientIp(request) ?? "0.0.0.0";
  if (!(await rateLimit(`vote:${ip}`, 25, 60_000))) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  // 3. Parse JSON safely
  let json: unknown;
  try {
    const text = await request.text();
    json = text ? JSON.parse(text) : {};
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload. Please check your request format." },
      { status: 400 }
    );
  }

  // 4. Log incoming request for debugging (remove in production)
  if (process.env.NODE_ENV !== "production") {
    console.log("[VOTE_API] Received payload:", JSON.stringify(json, null, 2));
  }

  // 5. Handle dev bypass for captcha
  const isDevBypass = process.env.NODE_ENV !== "production" && !process.env.TURNSTILE_SECRET_KEY;
  const payload = (isDevBypass && typeof json === 'object' && json !== null && !('captchaToken' in json))
    ? { ...json, captchaToken: "dev-bypass-placeholder" }
    : json;

  // 6. Validate with Zod
  const parsed = voteRequestSchema.safeParse(payload);

  if (!parsed.success) {
    console.error(
      `[VOTE_API] Validation Failed for IP: ${ip}\n` +
      `Payload: ${JSON.stringify(json)}\n` +
      `Errors: ${JSON.stringify(parsed.error.flatten())}`
    );

    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
        message: "Please check your input: categoryId, nomineeId, fingerprint, and captchaToken are required"
      },
      { status: 400 }
    );
  }

  const { categoryId, subcategoryId, nomineeId, fingerprint, captchaToken } = parsed.data;

  // 7. CAPTCHA verification
  const isHuman = await verifyTurnstile(captchaToken, ip);
  if (!isHuman) {
    console.error(`[VOTE_API] CAPTCHA verification failed for IP ${ip}`);
    return NextResponse.json(
      { error: "CAPTCHA verification failed. Please refresh and try again." },
      { status: 403 }
    );
  }

  // 8. Initialize Supabase clients
  const supabase = await createClient();
  const admin = createServiceClient();

  // 9. Authentication (optional - allows guest voting)
  const authHeader = request.headers.get("Authorization");
  const jwtToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
  const { data: authData } = await supabase.auth.getUser(jwtToken);
  const user = authData?.user;
  const userId = user?.id;
  const ua = request.headers.get("user-agent") ?? "";

  // 10. Global system checks
  const { data: settings } = await admin.from("site_settings").select("*").eq("id", 1).maybeSingle();

  if (settings && settings.voting_open === false) {
    console.warn("[VOTE_API] Voting is closed");
    return NextResponse.json({ error: "Voting is currently closed" }, { status: 403 });
  }

  if (settings?.voting_deadline) {
    const deadline = new Date(settings.voting_deadline);
    if (deadline.getTime() < Date.now()) {
      console.warn("[VOTE_API] Voting deadline passed");
      return NextResponse.json({ error: "Voting deadline has passed" }, { status: 403 });
    }
  }

  // 11. Validate nominee exists and is approved
  const { data: nominee, error: nomErr } = await admin
    .from("nominees")
    .select("id, category_id, subcategory_id, status")
    .eq("id", nomineeId)
    .maybeSingle();

  if (nomErr || !nominee || nominee.status !== "approved") {
    return NextResponse.json(
      { error: "Invalid nominee or candidate. Please select a valid option." },
      { status: 400 }
    );
  }

  if (nominee.category_id !== categoryId) {
    return NextResponse.json(
      { error: "Invalid category for this nominee." },
      { status: 400 }
    );
  }

  if (nominee.subcategory_id && !subcategoryId) {
    return NextResponse.json(
      { error: "This nominee requires a subcategory selection." },
      { status: 400 }
    );
  }

  if (!nominee.subcategory_id && subcategoryId) {
    return NextResponse.json(
      { error: "Invalid subcategory for this nominee." },
      { status: 400 }
    );
  }

  if (nominee.subcategory_id && subcategoryId !== nominee.subcategory_id) {
    return NextResponse.json(
      { error: "The selected subcategory does not match this nominee." },
      { status: 400 }
    );
  }

  const voteScope = nominee.subcategory_id
    ? { scopeType: "subcategory", scopeId: nominee.subcategory_id }
    : { scopeType: "category", scopeId: categoryId };

  // 12. Device fingerprint check (prevent multiple votes from same device)
  const fingerprintQuery = admin.from("votes").select("*", { count: "exact", head: true });
  const userQuery = admin.from("votes").select("*", { count: "exact", head: true });

  if (voteScope.scopeType === "subcategory") {
    fingerprintQuery.eq("subcategory_id", voteScope.scopeId);
    userQuery.eq("subcategory_id", voteScope.scopeId);
  } else {
    fingerprintQuery.eq("category_id", voteScope.scopeId);
    userQuery.eq("category_id", voteScope.scopeId);
  }

  fingerprintQuery.eq("fingerprint", fingerprint.trim().slice(0, 512));

  const { count: fingerprintCount } = await fingerprintQuery;

  if ((fingerprintCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "This device has already voted in this voting scope" },
      { status: 409 }
    );
  }

  if (userId) {
    userQuery.eq("user_id", userId);
    const { count: userCount } = await userQuery;
    if ((userCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "This account has already voted in this voting scope" },
        { status: 409 }
      );
    }
  }

  // 13. Cooldown check for registered users
  if (userId) {
    const { data: profile } = await admin
      .from("profiles")
      .select("last_vote_at")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.last_vote_at) {
      const delta = (Date.now() - new Date(profile.last_vote_at).getTime()) / 1000;
      if (delta < VOTE_COOLDOWN_SEC) {
        return NextResponse.json(
          { error: `Please wait ${Math.ceil(VOTE_COOLDOWN_SEC - delta)} seconds between votes` },
          { status: 429 }
        );
      }
    }
  }

  // 14. IP burst detection (monitoring only, not blocking)
  const { count: ipBurst } = await admin
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("ip_address", ip)
    .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());

  if ((ipBurst ?? 0) > 40) {
    try {
      await admin.from("suspicious_activity").insert({
        user_id: userId ?? null,
        reason: "high_ip_volume",
        meta: { ip, count: ipBurst, timestamp: new Date().toISOString() },
      });
    } catch (err) {
      console.error("Failed to log suspicious activity:", err);
    }
  }

  // 15. Record the vote
  const { error: voteError } = await admin.from("votes").insert({
    user_id: userId ?? null,
    category_id: categoryId,
    subcategory_id: voteScope.scopeType === "subcategory" ? voteScope.scopeId : null,
    nominee_id: nomineeId,
    ip_address: ip,
    user_agent: ua.slice(0, 512),
    fingerprint: fingerprint.slice(0, 512),
    created_at: new Date().toISOString(),
  });

  if (voteError) {
    if (voteError.code === "23505") { // Unique violation
      return NextResponse.json(
        { error: "You have already voted in this category" },
        { status: 409 }
      );
    }
    console.error("Vote insert error:", voteError);
    return NextResponse.json(
      { error: "Failed to record vote. Please try again." },
      { status: 500 }
    );
  }

  // 16. Update user's last vote timestamp
  if (userId) {
    await admin
      .from("profiles")
      .update({ last_vote_at: new Date().toISOString() })
      .eq("id", userId);
  }

  // 17. Log to audit trail
  await admin.from("audit_logs").insert({
    actor_id: userId ?? '00000000-0000-0000-0000-000000000000',
    action: "vote_cast",
    entity: "votes",
    entity_id: nomineeId,
    meta: {
      categoryId,
      subcategoryId: voteScope.scopeType === "subcategory" ? voteScope.scopeId : null,
      ip,
      fingerprint: fingerprint.slice(0, 32),
    },
  });

  // 18. Return success
  return NextResponse.json({
    success: true,
    message: "Vote recorded successfully!",
    vote: { categoryId, nomineeId }
  });
}