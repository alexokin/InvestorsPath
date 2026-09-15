"use client";

import type { ReactNode } from "react";

import { AuthProvider, type SyncEngine } from "@/components/auth/AuthProvider";
import { AUTH_MODE } from "@/lib/auth/mode";
import { getBrowserSupabase } from "@/lib/auth/client";
import type { AuthUser } from "@/lib/auth/types";
import { createSyncEngine } from "@/lib/sync/engine";
import { createSupabaseRemote } from "@/lib/sync/supabase-remote";
import { getMemoryRemote } from "@/lib/sync/memory-remote";
import { clearAllLearnerStores } from "@/lib/sync/stores";
import { clearOwner } from "@/lib/sync/owner";

function syncEngineFactory(user: AuthUser): SyncEngine {
  const remote =
    AUTH_MODE === "supabase"
      ? createSupabaseRemote(async () => getBrowserSupabase())
      : getMemoryRemote();
  return createSyncEngine(user.id, remote);
}

function onBeforeSignOut(): void {
  clearAllLearnerStores("remote");
  clearOwner();
}

export function AppAuthProvider({ children }: { children: ReactNode }) {
  return (
    <AuthProvider syncEngineFactory={syncEngineFactory} onBeforeSignOut={onBeforeSignOut}>
      {children}
    </AuthProvider>
  );
}
