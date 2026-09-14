// Synchronous filesystem shim backed by the `server_kv` Postgres table.
// The ported Express services were written against Node's `fs`; this keeps
// their logic untouched while persisting state in the database.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const cache = new Map<string, string>();
const dirty = new Set<string>();

const keyOf = (filePath: string) => filePath.split("/").pop() ?? filePath;

/** Load every stored document into memory before handling a request. */
export async function loadStore(): Promise<void> {
  cache.clear();
  dirty.clear();
  const { data, error } = await admin.from("server_kv").select("key, value");
  if (error) {
    console.error("server_kv load failed:", error.message);
    return;
  }
  for (const row of data ?? []) {
    cache.set(row.key as string, JSON.stringify((row as any).value));
  }
}

/** Persist everything written during the request. */
export async function flushStore(): Promise<void> {
  if (dirty.size === 0) return;
  const rows = [...dirty].map((key) => {
    let value: unknown = {};
    try {
      value = JSON.parse(cache.get(key) ?? "{}");
    } catch {
      value = {};
    }
    return { key, value, updated_at: new Date().toISOString() };
  });
  const { error } = await admin.from("server_kv").upsert(rows, { onConflict: "key" });
  if (error) console.error("server_kv flush failed:", error.message);
  dirty.clear();
}

const fs = {
  existsSync(p: string): boolean {
    if (!p.includes(".")) return true; // directories always "exist"
    return cache.has(keyOf(p));
  },
  mkdirSync(_p: string, _o?: unknown): void {},
  readFileSync(p: string, _enc?: string): string {
    return cache.get(keyOf(p)) ?? "null";
  },
  writeFileSync(p: string, data: string, _enc?: string): void {
    const key = keyOf(p);
    cache.set(key, data);
    dirty.add(key);
  },
};

export default fs;
