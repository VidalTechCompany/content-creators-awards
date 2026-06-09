import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { voteRequestSchema } from "@/lib/validation/vote";
import { assertTrustedOrigin } from "@/lib/csrf";
import { VOTE_COOLDOWN_SEC } from "@/lib/constants";

// ============================================
// ENHANCED TYPES
// ============================================

type ScopeType = 'category' | 'subcategory';

type SupabaseAdminClient = ReturnType<typeof createServiceClient>;

interface ValidNomineeResult {
  valid: true;
  scopeType: ScopeType;
  scopeId: string;
}

interface InvalidNomineeResult {
  valid: false;
  error: string;
}

type NomineeValidationResult = ValidNomineeResult | InvalidNomineeResult;

// ============================================
// ENHANCED UTILITIES
// ============================================

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded.split(",");
    return ips[0]?.trim() || "0.0.0.0";
  }
  return request.headers.get("x-real-ip") || "0.0.0.0";
}

function getUserAgent(request: Request): string {
  return request.headers.get("user-agent")?.slice(0, 512) || "unknown";
}

function getOrigin(request: Request): string {
  return request.headers.get("origin") || request.headers.get("referer") || "unknown";
}

// ============================================
// ENHANCED CAPTCHA VERIFICATION WITH CACHING
// ============================================

const captchaCache = new Map<string, { verified: boolean; expires: number }>();

async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (captchaCache.has(token)) {
    const cached = captchaCache.get(token)!;
    if (cached.expires > Date.now()) {
      return cached.verified;
    }
    captchaCache.delete(token);
  }

  if (!secret && process.env.NODE_ENV !== "production") {
    console.warn("[VOTE_API] CAPTCHA: Dev mode bypass");
    return true;
  }

  if (!secret) {
    console.error("[VOTE_API] CAPTCHA Error: Missing TURNSTILE_SECRET_KEY");
    return false;
  }

  if (!token || token === "dev-bypass-placeholder") {
    if (process.env.NODE_ENV !== "production") {
      return true;
    }
    console.error("[VOTE_API] CAPTCHA Error: Missing token");
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

    const data = await res.json() as { success: boolean; "error-codes"?: string[] };

    captchaCache.set(token, {
      verified: data.success === true,
      expires: Date.now() + 5 * 60 * 1000,
    });

    if (!data.success) {
      console.error(`[VOTE_API] CAPTCHA failed for ${ip}:`, data["error-codes"]);
    }

    return data.success === true;
  } catch (err) {
    console.error("[VOTE_API] Turnstile connection error:", err);
    return false;
  }
}

// ============================================
// ENHANCED RATE LIMITING WITH SLIDING WINDOW
// ============================================

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

async function slidingWindowRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; retryAfter: number }> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  
  const record = rateLimitStore.get(key);
  
  if (!record || record.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, retryAfter: 0 };
  }
  
  if (record.count >= maxRequests) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, retryAfter: 0 };
}

// ============================================
// ENHANCED VOTE VALIDATION
// ============================================

async function validateNominee(
  admin: SupabaseAdminClient,
  nomineeId: string,
  categoryId: string,
  subcategoryId?: string | null
): Promise<NomineeValidationResult> {
  const { data: nominee, error } = await admin
    .from("nominees")
    .select("id, category_id, subcategory_id, status")
    .eq("id", nomineeId)
    .maybeSingle();

  if (error || !nominee || nominee.status !== "approved") {
    return { valid: false, error: "Invalid nominee. Please select a valid option." };
  }

  if (nominee.category_id !== categoryId) {
    return { valid: false, error: "This nominee does not belong to the selected category." };
  }

  if (nominee.subcategory_id && !subcategoryId) {
    return { valid: false, error: "This nominee requires a subcategory selection." };
  }

  if (!nominee.subcategory_id && subcategoryId) {
    return { valid: false, error: "Invalid subcategory for this nominee." };
  }

  if (nominee.subcategory_id && subcategoryId !== nominee.subcategory_id) {
    return { valid: false, error: "The selected subcategory does not match this nominee." };
  }

  const scopeType: ScopeType = nominee.subcategory_id ? "subcategory" : "category";
  const scopeId: string = nominee.subcategory_id || categoryId;

  return { valid: true, scopeType, scopeId };
}


// Helper function for fire-and-forget logging (no .catch issues)
async function logSafely(
  promise: PromiseLike<unknown>,
  context: string
): Promise<void> {
  try {
    await promise;
  } catch (err) {
    console.error(`Failed to log ${context}:`, err);
  }
}

// ============================================
// MAIN POST HANDLER
// ============================================

export async function POST(request: Request): Promise<NextResponse> {
  const startTime = Date.now();
  const ip = clientIp(request);
  const origin = getOrigin(request);

  // LAYER 1: ORIGIN CHECK
  try {
    await assertTrustedOrigin(request);
  } catch {
    console.warn(`[VOTE_API] Blocked request from invalid origin: ${origin}`);
    return NextResponse.json(
      { error: "Invalid request origin. Please refresh the page and try again." },
      { status: 403 }
    );
  }

  // LAYER 3: PARSE AND VALIDATE REQUEST
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload. Please check your request format." },
      { status: 400 }
    );
  }

  const parsed = voteRequestSchema.safeParse(json);
  if (!parsed.success) {
    console.error(`[VOTE_API] Validation failed for IP ${ip}:`, parsed.error.flatten());
    return NextResponse.json(
      {
        error: "Validation failed",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { categoryId, subcategoryId, nomineeId, fingerprint, captchaToken } = parsed.data;

  // LAYER 4: CAPTCHA VERIFICATION
  const isHuman = await verifyTurnstile(captchaToken, ip);
  if (!isHuman) {
    console.error(`[VOTE_API] CAPTCHA failed for IP ${ip}`);
    return NextResponse.json(
      { error: "Security verification failed. Please refresh and try again." },
      { status: 403 }
    );
  }

  // LAYER 5: INIT CLIENTS
  const supabase = await createClient();
  const admin = createServiceClient();

  // LAYER 6: AUTHENTICATION
  const authHeader = request.headers.get("Authorization");
  const jwtToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : undefined;
  const { data: authData } = await supabase.auth.getUser(jwtToken);
  const user = authData?.user;
  const userId = user?.id;

  // LAYER 7: SYSTEM CHECKS
  const { data: settings } = await admin
    .from("site_settings")
    .select("voting_open, voting_deadline")
    .eq("id", 1)
    .maybeSingle();

  if (settings?.voting_open === false) {
    return NextResponse.json(
      { error: "Voting is currently closed." },
      { status: 403 }
    );
  }

  if (settings?.voting_deadline) {
    const deadline = new Date(settings.voting_deadline);
    if (deadline.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Voting has ended. Thank you for participating!" },
        { status: 403 }
      );
    }
  }

  // LAYER 8: NOMINEE VALIDATION
  const nomineeValidation = await validateNominee(admin, nomineeId, categoryId, subcategoryId);
  if (!nomineeValidation.valid) {
    return NextResponse.json(
      { error: nomineeValidation.error },
      { status: 400 }
    );
  }

  // Type-safe destructuring - we know it's valid here
  const { scopeType, scopeId } = nomineeValidation;

    // ============================================
  // LAYER 9: DUPLICATE VOTE CHECK (Using RPC - NO DIRECT QUERIES)
  // ============================================
  const { data: checkResult, error: checkError } = await admin.rpc('check_existing_vote', {
    p_fingerprint: fingerprint.trim().slice(0, 512),
    p_user_id: userId ?? null,
    p_scope_type: scopeType,
    p_scope_id: scopeId,
    p_nominee_id: nomineeId
  });

  if (checkError) {
    console.error("[VOTE_API] Duplicate check RPC error:", checkError);
    // On error, allow the vote but log it (fail open for availability)
  }

  if (checkResult && checkResult.vote_exists === true) {
    return NextResponse.json(
      { error: checkResult.reason || "You have already voted for this nominee." },
      { status: 409 }
    );
  }
    // ============================================
  // LAYER 10: COOLDOWN CHECK (AUTHENTICATED USERS)
  // ============================================
  if (userId) {
    try {
      const { data: profile, error: profileError } = await admin
        .from("profiles")
        .select("last_vote_at")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("[VOTE_API] Profile fetch error:", profileError);
      }

      if (profile?.last_vote_at) {
        const lastVoteTime = new Date(profile.last_vote_at).getTime();
        const now = Date.now();
        const delta = (now - lastVoteTime) / 1000;
        
        if (delta < VOTE_COOLDOWN_SEC) {
          const waitSeconds = Math.ceil(VOTE_COOLDOWN_SEC - delta);
          return NextResponse.json(
            { 
              error: `Please wait ${waitSeconds} second${waitSeconds !== 1 ? 's' : ''} between votes.`, 
              retryAfter: waitSeconds 
            },
            { 
              status: 429,
              headers: { 'Retry-After': String(waitSeconds) }
            }
          );
        }
      }
    } catch (cooldownError) {
      console.error("[VOTE_API] Cooldown check error:", cooldownError);
      // Don't block vote on cooldown check error - proceed but log
    }
  }

  // Validate IP format for subsequent operations
  const isValidIp = (ipAddr: string): boolean => {
    // Support both IPv4 and IPv6 validation
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    return ipv4Regex.test(ipAddr) || ipv6Regex.test(ipAddr);
  };

  const validIp = isValidIp(ip) ? ip : "0.0.0.0";

  // ============================================
  // LAYER 11: IP BURST DETECTION (Using RPC to avoid INET casting errors)
  // ============================================
  try {
    // Use the count_votes_by_ip RPC function instead of direct query
    const { data: ipBurst, error: burstError } = await admin.rpc('count_votes_by_ip', {
      p_ip_address: validIp,
      p_hours_ago: 1
    });
    
    if (burstError) {
      console.error("[VOTE_API] IP burst detection RPC error:", burstError);
    } else if ((ipBurst ?? 0) > 40) {
      // Fire and forget - log suspicious activity without blocking
      logSafely(
        admin.from("suspicious_activity").insert({
          user_id: userId ?? null,
          reason: "high_ip_volume",
          meta: { 
            ip: validIp, 
            count: ipBurst, 
            timestamp: new Date().toISOString(),
            window_hours: 1
          },
        }),
        "suspicious_activity"
      );
    }
  } catch (burstError) {
    console.error("[VOTE_API] IP burst detection exception:", burstError);
    // Don't block the vote on burst detection error
  }
  // ============================================
  // LAYER 12: RECORD VOTE (Using RPC Function)
  // ============================================
  
  // Validate required fields before database call
  if (!nomineeId || !categoryId) {
    console.error("[VOTE_API] Missing required fields:", { nomineeId, categoryId });
    return NextResponse.json(
      { error: "Missing required fields. Please refresh and try again." },
      { status: 400 }
    );
  }

  // Ensure validIp is never undefined
  const safeIp = validIp || "0.0.0.0";
  const safeFingerprint = fingerprint?.trim().slice(0, 512) || "unknown";
  const safeUserAgent = getUserAgent(request).slice(0, 512) || "unknown";

  const { data: newVoteId, error: voteError } = await admin.rpc('insert_vote', {
    p_user_id: userId ?? null,
    p_category_id: categoryId,
    p_subcategory_id: scopeType === "subcategory" ? scopeId : null,
    p_nominee_id: nomineeId,
    p_ip_address: safeIp,
    p_user_agent: safeUserAgent,
    p_fingerprint: safeFingerprint,
  });

  // Handle vote insertion errors
  if (voteError) {
    // PostgreSQL unique violation - duplicate vote
    if (voteError.code === "23505") {
      console.warn(`[VOTE_API] Duplicate vote prevented: User ${userId || 'anonymous'} tried to vote for nominee ${nomineeId}`);
      return NextResponse.json(
        { error: "You have already voted for this nominee." },
        { status: 409 }
      );
    }
    
    // PostgreSQL foreign key violation - invalid nominee/category
    if (voteError.code === "23503") {
      console.error(`[VOTE_API] Foreign key violation: ${voteError.message}`);
      return NextResponse.json(
        { error: "Invalid nominee or category. Please refresh and try again." },
        { status: 400 }
      );
    }

    // Log detailed error for debugging (without exposing to client)
    console.error("[VOTE_API] Vote insertion failed:", {
      code: voteError.code,
      message: voteError.message,
      details: voteError.details,
      ip: safeIp,
      userId,
      nomineeId,
      categoryId,
    });
    
    return NextResponse.json(
      { error: "Unable to record vote. Please refresh the page and try again." },
      { status: 500 }
    );
  }

  // Validate vote ID was returned
  if (!newVoteId) {
    console.error("[VOTE_API] Vote insertion returned no ID:", {
      ip: safeIp,
      userId,
      nomineeId,
    });
    return NextResponse.json(
      { error: "Vote recorded but unable to confirm. Please check your vote status." },
      { status: 202 }
    );
  }

  // Create vote object for consistency
  const newVote = { id: newVoteId };

  // ============================================
  // LAYER 13: VOTE COUNT INCREMENT - HANDLED BY DATABASE TRIGGER
  // ============================================
  // NOTE: The trigger 'increment_nominee_stat' automatically runs AFTER INSERT
  // on the votes table. DO NOT call increment_vote_count here.
  // This prevents duplicate counting.
  // ============================================

  // ============================================
  // LAYER 14: UPDATE USER COOLDOWN (Non-blocking)
  // ============================================
  if (userId) {
    // Fire and forget - don't await to avoid blocking response
    logSafely(
      admin
        .from("profiles")
        .update({ last_vote_at: new Date().toISOString() })
        .eq("id", userId),
      "user_cooldown_update"
    );
  }

  // ============================================
  // LAYER 15: AUDIT LOG (Non-blocking, fire-and-forget)
  // ============================================
  const auditLogData = {
    actor_id: userId ?? 'anonymous',
    action: "vote_cast",
    entity: "votes",
    entity_id: newVote.id,
    meta: {
      categoryId,
      nomineeId,
      subcategoryId: scopeType === "subcategory" ? scopeId : null,
      ip: safeIp.slice(0, 45),
      fingerprint: safeFingerprint.slice(0, 32),
      userAgent: safeUserAgent.slice(0, 200),
      responseTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    },
  };

  logSafely(
    admin.from("audit_logs").insert(auditLogData),
    "audit_log"
  );

  // ============================================
  // LAYER 16: SUCCESS RESPONSE
  // ============================================
  return NextResponse.json({
    success: true,
    message: "Your vote has been recorded successfully!",
    voteId: newVote.id,
    timestamp: new Date().toISOString(),
  });
}