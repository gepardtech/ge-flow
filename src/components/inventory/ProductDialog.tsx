import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useMoney } from "@/lib/currency";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { useProductCategories } from "@/hooks/useProductCategories";
import { Loader2, PackagePlus, Camera, X, Zap } from "lucide-react";

export interface ProductRecord {
  id: string;
  name: string;
  internal_sku: string | null;
  description: string | null;
  category_id: string | null;
  subcategory_id?: string | null;
  purchase_cost: number;
  retail_price: number;
  discount_price: number | null;
  stock_units: number;
  min_stock_alert: number;
  batch_number: string | null;
  expiry_date: string | null;
  barcode: string | null;
  status: string;
  images?: string[] | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businessId: string;
  ownerUserId: string;
  product?: ProductRecord | null;
  /** Prefill values from a barcode scan / lookup. */
  prefill?: Partial<Record<string, string>> | null;
  onSaved: () => void;
}

const emptyForm = {
  name: "", internal_sku: "", description: "",
  category_id: "", subcategory_id: "",
  purchase_cost: "", retail_price: "", discount_price: "",
  stock_units: "", min_stock_alert: "10",
  batch_number: "", expiry_date: "", barcode: "", status: "active",
};

const MAX_IMAGES = 7;
const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-bold tracking-widest text-sky-500 mb-1.5">{children}</p>
);

const ProductDialog = ({ open, onOpenChange, businessId, ownerUserId, product, prefill, onSaved }: Props) => {
  const { toast } = useToast();
  const { symbol } = useMoney();
  const { industryType, categoryName, enabledFeatures } = useActiveBusiness();
  const { parents, subcategoriesOf, all } = useProductCategories(industryType, categoryName);

  const [form, setForm] = useState({ ...emptyForm });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const isEdit = !!product;

  useEffect(() => {
    if (!open) return;
    if (product) {
      setForm({
        name: product.name ?? "", internal_sku: product.internal_sku ?? "",
        description: product.description ?? "", category_id: product.category_id ?? "",
        subcategory_id: product.subcategory_id ?? "",
        purchase_cost: String(product.purchase_cost ?? ""), retail_price: String(product.retail_price ?? ""),
        discount_price: product.discount_price != null ? String(product.discount_price) : "",
        stock_units: String(product.stock_units ?? ""), min_stock_alert: String(product.min_stock_alert ?? "10"),
        batch_number: product.batch_number ?? "", expiry_date: product.expiry_date ?? "",
        barcode: product.barcode ?? "", status: product.status ?? "active",
      });
      setImages(product.images ?? []);
    } else {
      setForm({ ...emptyForm, ...(prefill ?? {}) });
      setImages([]);
    }
  }, [open, product, prefill]);

  const set = (k: keyof typeof emptyForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v, ...(k === "category_id" ? { subcategory_id: "" } : {}) }));

  // Feature gating: only show fields the admin enabled for this business category.
  const feat = (id: string) => !enabledFeatures || enabledFeatures.includes(id);
  const selectedParent = all.find((c) => c.id === form.category_id) ?? null;
  const catAllows = (flag: keyof NonNullable<typeof selectedParent>) => !selectedParent || (selectedParent as any)[flag];

  const showDiscount = feat("discount");
  const showAlert = feat("lowstock");
  const showBatch = feat("batch") && catAllows("inherit_batch");
  const showExpiry = feat("expiry") && catAllows("inherit_expiry");
  const showBarcode = feat("barcode") && catAllows("inherit_barcode");
  const showLifecycle = showBatch || showExpiry || showBarcode;

  const subs = useMemo(() => subcategoriesOf(form.category_id || null), [form.category_id, all]);

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) { toast({ title: "Max 7 images", variant: "destructive" }); return; }
    setUploading(true);
    const next: string[] = [];
    for (const file of Array.from(files).slice(0, room)) {
      const path = `${ownerUserId}/${businessId}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); continue; }
      const { data: signed } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signed?.signedUrl) next.push(signed.signedUrl);
    }
    setImages((prev) => [...prev, ...next]);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: "Product identity required", variant: "destructive" }); return; }
    setSaving(true);
    const payload = {
      business_id: businessId, owner_user_id: ownerUserId,
      name: form.name.trim(), internal_sku: form.internal_sku.trim() || null,
      description: form.description.trim() || null,
      category_id: form.category_id || null, subcategory_id: form.subcategory_id || null,
      purchase_cost: Number(form.purchase_cost) || 0, retail_price: Number(form.retail_price) || 0,
      discount_price: form.discount_price ? Number(form.discount_price) : null,
      stock_units: parseInt(form.stock_units) || 0, min_stock_alert: parseInt(form.min_stock_alert) || 10,
      batch_number: form.batch_number.trim() || null, expiry_date: form.expiry_date || null,
      barcode: form.barcode.trim() || null, status: form.status, images,
    };
    let error;
    if (isEdit && product) ({ error } = await supabase.from("products").update(payload).eq("id", product.id));
    else ({ error } = await supabase.from("products").insert(payload));
    setSaving(false);
    if (error) { toast({ title: "Could not save product", description: error.message, variant: "destructive" }); return; }
    toast({ title: isEdit ? "SKU updated" : "SKU committed to production", description: form.name });
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] p-0 gap-0 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-sky-400/15 text-sky-500 flex items-center justify-center">
              <PackagePlus className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold leading-tight">{isEdit ? "Edit Metadata" : "Register SKU"}</h2>
              <p className="text-sm text-sky-500/90">Add a new product to your inventory database.</p>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Identity */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>PRODUCT IDENTITY</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Paracetamol 500mg" />
            </div>
            <div>
              <Label>INTERNAL SKU (OPTIONAL)</Label>
              <Input value={form.internal_sku} onChange={(e) => set("internal_sku", e.target.value)} placeholder="Leave blank for auto-gen" />
            </div>
          </div>

          <div>
            <Label>BRIEF METADATA (SHORT DETAIL)</Label>
            <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Technical specifications or clinical usage..." rows={3} />
          </div>

          {/* Categorization */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>PRIMARY CATEGORY</Label>
              <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                <SelectContent>
                  {parents.length === 0 && <SelectItem value="none" disabled>No categories for this business type</SelectItem>}
                  {parents.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>SUBCATEGORY</Label>
              <Select value={form.subcategory_id} onValueChange={(v) => set("subcategory_id", v)} disabled={!form.category_id || subs.length === 0}>
                <SelectTrigger><SelectValue placeholder="Select Subcategory" /></SelectTrigger>
                <SelectContent>
                  {subs.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pricing */}
          <div className={`grid gap-4 ${showDiscount ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
            <div>
              <Label>PURCHASE COST ({symbol})</Label>
              <Input type="number" min="0" step="0.01" value={form.purchase_cost} onChange={(e) => set("purchase_cost", e.target.value)} placeholder="0" />
            </div>
            <div>
              <Label>RETAIL PRICE ({symbol})</Label>
              <Input type="number" min="0" step="0.01" value={form.retail_price} onChange={(e) => set("retail_price", e.target.value)} placeholder="0" />
            </div>
            {showDiscount && (
              <div>
                <Label>DISCOUNT PRICE ({symbol})</Label>
                <Input type="number" min="0" step="0.01" value={form.discount_price} onChange={(e) => set("discount_price", e.target.value)} placeholder="0" />
              </div>
            )}
          </div>

          {/* Stock */}
          <div className={`grid gap-4 ${showAlert ? "sm:grid-cols-2" : "sm:grid-cols-1"}`}>
            <div>
              <Label>STOCK UNITS</Label>
              <Input type="number" min="0" value={form.stock_units} onChange={(e) => set("stock_units", e.target.value)} placeholder="0" />
            </div>
            {showAlert && (
              <div>
                <Label>MIN STOCK ALERT</Label>
                <Input type="number" min="0" value={form.min_stock_alert} onChange={(e) => set("min_stock_alert", e.target.value)} placeholder="10" />
              </div>
            )}
          </div>

          {/* Product assets */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>PRODUCT ASSETS (MAX 7)</Label>
              <span className="text-[10px] font-bold text-sky-500">{images.length}/{MAX_IMAGES} slots filled</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => uploadImages(e.target.files)} />
            <div className="flex flex-wrap gap-3">
              {images.map((url, i) => (
                <div key={i} className="relative h-20 w-20 rounded-xl overflow-hidden border border-border group">
                  <img src={url} alt={`asset ${i + 1}`} className="h-full w-full object-cover" />
                  <button type="button" onClick={() => setImages((p) => p.filter((_, x) => x !== i))}
                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-background/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="h-20 w-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-sky-400 hover:text-sky-500 transition">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  <span className="text-[9px] font-bold tracking-wider">ADD</span>
                </button>
              )}
            </div>
          </div>

          {/* Lifecycle */}
          {showLifecycle && (
            <div className="border-t border-dashed border-border pt-5 grid sm:grid-cols-3 gap-4">
              {showBatch && (
                <div>
                  <Label>BATCH NUMBER</Label>
                  <Input value={form.batch_number} onChange={(e) => set("batch_number", e.target.value)} placeholder="Optional" />
                </div>
              )}
              {showExpiry && (
                <div>
                  <Label>EXPIRY DATE</Label>
                  <Input type="date" value={form.expiry_date} onChange={(e) => set("expiry_date", e.target.value)} />
                </div>
              )}
              {showBarcode && (
                <div>
                  <Label>GLOBAL BARCODE</Label>
                  <Input value={form.barcode} onChange={(e) => set("barcode", e.target.value)} placeholder="Optional" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-bold text-base">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
            {isEdit ? "Save Changes" : "Commit SKU to Production"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
