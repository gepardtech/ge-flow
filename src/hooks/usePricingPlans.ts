import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PricingPlanRow {
  id: string;
  plan_key: string;
  name: string;
  tagline: string | null;
  monthly_price: number;
  yearly_price: number;
  lifetime_price: number;
  features: string[];
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  badge_text: string | null;
  badge_position: string;
  badge_cycle: string;
}

export type BillingCycle = "monthly" | "yearly" | "lifetime";

/** Fallback used only until the live rows arrive (prevents empty flash). */
const FALLBACK: Record<string, Partial<PricingPlanRow>> = {
  free: { name: "Free", monthly_price: 0, yearly_price: 0, lifetime_price: 0 },
  standard: { name: "Standard", monthly_price: 4.99, yearly_price: 14.99, lifetime_price: 49.99 },
  premium: { name: "Premium", monthly_price: 9.99, yearly_price: 24.99, lifetime_price: 99.99 },
};

/**
 * Live pricing plans straight from the admin Billing → Pricing Plans table.
 * Subscribes to realtime so any admin price/feature/badge edit lands on the
 * landing page, checkout and user upgrade screens within a second.
 */
export const usePricingPlans = () => {
  const [plans, setPlans] = useState<PricingPlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("pricing_plans")
      .select("*")
      .order("sort_order", { ascending: true });
    setPlans(((data ?? []) as unknown as PricingPlanRow[]).filter((p) => p.is_active));
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`pricing_plans_rt_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "pricing_plans" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const byKey = (key: string): PricingPlanRow | null => {
    const row = plans.find((p) => p.plan_key?.toLowerCase() === key.toLowerCase());
    if (row) return row;
    const fb = FALLBACK[key];
    return fb ? ({ plan_key: key, features: [], is_active: true, ...fb } as PricingPlanRow) : null;
  };

  const priceOf = (key: string, cycle: BillingCycle): number => {
    const p = byKey(key);
    if (!p) return 0;
    if (cycle === "yearly") return Number(p.yearly_price ?? 0);
    if (cycle === "lifetime") return Number(p.lifetime_price ?? 0);
    return Number(p.monthly_price ?? 0);
  };

  const featuresOf = (key: string, fallback: string[] = []): string[] => {
    const f = byKey(key)?.features;
    return f && f.length ? f : fallback;
  };

  const badgeOf = (key: string, cycle: BillingCycle): string | null => {
    const p = byKey(key);
    if (!p?.badge_text) return null;
    if (p.badge_cycle && p.badge_cycle !== "all" && p.badge_cycle !== cycle) return null;
    return p.badge_text;
  };

  return { plans, loading, byKey, priceOf, featuresOf, badgeOf, reload: load };
};
