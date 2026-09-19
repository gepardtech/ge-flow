import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Single source of truth for the signed-in session.
 *
 * Why this exists: every page/hook used to call `supabase.auth.getSession()` or
 * `getUser()` on its own. Those calls all contend for the same browser auth
 * lock, which on the preview surface (where the session is brokered over
 * postMessage) produced "Lock stolen" errors and randomly dropped sessions.
 *
 * Here we keep exactly one in-flight resolution, cache the result, and let the
 * global auth listener keep the cache fresh. Everything else reads the cache.
 */

let cachedSession: Session | null = null;
let hydrated = false;
let inflight: Promise<Session | null> | null = null;
let listenerAttached = false;

type Listener = (session: Session | null) => void;
const listeners = new Set<Listener>();

const notify = () => {
  for (const l of listeners) {
    try {
      l(cachedSession);
    } catch {
      /* listener errors must never break auth */
    }
  }
};

function attachListener() {
  if (listenerAttached) return;
  listenerAttached = true;

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT") {
      cachedSession = null;
      hydrated = true;
      notify();
      return;
    }
    if (session) {
      cachedSession = session;
      hydrated = true;
      notify();
    }
    // A null session on any other event (e.g. INITIAL_SESSION before storage
    // has been read) is not proof of a sign-out — never broadcast it, or
    // guarded pages would bounce signed-in users to /login on first paint.
  });

  if (typeof window !== "undefined") {
    // Coming back to the tab is the classic moment a session has gone stale.
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void ensureFreshSession();
    });
    window.addEventListener("online", () => {
      void ensureFreshSession();
    });
  }
}

const EXPIRY_MARGIN_SECONDS = 120;

function isExpiring(session: Session | null) {
  if (!session?.expires_at) return false;
  return session.expires_at - Math.floor(Date.now() / 1000) < EXPIRY_MARGIN_SECONDS;
}

/**
 * Resolve the current session, de-duplicating concurrent callers so only one
 * request ever touches the auth lock at a time.
 */
export function getSession(): Promise<Session | null> {
  attachListener();
  if (hydrated && cachedSession && !isExpiring(cachedSession)) {
    return Promise.resolve(cachedSession);
  }
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      let session = data.session ?? null;

      if (session && isExpiring(session)) {
        const { data: refreshed, error } = await supabase.auth.refreshSession();
        if (!error && refreshed.session) session = refreshed.session;
      }

      // No local session: the token may live only in the preview broker, so ask
      // the auth server directly before declaring the visitor signed out.
      if (!session) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data: retry } = await supabase.auth.getSession();
          session = retry.session ?? null;
        }
      }

      cachedSession = session;
      hydrated = true;
      notify();
      return session;
    } catch {
      hydrated = true;
      return cachedSession;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Force a refresh when the access token is close to (or past) expiry. */
export async function ensureFreshSession(): Promise<Session | null> {
  const session = await getSession();
  if (!session) return null;
  if (!isExpiring(session)) return session;
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session) {
      cachedSession = data.session;
      notify();
      return data.session;
    }
  } catch {
    /* keep whatever we have */
  }
  return cachedSession;
}

/** The signed-in user, or null. Never throws. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/** Synchronous peek — only valid after the session has been resolved once. */
export function peekSession(): Session | null {
  return cachedSession;
}

export function isHydrated() {
  return hydrated;
}

export function subscribeToSession(listener: Listener): () => void {
  attachListener();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function clearSessionCache() {
  cachedSession = null;
  hydrated = false;
}
