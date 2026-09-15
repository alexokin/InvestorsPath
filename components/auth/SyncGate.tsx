"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { isProtectedPath } from "@/lib/auth/protected-paths";

export function SyncGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { syncReady } = useAuth();

  if (isProtectedPath(pathname) && !syncReady) {
    return (
      <div
        role="status"
        aria-busy="true"
        className="mx-auto max-w-6xl px-4 py-16 text-center text-muted"
      >
        טוענים את ההתקדמות שלך…
      </div>
    );
  }

  return <>{children}</>;
}
