/**
 * Routes legacy `/api/*` calls to the GeFlow backend function.
 * The app previously talked to a local Node server; the same routes are now
 * served by the `geflow-api` cloud function.
 */
import { ensureFreshSession } from "@/lib/authSession";

const BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/geflow-api`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export function installApiBridge() {
  if (typeof window === "undefined" || (window as any).__geflowApiBridge) return;
  (window as any).__geflowApiBridge = true;

  const original = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const raw = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const isApi = raw.startsWith("/api/") || raw.startsWith(`${window.location.origin}/api/`);
      if (!isApi) return original(input as any, init);

      const relative = raw.replace(window.location.origin, "");
      const target = BASE + relative.replace(/^\/api/, "");

      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      headers.set("apikey", ANON);
      if (!headers.has("Content-Type") && init?.body) headers.set("Content-Type", "application/json");

      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      headers.set("Authorization", `Bearer ${token || ANON}`);
      if (data.session?.user?.id) {
        headers.set("x-user-id", data.session.user.id);
        if (data.session.user.email) headers.set("x-user-email", data.session.user.email);
      }

      return original(target, {
        ...init,
        method: init?.method || (input instanceof Request ? input.method : "GET"),
        headers,
      });
    } catch (err) {
      console.warn("API bridge failed, using direct fetch:", err);
      return original(input as any, init);
    }
  };
}
