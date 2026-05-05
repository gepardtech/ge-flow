import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import PanelLayout from "@/components/PanelLayout";
import AuditExportDialog from "@/components/AuditExportDialog";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Search, Filter, Building2, TrendingUp, Zap, Ban, MoreVertical, Eye, BarChart3,
  ArrowUpDown, ShieldOff, ShieldCheck, RotateCcw, Loader2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BusinessRow {
  id: string;
  business_name: string;
  business_address: string | null;
  category_id: string | null;
  status: string;
  listed_products: number;
  usage: number;
  created_at: string;
  last_active: string;
  owner_user_id: string;
  currency: string;
}
interface OwnerInfo { full_name: string | null; email: string | null; plan: string; }
interface CategoryInfo { name: string; industry_type: string; }

const PLAN_PRICES: Record<string, number> = { free: 0, standard: 29, premium: 79, unlimited: 149, lifetime: 299 };
const PLAN_STYLES: Record<string, string> = {
  free: "bg-slate-400/15 text-slate-500",
  standard: "bg-sky-400/15 text-sky-500",
  premium: "bg-violet-400/15 text-violet-500",
  unlimited: "bg-emerald-400/15 text-emerald-500",
  lifetime: "bg-amber-400/15 text-amber-500",
};
const PLANS = ["free", "standard", "premium", "unlimited", "lifetime"];

const bidShort = (idx: number) => `BUS-${String(idx + 1).padStart(3, "0")}`;

const AdminBusinesses = () => {
  const [rows, setRows] = useState<BusinessRow[]>([]);
  const [owners, setOwners] = useState<Record<string, OwnerInfo>>({});
  const [cats, setCats] = useState<Record<string, CategoryInfo>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [view, setView] = useState<BusinessRow | null>(null);
  const [analytics, setAnalytics] = useState<BusinessRow | null>(null);
  const [planChange, setPlanChange] = useState<BusinessRow | null>(null);
  const [planValue, setPlanValue] = useState("free");
  const [suspendBiz, setSuspendBiz] = useState<BusinessRow | null>(null);
  const [resetBiz, setResetBiz] = useState<BusinessRow | null>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();

  const load = useCallback(async () => {
    const [{ data, error }, { data: profs }, { data: catsData }] = await Promise.all([
      supabase.from("businesses").select("*").order("created_at", { ascending: true }),
      supabase.from("profiles").select("user_id, full_name, email, plan"),
      supabase.from("business_categories").select("id, name, industry_type"),
    ]);
    if (error) toast({ title: "Failed to load businesses", description: error.message, variant: "destructive" });
    setRows((data as BusinessRow[]) ?? []);
    const oMap: Record<string, OwnerInfo> = {};
    (profs ?? []).forEach((p: any) => { oMap[p.user_id] = { full_name: p.full_name, email: p.email, plan: p.plan }; });
    setOwners(oMap);
    const cMap: Record<string, CategoryInfo> = {};
    (catsData ?? []).forEach((c: any) => { cMap[c.id] = { name: c.name, industry_type: c.industry_type }; });
    setCats(cMap);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin_businesses_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();
    const onRefresh = () => load();
    window.addEventListener("panel:refresh", onRefresh);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("panel:refresh", onRefresh);
    };
  }, [load]);

  const enriched = useMemo(() => rows.map((r, i) => {
    const o = owners[r.owner_user_id] ?? { full_name: null, email: null, plan: "free" };
    const cat = r.category_id ? cats[r.category_id] : undefined;
    return { ...r, _bid: bidShort(i), _ownerName: o.full_name, _ownerEmail: o.email, _plan: o.plan, _categoryName: cat?.name ?? "Uncategorized", _industry: cat?.industry_type ?? "—" };
  }), [rows, owners, cats]);

  const filtered = useMemo(() => enriched.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (planFilter !== "all" && r._plan !== planFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.business_name.toLowerCase().includes(q) ||
        r._bid.toLowerCase().includes(q) ||
        (r._ownerName ?? "").toLowerCase().includes(q) ||
        (r._ownerEmail ?? "").toLowerCase().includes(q) ||
        r._plan.toLowerCase().includes(q) ||
        r._categoryName.toLowerCase().includes(q)
      );
    }
    return true;
  }), [enriched, search, statusFilter, planFilter]);

  const totalBusinesses = rows.length;
  const platformMRR = rows.reduce((s, r) => s + (PLAN_PRICES[owners[r.owner_user_id]?.plan ?? "free"] ?? 0), 0);
  const premiumHubs = rows.filter((r) => ["premium", "unlimited", "lifetime"].includes(owners[r.owner_user_id]?.plan ?? "")).length;
  const suspendedOrg = rows.filter((r) => r.status === "suspended").length;

  const submitPlanChange = async () => {
    if (!planChange) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ plan: planValue }).eq("user_id", planChange.owner_user_id);
    if (!error) toast({ title: "Plan updated", description: `${planChange.business_name} owner → ${planValue}.` });
    else toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setPlanChange(null); setBusy(false);
  };
  const submitSuspend = async () => {
    if (!suspendBiz) return;
    setBusy(true);
    const next = suspendBiz.status === "suspended" ? "active" : "suspended";
    const { error } = await supabase.from("businesses").update({ status: next }).eq("id", suspendBiz.id);
    if (!error) toast({ title: next === "suspended" ? "Business suspended" : "Business activated" });
    else toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setSuspendBiz(null); setBusy(false);
  };
  const submitReset = async () => {
    if (!resetBiz) return;
    setBusy(true);
    const { error } = await supabase.from("businesses").update({ listed_products: 0, usage: 0 }).eq("id", resetBiz.id);
    if (!error) toast({ title: "Business data reset", description: "Inventory & POS counters cleared." });
    else toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setResetBiz(null); setBusy(false);
  };

  const StatCard = ({ label, value, icon: Icon, accent }: any) => (
    <div className="bg-card border border-border rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl transition-all">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accent}`}><Icon className="h-4 w-4" /></div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );

  return (
    <PanelLayout navItems={ADMIN_NAV} {...ADMIN_IDENTITY} isAdmin>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Businesses Management</h1>
          <p className="text-sm text-muted-foreground">Oversee registered organizations and subscription health.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-10 w-64 pl-10 pr-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 px-4 rounded-xl bg-card border border-border text-sm font-bold inline-flex items-center gap-2 hover:bg-muted transition">
                <Filter className="h-4 w-4" /> Filter
                {(planFilter !== "all" || statusFilter !== "all") && <span className="h-2 w-2 rounded-full bg-sky-500" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-3">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1.5">STATUS</p>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 mb-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1.5">PLAN TIER</p>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="h-9 mb-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  {PLANS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <button
                onClick={() => { setPlanFilter("all"); setStatusFilter("all"); }}
                className="w-full h-9 rounded-lg text-xs font-bold text-muted-foreground hover:bg-muted transition"
              >Clear filters</button>
            </DropdownMenuContent>
          </DropdownMenu>

          <AuditExportDialog
            title="Export Businesses Report"
            filename="geflow-businesses-report"
            rows={enriched}
            dateField="created_at"
            columns={[
              { header: "Export Date", value: () => format(new Date(), "yyyy-MM-dd HH:mm:ss") },
              { header: "Business ID", value: (r) => r._bid },
              { header: "Business Name", value: (r) => r.business_name },
              { header: "Owner", value: (r) => r._ownerName ?? "" },
              { header: "Owner Email", value: (r) => r._ownerEmail ?? "" },
              { header: "Plan", value: (r) => r._plan },
              { header: "Category", value: (r) => r._categoryName },
              { header: "Status", value: (r) => r.status },
              { header: "Created", value: (r) => format(new Date(r.created_at), "yyyy-MM-dd") },
              { header: "Inventory", value: (r) => r.listed_products ?? 0 },
              { header: "MRR ($)", value: (r) => (PLAN_PRICES[r._plan] ?? 0).toFixed(2) },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Businesses" value={totalBusinesses} icon={Building2} accent="bg-sky-400/15 text-sky-500" />
        <StatCard label="Platform MRR" value={`$${platformMRR.toLocaleString()}`} icon={TrendingUp} accent="bg-emerald-400/15 text-emerald-500" />
        <StatCard label="Premium Hubs" value={premiumHubs} icon={Zap} accent="bg-violet-400/15 text-violet-500" />
        <StatCard label="Suspended Org" value={suspendedOrg} icon={Ban} accent="bg-rose-400/15 text-rose-500" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-bold tracking-widest text-muted-foreground border-b border-border">
                <th className="text-left px-6 py-4">BUSINESS / BRAND</th>
                <th className="text-left px-4 py-4">OWNER IDENTITY</th>
                <th className="text-left px-4 py-4">CATEGORY</th>
                <th className="text-left px-4 py-4">PLAN</th>
                <th className="text-left px-4 py-4">STATUS</th>
                <th className="text-left px-4 py-4">REGISTERED</th>
                <th className="text-right px-6 py-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No businesses registered yet. Users will appear here after completing the business setup wizard.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-sky-400/15 text-sky-500 flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
                      <div>
                        <p className="font-bold">{r.business_name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{r._bid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold">{r._ownerName || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{r._ownerEmail}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm font-semibold">{r._categoryName}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{r._industry}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${PLAN_STYLES[r._plan] || PLAN_STYLES.free}`}>{r._plan}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="inline-flex items-center gap-1.5 text-sm font-medium">
                      <span className={`h-2 w-2 rounded-full ${r.status === "suspended" ? "bg-rose-500" : "bg-emerald-500"}`} />
                      <span className="capitalize">{r.status}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-muted-foreground">{format(new Date(r.created_at), "MMM d, yyyy")}</td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="h-8 w-8 rounded-lg hover:bg-muted inline-flex items-center justify-center transition"><MoreVertical className="h-4 w-4" /></button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => setView(r)}><Eye className="h-4 w-4 mr-2" /> View Identity</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setAnalytics(r)}><BarChart3 className="h-4 w-4 mr-2" /> Preview Analytics</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setPlanChange(r); setPlanValue(r._plan); }}><ArrowUpDown className="h-4 w-4 mr-2" /> Upgrade / Downgrade</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setSuspendBiz(r)}>
                          {r.status === "suspended" ? (<><ShieldCheck className="h-4 w-4 mr-2 text-emerald-500" /> Activate Business</>) : (<><ShieldOff className="h-4 w-4 mr-2 text-amber-500" /> Suspend Business</>)}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setResetBiz(r)} className="text-rose-500 focus:text-rose-500">
                          <RotateCcw className="h-4 w-4 mr-2" /> Reset Business Data
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Identity */}
      <Dialog open={!!view} onOpenChange={(o) => !o && setView(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-xl bg-sky-400/15 text-sky-500 flex items-center justify-center"><Building2 className="h-6 w-6" /></div>
              <div>
                <DialogTitle>{view?.business_name}</DialogTitle>
                <DialogDescription className="font-mono text-xs">{view && enriched.find((x) => x.id === view.id)?._bid}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {view && (
            <div className="space-y-3 text-sm">
              <Row label="Owner" value={owners[view.owner_user_id]?.full_name || "Unnamed"} />
              <Row label="Email" value={owners[view.owner_user_id]?.email || "—"} />
              <Row label="Address" value={view.business_address || "—"} />
              <Row label="Category" value={view.category_id ? cats[view.category_id]?.name ?? "—" : "Uncategorized"} />
              <Row label="Industry" value={view.category_id ? cats[view.category_id]?.industry_type ?? "—" : "—"} />
              <Row label="Currency" value={view.currency} />
              <Row label="Registered" value={format(new Date(view.created_at), "MMM d, yyyy")} />
              <Row label="Status" value={<span className="capitalize">{view.status}</span>} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Analytics */}
      <Dialog open={!!analytics} onOpenChange={(o) => !o && setAnalytics(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{analytics?.business_name} — Analytics</DialogTitle>
            <DialogDescription>Live performance snapshot.</DialogDescription>
          </DialogHeader>
          {analytics && (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Listed Products" value={analytics.listed_products ?? 0} />
              <Stat label="Plan MRR" value={`$${PLAN_PRICES[owners[analytics.owner_user_id]?.plan ?? "free"] ?? 0}`} />
              <Stat label="Inventory Health" value={`${Math.min(100, 60 + (analytics.listed_products ?? 0))}%`} />
              <Stat label="AI Insights" value={analytics.usage ?? 0} />
            </div>
          )}
          <DialogFooter><button onClick={() => setAnalytics(null)} className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold">Close</button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Plan change */}
      <Dialog open={!!planChange} onOpenChange={(o) => !o && setPlanChange(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Plan Tier</DialogTitle>
            <DialogDescription>This updates the owner's plan instantly. Premium features sync in realtime.</DialogDescription>
          </DialogHeader>
          <Select value={planValue} onValueChange={setPlanValue}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PLANS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}</SelectContent>
          </Select>
          <DialogFooter className="gap-2">
            <button onClick={() => setPlanChange(null)} className="h-10 px-4 rounded-xl border border-border text-sm font-bold">Cancel</button>
            <button onClick={submitPlanChange} disabled={busy} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Apply Plan
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend */}
      <AlertDialog open={!!suspendBiz} onOpenChange={(o) => !o && setSuspendBiz(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{suspendBiz?.status === "suspended" ? "Reactivate this business?" : "Suspend this business?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {suspendBiz?.status === "suspended"
                ? "The owner will regain access immediately."
                : "The owner will lose access until reactivated."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitSuspend} disabled={busy}>{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset data */}
      <AlertDialog open={!!resetBiz} onOpenChange={(o) => !o && setResetBiz(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset business data?</AlertDialogTitle>
            <AlertDialogDescription>
              Clears inventory and POS counters for <span className="font-bold">{resetBiz?.business_name}</span>. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitReset} disabled={busy} className="bg-rose-500 hover:bg-rose-600">{busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Reset Data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PanelLayout>
  );
};

const Row = ({ label, value }: { label: string; value: any }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
    <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{label}</span>
    <span className="text-sm font-semibold text-right">{value}</span>
  </div>
);
const Stat = ({ label, value }: { label: string; value: any }) => (
  <div className="bg-muted/40 rounded-xl p-3">
    <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{label}</p>
    <p className="text-xl font-bold mt-1">{value}</p>
  </div>
);

export default AdminBusinesses;
