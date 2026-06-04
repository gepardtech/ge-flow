import { useEffect, useState, useCallback } from "react";
import { TriangleAlert, RefreshCw, Zap, Package } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface LowProduct {
  id: string; name: string; internal_sku: string | null; barcode: string | null;
  category_id: string | null; stock_units: number; min_stock_alert: number;
}

const UserLowStock = () => {
  const { active, loading: bizLoading } = useActiveBusiness();
  const { toast } = useToast();
  const [rows, setRows] = useState<LowProduct[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!active) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, internal_sku, barcode, category_id, stock_units, min_stock_alert")
      .eq("business_id", active.id)
      .order("stock_units", { ascending: true });
    const low = (data ?? []).filter((p) => p.stock_units > 0 && p.stock_units <= p.min_stock_alert);
    setRows(low as LowProduct[]);
    setLoading(false);
  }, [active]);

  useEffect(() => { if (!bizLoading) load(); }, [bizLoading, load]);

  useEffect(() => {
    if (!active) return;
    const ch = supabase.channel(`lowstock-${active.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `business_id=eq.${active.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active, load]);

  const filtered = rows.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()) || (r.internal_sku ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <UserPanelGate pageTitle="Low Stock">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl md:text-4xl font-bold">Low Stock Alerts</h1>
            <span className="text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500">{rows.length} WARNINGS ACTIVE</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Prevent stock-outs by replenishing SKUs approaching zero thresholds.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} className="h-11 rounded-xl font-bold"><RefreshCw className="h-4 w-4 mr-2" /> Sync Levels</Button>
        </div>
      </div>

      <div className="relative mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search low stock SKUs..." className="w-full h-12 pl-4 pr-4 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="font-bold">No low stock items</p>
            <p className="text-sm text-muted-foreground mt-1">All products are above their safety thresholds.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-[10px] font-bold tracking-widest text-muted-foreground border-b border-border">
                <th className="text-left px-6 py-4">PRODUCT / SKU</th>
                <th className="text-left px-6 py-4">STOCK NODE</th>
                <th className="text-left px-6 py-4">SAFETY THRESHOLD</th>
                <th className="text-left px-6 py-4">THREAT LEVEL</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const critical = p.stock_units <= p.min_stock_alert / 2;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl ${critical ? "bg-rose-500/15 text-rose-500" : "bg-amber-500/15 text-amber-500"} flex items-center justify-center`}><Package className="h-4 w-4" /></div>
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground tracking-wider">{p.internal_sku || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className={`text-lg font-bold ${critical ? "text-rose-500" : "text-amber-500"}`}>{p.stock_units}</span><p className="text-[10px] text-muted-foreground tracking-wider">UNITS ON HAND</p></td>
                    <td className="px-6 py-4 font-bold">{p.min_stock_alert}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full ${critical ? "bg-rose-500/15 text-rose-500" : "bg-amber-500/15 text-amber-500"}`}>{critical ? "CRITICAL" : "LOW STOCK"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </UserPanelGate>
  );
};

export default UserLowStock;
