"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { AUTH_MODE } from "@/lib/auth/mode";
import { getBrowserSupabase, readMockUserFromDocument } from "@/lib/auth/client";
import { signOutAction } from "@/lib/auth/actions";
import { toAuthUser, type AuthStatus, type AuthUser } from "@/lib/auth/types";

export type SyncEngine = {
  start(): Promise<void>;
  flush(): Promise<void>;
  stop(): Promise<void>;
  onStateChange(cb: (s: "idle" | "syncing" | "error") => void): () => void;
};

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  syncReady: boolean;
  syncState: "idle" | "syncing" | "error";
  signOut(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

type AuthProviderProps = {
  children: ReactNode;
  syncEngineFactory?: (user: AuthUser) => SyncEngine;
  onBeforeSignOut?: () => void;
};

export function AuthProvider({
  children,
  syncEngineFactory,
  onBeforeSignOut,
}: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [syncReady, setSyncReady] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "error">("idle");
  const engineRef = useRef<SyncEngine | null>(null);
  // Server actions (mock sign-in/sign-out) redirect via a client-side
  // transition that keeps this provider mounted, so the mock cookie must be
  // re-read whenever the route changes, not just once on mount.
  const pathname = usePathname();

  useEffect(() => {
    if (AUTH_MODE === "mock") {
      const mockUser = readMockUserFromDocument();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- re-derive from the mock cookie on every navigation
      setUser(mockUser);
      setStatus(mockUser ? "signed-in" : "signed-out");
      return;
    }

    let cancelled = false;
    const supabase = getBrowserSupabase();

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      if (cancelled) return;
      const sessionUser = toAuthUser(data.session?.user ?? null);
      setUser(sessionUser);
      setStatus(sessionUser ? "signed-in" : "signed-out");
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        const nextUser = toAuthUser(session?.user ?? null);
        setUser(nextUser);
        setStatus(nextUser ? "signed-in" : "signed-out");
      },
    );

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
    // Mock branch re-derives on pathname change; the supabase branch is kept
    // in the same effect for symmetry and only needs to run once, which
    // `pathname` in the deps doesn't affect (onAuthStateChange keeps it current).
  }, [pathname]);

  useEffect(() => {
    if (!user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset sync readiness when signing out
      setSyncReady(false);
      return;
    }

    if (!syncEngineFactory) {
      setSyncReady(true);
      return;
    }

    let cancelled = false;
    const engine = syncEngineFactory(user);
    engineRef.current = engine;
    setSyncReady(false);
    const unsubscribe = engine.onStateChange((s) => {
      if (!cancelled) setSyncState(s);
    });

    engine
      .start()
      .catch(() => {
        // Sync failures shouldn't block the UI from becoming usable.
      })
      .finally(() => {
        if (!cancelled) setSyncReady(true);
      });

    return () => {
      cancelled = true;
      unsubscribe();
      engineRef.current = null;
      void engine.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  async function signOut(): Promise<void> {
    if (engineRef.current) {
      await engineRef.current.flush().catch(() => {});
    }
    onBeforeSignOut?.();
    await signOutAction();
  }

  return (
    <AuthContext.Provider value={{ status, user, syncReady, syncState, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
