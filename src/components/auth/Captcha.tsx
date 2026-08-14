"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

// Google reCAPTCHA v2 ("I'm not a robot" checkbox + image challenge).
// The SITE key is public by design (safe in the browser).
// Falls back to Google's official TEST site key (always passes, shows a
// "for testing only" notice) when no real key is configured.
const TEST_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || TEST_SITE_KEY;

interface GrecaptchaApi {
  // Optional because the API object can exist briefly before `render` is attached.
  render?: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      theme?: "light" | "dark";
      size?: "normal" | "compact";
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
    },
  ) => number;
  reset?: (id?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaApi;
  }
}

/**
 * Accessible, theme-aware Google reCAPTCHA v2 widget.
 * Emits a token on success; the token MUST be verified server-side
 * (see /api/auth/captcha) — it is not trustworthy on its own.
 *
 * Remount with a changing `key` to force a fresh challenge (e.g. after a
 * failed/expired verification).
 */
export default function Captcha({
  onVerify,
  onExpire,
  onError,
  theme = "dark",
}: {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  theme?: "light" | "dark";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    let poll: ReturnType<typeof setInterval> | null = null;

    function renderWidget() {
      if (cancelled || !window.grecaptcha || !window.grecaptcha.render) return;
      if (!containerRef.current || widgetId.current !== null) return;
      widgetId.current = window.grecaptcha.render(containerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme,
        size: "normal",
        callback: (token) => onVerify(token),
        "expired-callback": () => onExpire?.(),
        "error-callback": () => onError?.(),
      });
    }

    if (window.grecaptcha && window.grecaptcha.render) {
      renderWidget();
    } else {
      poll = setInterval(() => {
        if (window.grecaptcha && window.grecaptcha.render) {
          if (poll) clearInterval(poll);
          renderWidget();
        }
      }, 150);
    }

    return () => {
      cancelled = true;
      if (poll) clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        strategy="afterInteractive"
      />
      {/* The reCAPTCHA widget is a fixed 304px; center it and allow the row to
          shrink/scroll on very narrow phones so it never overflows the card. */}
      <div className="flex w-full justify-center overflow-x-auto">
        <div ref={containerRef} aria-label="CAPTCHA verification" />
      </div>
    </>
  );
}

// ---- Client helper: ask the backend to verify a reCAPTCHA token ------------
export type CaptchaVerifyResult =
  | { ok: true }
  | { ok: false; reason: CaptchaReason };

type CaptchaReason = "expired" | "failed" | "rate_limited" | "unavailable" | "missing";

export async function verifyCaptcha(token: string): Promise<CaptchaVerifyResult> {
  try {
    const res = await fetch("/api/auth/captcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = (await res.json()) as { success: boolean; error?: string };
    if (data.success) return { ok: true };
    const allowed: CaptchaReason[] = ["expired", "failed", "rate_limited", "unavailable", "missing"];
    const reason = allowed.includes(data.error as CaptchaReason)
      ? (data.error as CaptchaReason)
      : "failed";
    return { ok: false, reason };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
