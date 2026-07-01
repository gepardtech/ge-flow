import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileSpreadsheet } from "lucide-react";

interface CatOpt { id: string; name: string; }
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businessId: string;
  ownerUserId: string;
  categories: CatOpt[];
  onSaved: () => void;
}

// Minimal CSV parser handling quoted values.
const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQuotes = false; }
      else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
};

const BulkImportDialog = ({ open, onOpenChange, businessId, ownerUserId, categories, onSaved }: Props) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<{ count: number } | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);

  const onFile = async (f: File | null) => {
    if (!f) return;
    const text = await f.text();
    const table = parseCSV(text);
    if (table.length < 2) { toast({ title: "Empty or invalid CSV", variant: "destructive" }); return; }
    const headers = table[0].map((h) => h.trim().toLowerCase());
    const parsed = table.slice(1).map((r) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = (r[i] ?? "").trim(); });
      return obj;
    });
    setRows(parsed);
    setPreview({ count: parsed.length });
  };

  const doImport = async () => {
    if (!rows.length) return;
    setBusy(true);
    const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const payload = rows.map((r) => ({
      business_id: businessId, owner_user_id: ownerUserId,
      name: r["name"] || "Unnamed", internal_sku: r["id"] || null,
      category_id: catByName.get((r["category"] || "").toLowerCase()) ?? null,
      stock_units: parseInt(r["stock"]) || 0, retail_price: Number(r["price"]) || 0,
      discount_price: r["discount"] ? Number(r["discount"]) : null,
      min_stock_alert: 10, status: (r["status"] || "active").toLowerCase(),
      images: r["images"] ? r["images"].split("|").map((s) => s.trim()).filter(Boolean) : [],
    }));
    const { error } = await supabase.from("products").insert(payload);
    setBusy(false);
    if (error) { toast({ title: "Import failed", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Import complete", description: `${payload.length} products added.` });
    setPreview(null); setRows([]);
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Import</DialogTitle>
          <DialogDescription>Upload a CSV with columns: Name, ID, Category, Stock, Price, Discount, Status, Images.</DialogDescription>
        </DialogHeader>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        <button onClick={() => fileRef.current?.click()}
          className="w-full my-2 rounded-xl border-2 border-dashed border-border p-8 flex flex-col items-center gap-2 text-muted-foreground hover:border-sky-400 hover:text-sky-500 transition">
          <FileSpreadsheet className="h-8 w-8" />
          <span className="text-sm font-semibold">{preview ? `${preview.count} rows ready to import` : "Click to choose a CSV file"}</span>
        </button>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={doImport} disabled={busy || !preview} className="bg-sky-400 hover:bg-sky-500 text-white font-bold">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}Import Products
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
