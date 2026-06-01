import { useEffect, useState } from "react";
import { Package, Plus, Lock, AlertTriangle, Infinity as InfinityIcon, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserPanelGate from "@/components/UserPanelGate";
import { usePlan } from "@/hooks/usePlan";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const UserInventory = () => {
  const { plan } = usePlan();
  const { getLimit, isExceeded, loading } = usePlanLimits();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [used, setUsed] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("listed_products").eq("user_id", user.id).maybeSingle();
      setUsed((data as any)?.listed_products ?? 0);
    })();
  }, []);

  const productLimit = getLimit("products"); // null = unlimited
  const exceeded = isExceeded("products", used);
  const pct = productLimit === null ? 0 : Math.min(100, Math.round((used / productLimit) * 100));

  const handleAdd = () => {
    if (exceeded) {
      toast({
        title: "Product limit reached",
        description: `Your ${plan.label} plan allows ${productLimit} products. Upgrade to add more.`,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Ready to add a product", description: "Product form coming up next." });
  };

  return (
    <UserPanelGate pageTitle="Inventory">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Inventory</h1>
          <p className="text-sm text-muted-foreground">All products, batches and stock levels for your {plan.label} workspace.</p>
        </div>
        <Button onClick={handleAdd} disabled={exceeded} className="h-11 px-5 rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-bold disabled:opacity-60">
          {exceeded ? <Lock className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Add Product
        </Button>
      </div>

      {/* Live quota card driven by plan_limits */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-sky-400/15 text-sky-500 flex items-center justify-center"><Package className="h-4 w-4" /></div>
            <div>
              <p className="font-bold">Product Quota</p>
              <p className="text-xs text-muted-foreground">Live limit enforced from your plan tier.</p>
            </div>
          </div>
          <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full ${plan.badgeClass}`}>{plan.label.toUpperCase()}</span>
        </div>

        {loading ? (
          <div className="h-2 w-full bg-muted rounded-full animate-pulse" />
        ) : (
          <>
            <div className="flex items-end justify-between mb-2">
              <p className="text-2xl font-bold">{used} <span className="text-sm font-medium text-muted-foreground">used</span></p>
              <p className="text-sm font-bold text-muted-foreground inline-flex items-center gap-1">
                {productLimit === null ? <><InfinityIcon className="h-4 w-4 text-emerald-500" /> Unlimited</> : `of ${productLimit}`}
              </p>
            </div>
            {productLimit !== null && (
              <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-sky-400"}`} style={{ width: `${pct}%` }} />
              </div>
            )}
          </>
        )}

        {exceeded ? (
          <div className="mt-4 flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
            <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0" />
            <p className="text-xs flex-1">You've reached your product limit. Upgrade your plan to keep adding inventory.</p>
            <Button onClick={() => navigate("/dashboard/subscription")} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">Upgrade</Button>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" /> You can keep adding products within your plan limit.
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-12 text-center">
        <Package className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="font-bold">No products yet</p>
        <p className="text-sm text-muted-foreground mt-1">Add your first product to start tracking stock, batches and pricing.</p>
      </div>
    </UserPanelGate>
  );
};

export default UserInventory;
