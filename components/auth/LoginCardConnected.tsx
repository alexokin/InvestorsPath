"use client";

import { LoginCard } from "@/components/auth/LoginCard";
import { AUTH_MODE } from "@/lib/auth/mode";
import { signInWithGoogle, signInWithEmail, verifyEmailCode } from "@/lib/auth/client";
import { rememberNextAction, mockSignInAction } from "@/lib/auth/actions";
import type { EmailSignInResult } from "@/lib/auth/types";

type LoginCardConnectedProps = {
  next: string;
  error?: string | null;
};

export function LoginCardConnected({ next, error }: LoginCardConnectedProps) {
  async function handleGoogle(): Promise<void> {
    await signInWithGoogle(next);
  }

  async function handleEmail(email: string): Promise<EmailSignInResult> {
    await rememberNextAction(next);
    return signInWithEmail(email);
  }

  async function handleVerifyCode(email: string, code: string): Promise<EmailSignInResult> {
    const result = await verifyEmailCode(email, code);
    if (result.kind === "signed-in") {
      window.location.assign(next);
    }
    return result;
  }

  return (
    <LoginCard
      next={next}
      error={error}
      mode={AUTH_MODE}
      onGoogle={handleGoogle}
      onEmail={handleEmail}
      onVerifyCode={handleVerifyCode}
      mockSignInAction={mockSignInAction}
    />
  );
}
