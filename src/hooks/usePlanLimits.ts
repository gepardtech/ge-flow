import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlan } from "@/hooks/usePlan";

export interface PlanLimitRow {
  plan_key: string;
  resource_key: string;
  label: string;
  limit_value: number | null; // null = unlimited
  is_locked: boolean;
}

export interface PlanLimitsState {
  loading: boolean;
  /** resource_key -> row for the current user's plan */
  limits: Record<string, PlanLimitRow>;
  /** returns the numeric limit for a resource, or null when unlimited */
  getLimit: (resourceKey: string) => number | null;
  /** true when the resource is fully locked for this plan */
  isLocked: (resourceKey: string) => boolean;
  /** true when usage has reached/exceeded the limit */
  isExceeded: (resourceKey: string, usage: number) => boolean;
}

/**
 * Loads the live plan_limits rows for the current user's plan and keeps
 * them in sync via realtime. Used to enforce quotas on Inventory etc.
 */
export const usePlanLimits = (): PlanLimitsState => {
  const { planId, loading: planLoading } = usePlan();
  const [rows, setRows] = useState<PlanLimitRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (planLoading) return;
    let active = true;

    const load = async () => {
      const { data } = await supabase
        .from("plan_limits")
        .select("plan_key, resource_key, label, limit_value, is_locked")
        .eq("plan_key", planId);
      if (!active) return;
      setRows((data as PlanLimitRow[]) ?? []);
      setLoading(false);
    };

    load();
    const ch = supabase
      .channel(`plan_limits_${planId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "plan_limits" }, load)
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [planId, planLoading]);

  const limits: Record<string, PlanLimitRow> = {};
  rows.forEach((r) => { limits[r.resource_key] = r; });

  const getLimit = (resourceKey: string) => limits[resourceKey]?.limit_value ?? null;
  const isLocked = (resourceKey: string) => limits[resourceKey]?.is_locked ?? false;
  const isExceeded = (resourceKey: string, usage: number) => {
    const row = limits[resourceKey];
    if (!row) return false;
    if (row.is_locked) return true;
    if (row.limit_value === null) return false; // unlimited
    return usage >= row.limit_value;
  };

  return { loading: loading || planLoading, limits, getLimit, isLocked, isExceeded };
};
