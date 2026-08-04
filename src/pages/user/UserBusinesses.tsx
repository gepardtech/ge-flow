import { useState } from "react";
import { Building2, Check, Loader2 } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { supabase } from "@/integrations/supabase/client";
import { CURRENCY_SYMBOLS } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UserBusinesses = () => {
  const { businesses, activeId, setActive, loading } = useActiveBusiness();
  const { toast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);

  const changeCurrency = async (id: string, code: string) => {
    setSaving(id);
    const { error } = await supabase.from("businesses").update({ currency: code }).eq("id", id);
    setSaving(null);
    if (error) { toast({ title: "Could not update currency", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Currency updated", description: `Prices now display in ${code}.` });
    window.dispatchEvent(new Event("geflow:business-changed"));
  };

  return (
    <UserPanelGate pageTitle="My Businesses">
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-1">My Businesses</h1>
        <p className="text-sm text-muted-foreground">Switch between your registered businesses. Inventory and sales are scoped per business.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">Loading...</div>
      ) : businesses.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <Building2 className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-bold">No businesses yet</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((b) => {
            const isActive = b.id === activeId;
            return (
              <div key={b.id} className={`bg-card border rounded-2xl p-5 transition-all ${isActive ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
                <button onClick={() => setActive(b.id)} className="w-full text-left">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
                    {isActive && <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-primary"><Check className="h-3 w-3" /> ACTIVE</span>}
                  </div>
                  <p className="font-bold">{b.business_name}</p>
                  <p className="text-xs text-muted-foreground mt-1 capitalize">{b.status}</p>
                </button>

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1.5 flex items-center gap-2">
                    OPERATING CURRENCY {saving === b.id && <Loader2 className="h-3 w-3 animate-spin" />}
                  </p>
                  <Select value={(b.currency ?? "USD").toUpperCase()} onValueChange={(v) => changeCurrency(b.id, v)}>
                    <SelectTrigger className="h-9 bg-muted/40 border-0 text-xs font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CURRENCY_SYMBOLS).map(([code, sym]) => (
                        <SelectItem key={code} value={code}>{code} <span className="text-muted-foreground ml-1">{sym}</span></SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </UserPanelGate>
  );
};

export default UserBusinesses;
