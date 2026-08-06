import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PublicGateway {
  id: string;
  gateway_key: string;
  name: string;
  enabled: boolean;
  mode: string;
  public_client_id: string | null;
  sort_order: number;
}

/** Public, realtime list of gateways the checkout is allowed to use. */
export const usePaymentGateways = () => {
  const [gateways, setGateways] = useState<PublicGateway[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("public_payment_gateways")
        .select("*")
        .order("sort_order", { ascending: true });
      if (!active) return;
      setGateways((data as unknown as PublicGateway[]) ?? []);
      setLoading(false);
    };
    load();
    const ch = supabase
      .channel(`public_gateways_${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "public_payment_gateways" }, load)
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, []);

  const byKey = (key: string) => gateways.find((g) => g.gateway_key === key) ?? null;
  const paypal = byKey("paypal");

  return {
    gateways,
    loading,
    byKey,
    paypal,
    paypalClientId: paypal?.enabled ? paypal.public_client_id : null,
  };
};
