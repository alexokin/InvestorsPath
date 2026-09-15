/**
 * Marks which user's data currently lives in localStorage, so that a
 * shared browser never uploads one account's leftovers as another's, and
 * so a legacy pre-auth local store is only ever uploaded once.
 */
export const OWNER_KEY = "vip:sync:owner:v1";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readOwner(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

export function writeOwner(uid: string): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(OWNER_KEY, uid);
  } catch {
    // ignore
  }
}

export function clearOwner(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(OWNER_KEY);
  } catch {
    // ignore
  }
}
