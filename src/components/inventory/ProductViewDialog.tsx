import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMoney } from "@/lib/currency";
import type { ProductRecord } from "./ProductDialog";
import { Package } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: ProductRecord | null;
  categoryName?: string | null;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
    <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">{label}</span>
    <span className="text-sm font-semibold text-right">{value ?? "—"}</span>
  </div>
);

const ProductViewDialog = ({ open, onOpenChange, product, categoryName }: Props) => {
  const { format: fmt } = useMoney();
  if (!product) return null;
  const out = product.stock_units <= 0;
  const low = !out && product.stock_units <= product.min_stock_alert;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-400/15 text-sky-500 flex items-center justify-center"><Package className="h-5 w-5" /></div>
            <DialogTitle>{product.name}</DialogTitle>
          </div>
        </DialogHeader>
        {product.images && product.images.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {product.images.map((u, i) => <img key={i} src={u} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />)}
          </div>
        )}
        <div>
          <Row label="SKU" value={product.internal_sku} />
          <Row label="Category" value={categoryName} />
          <Row label="Description" value={product.description} />
          <Row label="Purchase Cost" value={fmt(Number(product.purchase_cost))} />
          <Row label="Retail Price" value={fmt(Number(product.retail_price))} />
          <Row label="Discount Price" value={product.discount_price != null ? fmt(Number(product.discount_price)) : "—"} />
          <Row label="Stock Units" value={<span className={out ? "text-rose-500" : low ? "text-amber-500" : "text-emerald-500"}>{product.stock_units}</span>} />
          <Row label="Min Stock Alert" value={product.min_stock_alert} />
          <Row label="Batch Number" value={product.batch_number} />
          <Row label="Expiry Date" value={product.expiry_date} />
          <Row label="Barcode" value={product.barcode} />
          <Row label="Status" value={<span className="uppercase text-xs font-bold">{product.status}</span>} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductViewDialog;
