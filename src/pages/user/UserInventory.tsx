import { useEffect, useState, useCallback } from "react";
import {
  Package, Plus, Lock, Search, MoreVertical, Eye, ArrowRightLeft, Boxes as BoxesIcon,
  Pencil, Trash2, DollarSign, AlertTriangle, XCircle, ChevronDown, Download, Upload,
  ScanLine, Barcode, PackagePlus, TriangleAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import UserPanelGate from "@/components/UserPanelGate";
import { usePlan } from "@/hooks/usePlan";
import { usePlanLimits } from "@/hooks/usePlanLimits";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { useProductCategories } from "@/hooks/useProductCategories";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ProductDialog, { ProductRecord } from "@/components/inventory/ProductDialog";
import ProductViewDialog from "@/components/inventory/ProductViewDialog";
import StockUpdateDialog from "@/components/inventory/StockUpdateDialog";
import BulkTransferDialog from "@/components/inventory/BulkTransferDialog";
import ExportLedgerDialog from "@/components/inventory/ExportLedgerDialog";
import BulkImportDialog from "@/components/inventory/BulkImportDialog";
import BarcodeLookupDialog from "@/components/inventory/BarcodeLookupDialog";
import RestockWorkflowDialog from "@/components/inventory/RestockWorkflowDialog";
import { useMoney } from "@/lib/currency";

const UserInventory = () => {
  const { plan } = usePlan();
  const { getLimit, isExceeded } = usePlanLimits();
  const { active, businesses, industryType, categoryName, loading: bizLoading } = useActiveBusiness();
  const { all: allCategories } = useProductCategories(industryType, categoryName);
  const { toast } = useToast();
  const { format: fmt } = useMoney();
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState<string>("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRecord | null>(null);
  const [prefill, setPrefill] = useState<Record<string, string> | null>(null);
  const [viewTarget, setViewTarget] = useState<ProductRecord | null>(null);
  const [stockTarget, setStockTarget] = useState<ProductRecord | null>(null);
  const [transferTarget, setTransferTarget] = useState<ProductRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [barcode, setBarcode] = useState<"manual" | "scanner" | null>(null);
  const [restockOpen, setRestockOpen] = useState(false);

  const load = useCallback(async () => {
    if (!active) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, internal_sku, description, category_id, subcategory_id, purchase_cost, retail_price, discount_price, stock_units, min_stock_alert, batch_number, expiry_date, barcode, status, images")
      .eq("business_id", active.id)
      .order("created_at", { ascending: false });
    setProducts((data as ProductRecord[]) ?? []);
    setLoading(false);
  }, [active]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? "");
    })();
  }, []);

  useEffect(() => { if (!bizLoading) load(); }, [bizLoading, load]);

  useEffect(() => {
    if (!active) return;
    const ch = supabase.channel(`inventory-${active.id}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `business_id=eq.${active.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active, load]);

  const catName = (id: string | null) => allCategories.find((c) => c.id === id)?.name ?? "—";

  const productLimit = getLimit("products");
  const used = products.length;
  const exceeded = isExceeded("products", used);

  const totalStockValue = products.reduce((s, p) => s + p.stock_units * Number(p.purchase_cost), 0);
  const lowStock = products.filter((p) => p.stock_units > 0 && p.stock_units <= p.min_stock_alert).length;
  const outOfStock = products.filter((p) => p.stock_units <= 0).length;
  const draftCount = products.filter((p) => p.status !== "active").length;
  const issueCount = lowStock + outOfStock + draftCount;

  const openAdd = (pre?: Record<string, string> | null) => {
    if (exceeded) {
      toast({ title: "Product limit reached", description: `Your ${plan.label} plan allows ${productLimit} products. Upgrade to add more.`, variant: "destructive" });
      return;
    }
    setEditing(null);
    setPrefill(pre ?? null);
    setDialogOpen(true);
  };

  const openEdit = (p: ProductRecord) => { setEditing(p); setPrefill(null); setDialogOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from("products").delete().eq("id", deleteTarget.id);
    if (error) { toast({ title: "Could not delete", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Product deleted", description: deleteTarget.name }); load(); }
    setDeleteTarget(null);
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.internal_sku ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const kpis = [
    { label: "Total Products", value: used, icon: BoxesIcon, color: "text-sky-500 bg-sky-500/15" },
    { label: "Stock Value", value: fmt(totalStockValue), icon: DollarSign, color: "text-emerald-500 bg-emerald-500/15" },
    { label: "Low Stock", value: lowStock, icon: AlertTriangle, color: "text-amber-500 bg-amber-500/15" },
    { label: "Out of Stock", value: outOfStock, icon: XCircle, color: "text-rose-500 bg-rose-500/15" },
  ];

  return (
    <UserPanelGate pageTitle="Inventory">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            All products, batches and stock levels for {active?.business_name ?? "your workspace"}.
            {productLimit !== null && <> <span className="font-semibold">{used}/{productLimit}</span> used.</>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => setExportOpen(true)} className="h-11 rounded-xl font-semibold">
            <Download className="h-4 w-4 mr-2" /> Export Ledger
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)} className="h-11 rounded-xl font-semibold">
            <Upload className="h-4 w-4 mr-2" /> Bulk Import
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={exceeded} className="h-11 px-5 rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-bold disabled:opacity-60">
                {exceeded ? <Lock className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />} New Product <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => openAdd()}><PackagePlus className="h-4 w-4 mr-2" /> Add Manual</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBarcode("scanner")}><ScanLine className="h-4 w-4 mr-2" /> Scan Barcode</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBarcode("manual")}><Barcode className="h-4 w-4 mr-2" /> Direct Barcode Entry</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Alert notification bar */}
      {issueCount > 0 && (
        <div className="flex items-center gap-3 flex-wrap rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 mb-6">
          <TriangleAlert className="h-5 w-5 text-amber-500 shrink-0" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300 flex-1">
            Inventory Deficit Detected — {issueCount} item{issueCount !== 1 ? "s have" : " has"} breached safety thresholds.
          </p>
          <Button size="sm" onClick={() => setRestockOpen(true)} className="bg-background hover:bg-background/80 text-foreground border border-border font-semibold">
            Initiate Restock Workflow →
          </Button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k) => (
          <div key={k.label} className="bg-card border border-border rounded-2xl p-5">
            <div className={`h-10 w-10 rounded-xl ${k.color} flex items-center justify-center mb-3`}><k.icon className="h-5 w-5" /></div>
            <p className="text-2xl font-bold">{k.value}</p>
            <p className="text-xs text-muted-foreground tracking-wider mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products by name, SKU or barcode..." className="w-full h-12 pl-11 pr-4 bg-card border border-border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {bizLoading || loading ? (
          <div className="p-12 text-center text-muted-foreground">Loading inventory...</div>
        ) : !active ? (
          <div className="p-12 text-center">
            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="font-bold">No business selected</p>
            <p className="text-sm text-muted-foreground mt-1">Create or select a business to manage inventory.</p>
            <Button onClick={() => navigate("/dashboard/businesses")} className="mt-4">Go to Businesses</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
            <p className="font-bold">{search ? "No matching products" : "No products yet"}</p>
            <p className="text-sm text-muted-foreground mt-1">{search ? "Try a different search." : "Add your first product to start tracking stock, batches and pricing."}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-[10px] font-bold tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left px-6 py-4">PRODUCT / SKU</th>
                  <th className="text-left px-6 py-4">CATEGORY</th>
                  <th className="text-left px-6 py-4">PRICING</th>
                  <th className="text-left px-6 py-4">STOCK</th>
                  <th className="text-left px-6 py-4">STATUS</th>
                  <th className="text-right px-6 py-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const out = p.stock_units <= 0;
                  const low = !out && p.stock_units <= p.min_stock_alert;
                  const margin = Number(p.retail_price) > 0 ? Math.round(((Number(p.retail_price) - Number(p.purchase_cost)) / Number(p.retail_price)) * 100) : 0;
                  return (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {p.images && p.images[0]
                            ? <img src={p.images[0]} alt="" className="h-10 w-10 rounded-xl object-cover border border-border" />
                            : <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><Package className="h-4 w-4" /></div>}
                          <div>
                            <p className="font-bold text-sm">{p.name}</p>
                            <p className="text-[10px] text-muted-foreground tracking-wider">{p.internal_sku || p.barcode || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="text-xs text-muted-foreground">{catName(p.category_id)}</span></td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-sm">{fmt(Number(p.discount_price ?? p.retail_price))}</p>
                        <p className="text-[10px] text-muted-foreground">cost {fmt(Number(p.purchase_cost))} · <span className={margin >= 0 ? "text-emerald-500" : "text-rose-500"}>{margin}% margin</span></p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-lg font-bold ${out ? "text-rose-500" : low ? "text-amber-500" : "text-foreground"}`}>{p.stock_units}</span>
                        <p className="text-[10px] text-muted-foreground tracking-wider">alert ≤ {p.min_stock_alert}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full ${out ? "bg-rose-500/15 text-rose-500" : low ? "bg-amber-500/15 text-amber-500" : p.status !== "active" ? "bg-muted text-muted-foreground" : "bg-emerald-500/15 text-emerald-500"}`}>
                          {p.status !== "active" ? p.status.toUpperCase() : out ? "OUT OF STOCK" : low ? "LOW STOCK" : "IN STOCK"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuItem onClick={() => setViewTarget(p)}><Eye className="h-4 w-4 mr-2" /> View Identity</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTransferTarget(p)}><ArrowRightLeft className="h-4 w-4 mr-2" /> Bulk Transfer</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStockTarget(p)}><BoxesIcon className="h-4 w-4 mr-2" /> Update Stock</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(p)}><Pencil className="h-4 w-4 mr-2" /> Edit Metadata</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setDeleteTarget(p)} className="text-rose-500 focus:text-rose-500"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {active && userId && (
        <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} businessId={active.id} ownerUserId={userId} product={editing} prefill={prefill} onSaved={load} />
      )}

      <ProductViewDialog open={!!viewTarget} onOpenChange={(v) => { if (!v) setViewTarget(null); }} product={viewTarget} categoryName={catName(viewTarget?.category_id ?? null)} />
      <StockUpdateDialog open={!!stockTarget} onOpenChange={(v) => { if (!v) setStockTarget(null); }} product={stockTarget} onSaved={load} />
      {active && userId && (
        <BulkTransferDialog open={!!transferTarget} onOpenChange={(v) => { if (!v) setTransferTarget(null); }} product={transferTarget} sourceBusinessId={active.id} ownerUserId={userId} businesses={businesses} onSaved={load} />
      )}
      {active && (
        <ExportLedgerDialog open={exportOpen} onOpenChange={setExportOpen} products={products} categoryName={catName} businessName={active.business_name} />
      )}
      {active && userId && (
        <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} businessId={active.id} ownerUserId={userId} categories={allCategories} onSaved={load} />
      )}
      <BarcodeLookupDialog open={!!barcode} onOpenChange={(v) => { if (!v) setBarcode(null); }} mode={barcode ?? "manual"} onResolved={(pre) => openAdd(pre)} />
      <RestockWorkflowDialog open={restockOpen} onOpenChange={setRestockOpen} products={products} onFix={(p) => { setRestockOpen(false); openEdit(p); }} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete product?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <span className="font-semibold">{deleteTarget?.name}</span> and its stock records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-500 hover:bg-rose-600 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UserPanelGate>
  );
};

export default UserInventory;
