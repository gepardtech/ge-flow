import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface BusinessRow {
  id: string;
  business_name: string;
  status: string;
  currency: string;
  default_tax: number;
  stock_alert_limit: number;
  category_id: string | null;
}

const LS_KEY = "geflow.activeBusinessId";

/**
 * Loads businesses owned by the current user and tracks the active one.
 * The active business id persists in localStorage and is used to scope
 * inventory, sales and stock data across the workspace.
 */
export const useActiveBusiness = () => {
  const [businesses, setBusinesses] = useState<BusinessRow[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [industryType, setIndustryType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("businesses")
      .select("id, business_name, status, currency, default_tax, stock_alert_limit, category_id")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true });
    const rows = (data ?? []) as BusinessRow[];
    setBusinesses(rows);
    const saved = localStorage.getItem(LS_KEY);
    const exists = rows.find((r) => r.id === saved);
    const chosen = exists ? saved : rows[0]?.id ?? null;
    setActiveId(chosen);

    const activeRow = rows.find((r) => r.id === chosen);
    if (activeRow?.category_id) {
      const { data: cat } = await supabase
        .from("business_categories")
        .select("industry_type")
        .eq("id", activeRow.category_id)
        .maybeSingle();
      setIndustryType((cat?.industry_type as string) ?? null);
    } else {
      setIndustryType(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const setActive = useCallback((id: string) => {
    localStorage.setItem(LS_KEY, id);
    setActiveId(id);
    window.dispatchEvent(new CustomEvent("geflow:business-changed"));
    load();
  }, [load]);

  const active = businesses.find((b) => b.id === activeId) ?? null;

  return { businesses, active, activeId, setActive, industryType, loading, reload: load };
};
