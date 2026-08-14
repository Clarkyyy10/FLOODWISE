import { NextRequest, NextResponse } from "next/server";

// Google reCAPTCHA v2 server-side verification.
// The SECRET key lives only here (server). Never send it to the client.
// Falls back to Google's official TEST secret (always passes) for local dev.
const TEST_SECRET = "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe";
const SECRET = process.env.RECAPTCHA_SECRET_KEY || TEST_SECRET;

const VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

// --- Naive in-memory rate limiter (per IP) ----------------------------------
// Resets on server restart. Good enough to blunt automated abuse in this
// project; a production deployment should use a shared store (e.g. Redis).
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 15; // per IP per window
const hits = new Map<string, { count: number; first: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now - entry.first > WINDOW_MS) {
    hits.set(ip, { count: 1, first: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_REQUESTS;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { success: false, error: "rate_limited" },
      { status: 429 },
    );
  }

  let token = "";
  try {
    const body = (await req.json()) as { token?: string };
    token = (body.token ?? "").toString();
  } catch {
    /* invalid body */
  }

  if (!token) {
    return NextResponse.json({ success: false, error: "missing" }, { status: 400 });
  }

  const form = new URLSearchParams();
  form.append("secret", SECRET);
  form.append("response", token);
  if (ip !== "unknown") form.append("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body: form });
    const data = (await res.json()) as {
      success: boolean;
      "error-codes"?: string[];
    };

    if (data.success) {
      return NextResponse.json({ success: true });
    }

    // Log technical detail server-side only; return a generic reason to client.
    const codes = data["error-codes"] ?? [];
    console.warn("[captcha] verification failed", { ip, codes });
    const expired =
      codes.includes("timeout-or-duplicate") || codes.includes("invalid-input-response");
    return NextResponse.json(
      { success: false, error: expired ? "expired" : "failed" },
      { status: 200 },
    );
  } catch (err) {
    console.error("[captcha] verify service error", err);
    return NextResponse.json({ success: false, error: "unavailable" }, { status: 200 });
  }
}
