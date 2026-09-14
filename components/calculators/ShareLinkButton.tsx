"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

const CONFIRMATION_MS = 2000;

/**
 * Copies the current page URL (including any synced query string) to the
 * clipboard, for sharing a deep link to the calculator's current state.
 * Falls back to a hidden-textarea + `document.execCommand("copy")` when
 * the async Clipboard API is unavailable (older browsers, non-secure
 * contexts).
 */
export function ShareLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    const url = window.location.href;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } catch {
        // Best-effort fallback; nothing more we can do here.
      }
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), CONFIRMATION_MS);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1 text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-primary" aria-hidden />
          <span>הקישור הועתק</span>
        </>
      ) : (
        <>
          <Link2 className="size-3.5" aria-hidden />
          <span>העתקת קישור לחישוב</span>
        </>
      )}
    </button>
  );
}
