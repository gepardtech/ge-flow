import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ShoppingBag, Package, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMoney } from "@/lib/currency";

export interface PurchaseRecord {
  id: string;
  business_id: string;
  owner_user_id: string;
  supplier_name: string;
  invoice_ref: string | null;
  entry_date: string;
  total: number;
  status: string;
  created_at: string;
}

interface PurchaseItemRow {
  id: string;
  product_name: string;
  quantity: number;
  purchase_price: number;
  sale_price: number;
  batch_number: string | null;
  expiry_date: string | null;
}

interface Props {
  purchase: PurchaseRecord | null;
  onOpenChange: (v: boolean) => void;
}

const PurchaseLedgerDialog = ({ purchase, onOpenChange }: Props) => {
  const { format: fmt } = useMoney();
  const [items, setItems] = useState<PurchaseItemRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!purchase) return;
    setLoading(true);
    supabase
      .from("purchase_items")
      .select("id, product_name, quantity, purchase_price, sale_price, batch_number, expiry_date")
      .eq("purchase_id", purchase.id)
      .then(({ data }) => {
        setItems((data as PurchaseItemRow[]) ?? []);
        setLoading(false);
      });
  }, [purchase]);

  return (
    <Dialog open={!!purchase} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-sky-500" />
            Purchase Ledger · PUR-{purchase?.id.slice(0, 4).toUpperCase()}
          </DialogTitle>
          <DialogDescription>
            {purchase?.supplier_name || "Supplier"} · {purchase?.invoice_ref || "no invoice"} ·{" "}
            {purchase ? new Date(purchase.entry_date).toLocaleDateString() : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-[1.6fr_0.5fr_0.8fr_0.8fr_1fr] gap-2 px-4 py-2.5 bg-muted/40 text-[10px] font-bold tracking-widest text-muted-foreground">
            <span>PRODUCT</span><span>QTY</span><span>PURCHASE</span><span>SALE</span><span>BATCH / EXPIRY</span>
          </div>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No line items recorded.</div>
          ) : (
            <div className="divide-y divide-border">
              {items.map((it) => (
                <div key={it.id} className="grid grid-cols-[1.6fr_0.5fr_0.8fr_0.8fr_1fr] gap-2 px-4 py-3 text-sm items-center">
                  <span className="font-semibold flex items-center gap-2 min-w-0">
                    <Package className="h-3.5 w-3.5 text-sky-500 flex-shrink-0" />
                    <span className="truncate">{it.product_name}</span>
                  </span>
                  <span>{it.quantity}</span>
                  <span>{fmt(Number(it.purchase_price))}</span>
                  <span>{fmt(Number(it.sale_price))}</span>
                  <span className="text-xs text-muted-foreground">
                    {it.batch_number || "—"}{it.expiry_date ? ` · ${new Date(it.expiry_date).toLocaleDateString()}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{purchase?.status}</span>
          <div className="text-right">
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground">TOTAL VALUE</p>
            <p className="text-xl font-extrabold text-sky-500">{fmt(Number(purchase?.total ?? 0))}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PurchaseLedgerDialog;
