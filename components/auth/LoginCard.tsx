"use client";

import { useState, type FormEvent } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { EmailSignInResult } from "@/lib/auth/types";

type LoginCardProps = {
  next: string;
  error?: string | null;
  mode: "supabase" | "mock";
  onGoogle: () => Promise<void>;
  onEmail: (email: string) => Promise<EmailSignInResult>;
  onVerifyCode?: (email: string, code: string) => Promise<EmailSignInResult>;
  mockSignInAction?: (formData: FormData) => Promise<void>;
};

type FormState = "idle" | "sending" | "sent" | "error";

const errorMessages: Record<string, string> = {
  oauth: "ההתחברות עם Google נכשלה, נסו שוב",
  link: "הקישור אינו תקף או פג תוקפו, בקשו קישור חדש",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47c-.28 1.48-1.13 2.73-2.4 3.58v2.98h3.89c2.28-2.1 3.53-5.19 3.53-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.93l-3.89-2.98c-1.08.72-2.46 1.15-4.04 1.15-3.11 0-5.74-2.1-6.68-4.92H1.3v3.09C3.27 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.32 14.32c-.24-.72-.38-1.49-.38-2.32s.14-1.6.38-2.32V6.59H1.3C.47 8.23 0 10.06 0 12s.47 3.77 1.3 5.41l4.02-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.35.6 4.6 1.79l3.45-3.45C17.94 1.19 15.24 0 12 0 7.31 0 3.27 2.7 1.3 6.59l4.02 3.09C6.26 6.85 8.89 4.75 12 4.75z"
      />
    </svg>
  );
}

export function LoginCard({
  next,
  error,
  mode,
  onGoogle,
  onEmail,
  onVerifyCode,
  mockSignInAction,
}: LoginCardProps) {
  const [state, setState] = useState<FormState>("idle");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(
    error ? errorMessages[error] ?? null : null
  );
  const [showCodeForm, setShowCodeForm] = useState(false);
  const [code, setCode] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  async function handleEmailSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setMessage(null);
    const result = await onEmail(email);
    if (result.kind === "error") {
      setState("error");
      setMessage(result.message);
      return;
    }
    setState("sent");
  }

  async function handleGoogleClick() {
    setMessage(null);
    await onGoogle();
  }

  async function handleVerifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!onVerifyCode) return;
    setIsBusy(true);
    setMessage(null);
    const result = await onVerifyCode(email, code);
    setIsBusy(false);
    if (result.kind === "error") {
      setState("error");
      setMessage(result.message);
      return;
    }
    setState("sent");
  }

  if (mode === "mock") {
    return (
      <Card className="mx-auto max-w-sm text-start">
        <form action={mockSignInAction}>
          <input type="hidden" name="kind" value="google" />
          <input type="hidden" name="next" value={next} />
          <Button type="submit" variant="secondary" className="w-full">
            <GoogleIcon />
            התחברות עם Google
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-border" />
          או
          <span className="h-px flex-1 bg-border" />
        </div>

        <form action={mockSignInAction} className="flex flex-col gap-3">
          <input type="hidden" name="kind" value="email" />
          <input type="hidden" name="next" value={next} />
          <Input
            label="כתובת אימייל"
            id="login-email"
            name="email"
            type="email"
            dir="ltr"
            required
          />
          <Button type="submit" className="w-full">
            שליחת קישור התחברות
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted">ההתחברות ללא סיסמה. לא נשלח דיוור.</p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-sm text-start">
      {message && (
        <div className="mb-4">
          <Alert variant={state === "error" ? "error" : "info"}>{message}</Alert>
        </div>
      )}

      {state === "sent" ? (
        <div className="flex flex-col gap-3">
          <Alert variant="success">
            שלחנו קישור התחברות אל {email}. אפשר לפתוח אותו בכל מכשיר.
          </Alert>
          <Button
            variant="secondary"
            disabled={isBusy}
            onClick={async () => {
              setIsBusy(true);
              const result = await onEmail(email);
              setIsBusy(false);
              if (result.kind === "error") {
                setState("error");
                setMessage(result.message);
                return;
              }
              setState("sent");
            }}
          >
            שליחה חוזרת
          </Button>

          {onVerifyCode && (
            <>
              <button
                type="button"
                onClick={() => setShowCodeForm((v) => !v)}
                className="text-xs font-medium text-primary hover:underline"
              >
                יש לי קוד
              </button>
              {showCodeForm && (
                <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
                  <Input
                    label="קוד בן 6 ספרות"
                    id="login-code"
                    name="code"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    dir="ltr"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                  <Button type="submit" disabled={isBusy}>
                    אישור
                  </Button>
                </form>
              )}
            </>
          )}
        </div>
      ) : (
        <>
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleGoogleClick}
            disabled={state === "sending"}
          >
            <GoogleIcon />
            התחברות עם Google
          </Button>

          <div className="my-4 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            או
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
            <Input
              label="כתובת אימייל"
              id="login-email"
              name="email"
              type="email"
              dir="ltr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button type="submit" className="w-full" disabled={state === "sending"}>
              שליחת קישור התחברות
            </Button>
          </form>

          <p className="mt-4 text-xs text-muted">ההתחברות ללא סיסמה. לא נשלח דיוור.</p>
        </>
      )}
    </Card>
  );
}
