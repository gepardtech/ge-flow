import { useEffect, useState } from "react";
import { usePlatformSettings } from "@/components/PlatformSettingsProvider";
import { supabase } from "@/integrations/supabase/client";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", PKR: "₨", AED: "د.إ", INR: "₹",
  CAD: "C$", AUD: "A$", JPY: "¥", CNY: "¥", SAR: "﷼",
};

export const currencySymbol = (code?: string | null) =>
  CURRENCY_SYMBOLS[(code ?? "USD").toUpperCase()] ?? `${(code ?? "USD").toUpperCase()} `;

const LS_KEY = "geflow.activeBusinessId";

/* ------------------------------------------------------------------ *
 * Shared active-business currency store.
 * The workspace currency comes from the business category the admin
 * assigned (businesses.currency), so changing a category's currency in
 * the admin panel propagates to the user panel live.
 * ------------------------------------------------------------------ */
type BizMoney = { currency: string | null; taxRate: number | null };
let cache: BizMoney = { currency: null, taxRate: null };
let started = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((fn) => fn());

const loadBusinessMoney = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { cache = { currency: null, taxRate: null }; emit(); return; }
  const { data } = await supabase
    .from("businesses")
    .select("id, currency, default_tax, created_at")
    .eq("owner_user_id", user.id)
    .order("created_at", { ascending: true });
  const rows = data ?? [];
  const saved = localStorage.getItem(LS_KEY);
  const row = rows.find((r: any) => r.id === saved) ?? rows[0];
  cache = row
    ? { currency: (row as any).currency ?? null, taxRate: Number((row as any).default_tax ?? 0) }
    : { currency: null, taxRate: null };
  emit();
};

const startBusinessMoney = () => {
  if (started) return;
  started = true;
  loadBusinessMoney();
  window.addEventListener("geflow:business-changed", loadBusinessMoney);
  supabase
    .channel(`business_currency_rt_${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, () => loadBusinessMoney())
    .on("postgres_changes", { event: "*", schema: "public", table: "business_categories" }, () => loadBusinessMoney())
    .subscribe();
};

/** Currency + tax of the active business (null when signed out / no business). */
export const useBusinessMoney = (): BizMoney => {
  const [state, setState] = useState<BizMoney>(cache);
  useEffect(() => {
    startBusinessMoney();
    const fn = () => setState({ ...cache });
    subs.add(fn);
    fn();
    return () => { subs.delete(fn); };
  }, []);
  return state;
};

export interface MoneyOptions {
  /**
   * "auto"     – use the active business currency when available, else platform (default)
   * "platform" – always the platform base currency (landing pricing, checkout, invoices)
   */
  scope?: "auto" | "platform";
}

/**
 * Reactive money + tax helpers.
 * Platform settings drive public pages; the active business category drives
 * the user workspace. Both update live without a refresh.
 */
export const useMoney = (options: MoneyOptions = {}) => {
  const { scope = "auto" } = options;
  const { settings } = usePlatformSettings();
  const biz = useBusinessMoney();

  const platformCode = (settings?.base_currency as string) ?? "USD";
  const code = scope === "platform" ? platformCode : (biz.currency ?? platformCode);
  const sym = currencySymbol(code);

  const platformTax = Number(settings?.universal_tax ?? 0);
  const taxRate = scope === "platform" ? platformTax : (biz.taxRate ?? platformTax);

  const invoicePrefix = ((settings?.invoice_prefix as string) ?? "INV").trim().replace(/-+$/, "") || "INV";

  const format = (n: number) =>
    `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  /** Price formatting with fixed 2 decimals (pricing tables, checkout). */
  const price = (n: number) =>
    `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  /** Build an invoice number using the platform prefix, e.g. GF-8FA3C1. */
  const invoiceNo = (seed?: string) => {
    const tail = (seed ?? Date.now().toString()).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
    return `${invoicePrefix}-${tail}`;
  };

  return { currency: code, symbol: sym, taxRate, invoicePrefix, invoiceNo, format, price };
};
