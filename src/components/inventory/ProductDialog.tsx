import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMoney } from "@/lib/currency";
import { Loader2, Package } from "lucide-react";


export interface ProductRecord {
  id: string;
  name: string;
  internal_sku: string | null;
  description: string | null;
  category_id: string | null;
  purchase_cost: number;
  retail_price: number;
  discount_price: number | null;
  stock_units: number;
  min_stock_alert: number;
  batch_number: string | null;
  expiry_date: string | null;
  barcode: string | null;
  status: string;
}

interface CategoryOption {
  id: string;
  name: string;
  inherit_expiry: boolean;
  inherit_batch: boolean;
  inherit_barcode: boolean;
  inherit_alerts: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businessId: string;
  ownerUserId: string;
  product?: ProductRecord | null;
  onSaved: () => void;
}

const emptyForm = {
  name: "",
  internal_sku: "",
  description: "",
  category_id: "",
  purchase_cost: "",
  retail_price: "",
  discount_price: "",
  stock_units: "",
  min_stock_alert: "10",
  batch_number: "",
  expiry_date: "",
  barcode: "",
  status: "active",
};

const ProductDialog = ({ open, onOpenChange, businessId, ownerUserId, product, onSaved }: Props) => {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...emptyForm });
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [saving, setSaving] = useState(false);
  const isEdit = !!product;

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from("product_categories")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      setCategories((data as CategoryOption[]) ?? []);
    })();
  }, [open]);

  useEffect(() => {
    if (open && product) {
      setForm({
        name: product.name ?? "",
        internal_sku: product.internal_sku ?? "",
        description: product.description ?? "",
        category_id: product.category_id ?? "",
        purchase_cost: String(product.purchase_cost ?? ""),
        retail_price: String(product.retail_price ?? ""),
        discount_price: product.discount_price != null ? String(product.discount_price) : "",
        stock_units: String(product.stock_units ?? ""),
        min_stock_alert: String(product.min_stock_alert ?? "10"),
        batch_number: product.batch_number ?? "",
        expiry_date: product.expiry_date ?? "",
        barcode: product.barcode ?? "",
        status: product.status ?? "active",
      });
    } else if (open) {
      setForm({ ...emptyForm });
    }
  }, [open, product]);

  const set = (k: keyof typeof emptyForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Product name required", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      business_id: businessId,
      owner_user_id: ownerUserId,
      name: form.name.trim(),
      internal_sku: form.internal_sku.trim() || null,
      description: form.description.trim() || null,
      category_id: form.category_id || null,
      purchase_cost: Number(form.purchase_cost) || 0,
      retail_price: Number(form.retail_price) || 0,
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      stock_units: parseInt(form.stock_units) || 0,
      min_stock_alert: parseInt(form.min_stock_alert) || 0,
      batch_number: form.batch_number.trim() || null,
      expiry_date: form.expiry_date || null,
      barcode: form.barcode.trim() || null,
      status: form.status,
    };

    let error;
    if (isEdit && product) {
      ({ error } = await supabase.from("products").update(payload).eq("id", product.id));
    } else {
      ({ error } = await supabase.from("products").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Could not save product", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: isEdit ? "Product updated" : "Product added", description: form.name });
    onSaved();
    onOpenChange(false);
  };

  const margin =
    Number(form.retail_price) > 0 && Number(form.purchase_cost) >= 0
      ? Math.round(((Number(form.retail_price) - Number(form.purchase_cost)) / Number(form.retail_price)) * 100)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle>{isEdit ? "Edit Product" : "Add New Product"}</DialogTitle>
              <DialogDescription>{isEdit ? "Update product details and stock." : "Create a new product in your inventory."}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Paracetamol 500mg" />
            </div>
            <div className="space-y-1.5">
              <Label>SKU / Code</Label>
              <Input value={form.internal_sku} onChange={(e) => set("internal_sku", e.target.value)} placeholder="SKU-001" />
            </div>
            <div className="space-y-1.5">
              <Label>Barcode</Label>
              <Input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} placeholder="Scan or enter barcode" />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Optional notes about this product" rows={2} />
            </div>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-4">
            <p className="text-xs font-bold tracking-widest text-muted-foreground">PRICING</p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Purchase Cost</Label>
                <Input type="number" min="0" step="0.01" value={form.purchase_cost} onChange={(e) => set("purchase_cost", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Retail Price</Label>
                <Input type="number" min="0" step="0.01" value={form.retail_price} onChange={(e) => set("retail_price", e.target.value)} placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <Label>Discount Price</Label>
                <Input type="number" min="0" step="0.01" value={form.discount_price} onChange={(e) => set("discount_price", e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Profit margin: <span className={`font-bold ${margin >= 0 ? "text-emerald-500" : "text-rose-500"}`}>{margin}%</span></p>
          </div>

          <div className="rounded-xl border border-border p-4 space-y-4">
            <p className="text-xs font-bold tracking-widest text-muted-foreground">STOCK & BATCH</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Stock Units</Label>
                <Input type="number" min="0" value={form.stock_units} onChange={(e) => set("stock_units", e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Low Stock Alert</Label>
                <Input type="number" min="0" value={form.min_stock_alert} onChange={(e) => set("min_stock_alert", e.target.value)} placeholder="10" />
              </div>
              <div className="space-y-1.5">
                <Label>Batch Number</Label>
                <Input value={form.batch_number} onChange={(e) => set("batch_number", e.target.value)} placeholder="Optional" />
              </div>
              <div className="space-y-1.5">
                <Label>Expiry Date</Label>
                <Input type="date" value={form.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-sky-400 hover:bg-sky-500 text-white font-bold">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEdit ? "Save Changes" : "Add Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
