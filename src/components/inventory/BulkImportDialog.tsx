import { useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle2, X } from "lucide-react";

interface CatOpt { id: string; name: string; }
interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  businessId: string;
  ownerUserId: string;
  categories: CatOpt[];
  onSaved: () => void;
}

const REQUIRED = ["name"];
const TEMPLATE =
  "Name,ID,Category,Stock,Price,Discount,Status,Images\n" +
  "Example Product,SKU-001,General,25,49.99,39.99,active,https://example.com/a.jpg|https://example.com/b.jpg\n";

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

interface ParsedRow {
  line: number;
  raw: Record<string, string>;
  errors: string[];
  warnings: string[];
}

const BulkImportDialog = ({ open, onOpenChange, businessId, ownerUserId, categories, onSaved }: Props) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [missingCols, setMissingCols] = useState<string[]>([]);

  const valid = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const invalid = useMemo(() => rows.filter((r) => r.errors.length > 0), [rows]);

  const reset = () => { setRows([]); setFileName(null); setMissingCols([]); };

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "geflow_products_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (f: File | null) => {
    if (!f) return;
    reset();
    const text = await f.text();
    const table = parseCSV(text);
    if (table.length < 2) {
      toast({ title: "Empty or invalid CSV", description: "The file needs a header row and at least one product.", variant: "destructive" });
      return;
    }
    const headers = table[0].map((h) => h.trim().toLowerCase());
    setMissingCols(REQUIRED.filter((c) => !headers.includes(c)));

    const catNames = new Set(categories.map((c) => c.name.toLowerCase()));
    const parsed: ParsedRow[] = table.slice(1).map((r, idx) => {
      const raw: Record<string, string> = {};
      headers.forEach((h, i) => { raw[h] = (r[i] ?? "").trim(); });
      const errors: string[] = [];
      const warnings: string[] = [];
      if (!raw["name"]) errors.push("Name is required");
      if (raw["stock"] && Number.isNaN(Number(raw["stock"]))) errors.push("Stock must be a number");
      if (raw["price"] && Number.isNaN(Number(raw["price"]))) errors.push("Price must be a number");
      if (raw["discount"] && Number.isNaN(Number(raw["discount"]))) errors.push("Discount must be a number");
      if (raw["status"] && !["active", "draft", "archived"].includes(raw["status"].toLowerCase())) errors.push("Status must be active, draft or archived");
      if (raw["category"] && !catNames.has(raw["category"].toLowerCase())) warnings.push("Unknown category — imported uncategorized");
      return { line: idx + 2, raw, errors, warnings };
    });
    setRows(parsed);
    setFileName(f.name);
  };

  const doImport = async () => {
    if (!valid.length) return;
    setBusy(true);
    const catByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));
    const payload = valid.map(({ raw: r }) => ({
      business_id: businessId,
      owner_user_id: ownerUserId,
      name: r["name"],
      internal_sku: r["id"] || null,
      category_id: catByName.get((r["category"] || "").toLowerCase()) ?? null,
      stock_units: parseInt(r["stock"]) || 0,
      retail_price: Number(r["price"]) || 0,
      discount_price: r["discount"] ? Number(r["discount"]) : null,
      min_stock_alert: 10,
      status: (r["status"] || "active").toLowerCase(),
      images: r["images"] ? r["images"].split("|").map((s) => s.trim()).filter(Boolean) : [],
    }));

    // Chunked insert so large files don't hit payload limits.
    let inserted = 0;
    for (let i = 0; i < payload.length; i += 200) {
      const chunk = payload.slice(i, i + 200);
      const { error } = await supabase.from("products").insert(chunk);
      if (error) {
        setBusy(false);
        toast({ title: "Import failed", description: `${inserted} rows imported before the error: ${error.message}`, variant: "destructive" });
        onSaved();
        return;
      }
      inserted += chunk.length;
    }
    setBusy(false);
    toast({ title: "Import complete", description: `${inserted} products added${invalid.length ? `, ${invalid.length} rows skipped` : ""}.` });
    reset();
    onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-sky-400/15 text-sky-500 flex items-center justify-center">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            Bulk Product Import
          </DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: Name, ID, Category, Stock, Price, Discount, Status, Images (pipe-separated URLs).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-2">
          <p className="text-xs text-muted-foreground">Not sure about the format? Start from our template.</p>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Template
          </Button>
        </div>

        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden
          onChange={(e) => { onFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />

        {!rows.length ? (
          <button onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl border-2 border-dashed border-border p-10 flex flex-col items-center gap-2 text-muted-foreground hover:border-sky-400 hover:text-sky-500 transition">
            <FileSpreadsheet className="h-9 w-9" />
            <span className="text-sm font-semibold">Click to choose a CSV file</span>
            <span className="text-xs">UTF-8 encoded · up to ~5,000 rows</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheet className="h-4 w-4 text-sky-500 shrink-0" />
                <span className="text-sm font-semibold truncate">{fileName}</span>
              </div>
              <button onClick={reset} className="text-muted-foreground hover:text-destructive" aria-label="Remove file">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-border p-3">
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground">TOTAL ROWS</p>
                <p className="text-xl font-bold">{rows.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-[10px] font-bold tracking-widest text-emerald-600">READY</p>
                <p className="text-xl font-bold text-emerald-600">{valid.length}</p>
              </div>
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-[10px] font-bold tracking-widest text-destructive">SKIPPED</p>
                <p className="text-xl font-bold text-destructive">{invalid.length}</p>
              </div>
            </div>

            {missingCols.length > 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Missing required column(s): {missingCols.join(", ")}</span>
              </div>
            )}

            <div className="max-h-56 overflow-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-bold">#</th>
                    <th className="px-3 py-2 font-bold">Name</th>
                    <th className="px-3 py-2 font-bold">Category</th>
                    <th className="px-3 py-2 font-bold">Stock</th>
                    <th className="px-3 py-2 font-bold">Price</th>
                    <th className="px-3 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 100).map((r) => (
                    <tr key={r.line} className={`border-t border-border ${r.errors.length ? "bg-destructive/5" : ""}`}>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.line}</td>
                      <td className="px-3 py-1.5 font-semibold">
                        {r.raw["name"] || <span className="text-destructive">—</span>}
                        {r.errors.length > 0 && <span className="block text-[10px] text-destructive">{r.errors.join("; ")}</span>}
                        {r.errors.length === 0 && r.warnings.length > 0 && (
                          <span className="block text-[10px] text-amber-600">{r.warnings.join("; ")}</span>
                        )}
                      </td>
                      <td className="px-3 py-1.5">{r.raw["category"] || "—"}</td>
                      <td className="px-3 py-1.5">{r.raw["stock"] || "0"}</td>
                      <td className="px-3 py-1.5">{r.raw["price"] || "0"}</td>
                      <td className="px-3 py-1.5">{(r.raw["status"] || "active").toLowerCase()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {rows.length > 100 && <p className="text-[11px] text-muted-foreground">Showing the first 100 of {rows.length} rows.</p>}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button onClick={doImport} disabled={busy || !valid.length || missingCols.length > 0}
            className="bg-sky-400 hover:bg-sky-500 text-white font-bold">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Import{valid.length ? ` ${valid.length}` : ""} Products
          </Button>
        </div>

        {!!valid.length && !busy && (
          <p className="flex items-center gap-1.5 text-[11px] text-emerald-600 justify-end -mt-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Validation passed for {valid.length} rows
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkImportDialog;
