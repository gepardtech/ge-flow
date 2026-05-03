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
  user_id: string;
  full_name: string | null;
  email: string | null;
  plan: string;
  status: string;
  usage: number;
  listed_products: number;
  created_at: string;
  last_active: string;
}

const PLAN_PRICES: Record<string, number> = { free: 0, standard: 29, premium: 79, unlimited: 149, lifetime: 299 };
const PLAN_STYLES: Record<string, string> = {
  free: "bg-slate-400/15 text-slate-500",
  standard: "bg-sky-400/15 text-sky-500",
  premium: "bg-violet-400/15 text-violet-500",
  unlimited: "bg-emerald-400/15 text-emerald-500",
  lifetime: "bg-amber-400/15 text-amber-500",
};
const PLANS = ["free", "standard", "premium", "unlimited", "lifetime"];

const businessId = (id: string, idx: number) => `BUS-${String(idx + 1).padStart(3, "0")}`;
const businessName = (b: BusinessRow) => {
  if (b.full_name) return `${b.full_name.split(" ")[0]} ${b.plan === "premium" || b.plan === "unlimited" ? "Pharmacy" : "Workspace"}`;
  return `${(b.email ?? "Unnamed").split("@")[0]} Workspace`;
};

const AdminBusinesses = () => {
  const [rows, setRows] = useState<BusinessRow[]>([]);
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
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, plan, status, usage, listed_products, created_at, last_active")
      .order("created_at", { ascending: true });
    if (error) toast({ title: "Failed to load businesses", description: error.message, variant: "destructive" });
    setRows((data as BusinessRow[]) ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin_businesses_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();
    const onRefresh = () => load();
    window.addEventListener("panel:refresh", onRefresh);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("panel:refresh", onRefresh);
    };
  }, [load]);

  const indexed = useMemo(() => rows.map((r, i) => ({ ...r, _bid: businessId(r.user_id, i), _bname: businessName(r) })), [rows]);

  const filtered = useMemo(() => {
    return indexed.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (planFilter !== "all" && r.plan !== planFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          r._bname.toLowerCase().includes(q) ||
          r._bid.toLowerCase().includes(q) ||
          (r.full_name ?? "").toLowerCase().includes(q) ||
          (r.email ?? "").toLowerCase().includes(q) ||
          r.plan.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indexed, search, statusFilter, planFilter]);

  const totalBusinesses = rows.length;
  const platformMRR = rows.reduce((s, r) => s + (PLAN_PRICES[r.plan] ?? 0), 0);
  const premiumHubs = rows.filter((r) => ["premium", "unlimited", "lifetime"].includes(r.plan)).length;
  const suspendedOrg = rows.filter((r) => r.status === "suspended").length;

  const updateRow = async (userId: string, patch: Partial<BusinessRow>) => {
    const { error } = await supabase.from("profiles").update(patch).eq("user_id", userId);
    if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return false; }
    return true;
  };

  const submitPlanChange = async () => {
    if (!planChange) return;
    setBusy(true);
    const ok = await updateRow(planChange.user_id, { plan: planValue });
    if (ok) toast({ title: "Plan updated", description: `${businessName(planChange)} → ${planValue}.` });
    setPlanChange(null); setBusy(false);
  };
  const submitSuspend = async () => {
    if (!suspendBiz) return;
    setBusy(true);
    const next = suspendBiz.status === "suspended" ? "active" : "suspended";
    const ok = await updateRow(suspendBiz.user_id, { status: next });
    if (ok) toast({ title: next === "suspended" ? "Business suspended" : "Business activated" });
    setSuspendBiz(null); setBusy(false);
  };
  const submitReset = async () => {
    if (!resetBiz) return;
    setBusy(true);
    const ok = await updateRow(resetBiz.user_id, { listed_products: 0, usage: 0 });
    if (ok) toast({ title: "Business data reset", description: "Inventory & POS counters cleared." });
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
            rows={indexed}
            dateField="created_at"
            columns={[
              { header: "Export Date", value: () => format(new Date(), "yyyy-MM-dd HH:mm:ss") },
              { header: "Business ID", value: (r) => r._bid },
              { header: "Business Name", value: (r) => r._bname },
              { header: "Owner", value: (r) => r.full_name ?? "" },
              { header: "Owner Email", value: (r) => r.email ?? "" },
              { header: "Plan", value: (r) => r.plan },
              { header: "Status", value: (r) => r.status },
              { header: "Created", value: (r) => format(new Date(r.created_at), "yyyy-MM-dd") },
              { header: "Inventory", value: (r) => r.listed_products ?? 0 },
              { header: "MRR ($)", value: (r) => (PLAN_PRICES[r.plan] ?? 0).toFixed(2) },
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
                <th className="text-left px-4 py-4">PLAN TIER</th>
                <th className="text-left px-4 py-4">STATUS</th>
                <th className="text-left px-4 py-4">REGISTERED ON</th>
                <th className="text-right px-6 py-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">Loading businesses...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-muted-foreground">No businesses match your filters.</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.user_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-sky-400/15 text-sky-500 flex items-center justify-center"><Building2 className="h-5 w-5" /></div>
                      <div>
                        <p className="font-bold">{r._bname}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">{r._bid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold">{r.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${PLAN_STYLES[r.plan] || PLAN_STYLES.free}`}>{r.plan}</span>
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
                        <DropdownMenuItem onClick={() => { setPlanChange(r); setPlanValue(r.plan); }}><ArrowUpDown className="h-4 w-4 mr-2" /> Upgrade / Downgrade</DropdownMenuItem>
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
                <DialogTitle>{view ? businessName(view) : ""}</DialogTitle>
                <DialogDescription className="font-mono text-xs">{view && businessId(view.user_id, indexed.findIndex((x) => x.user_id === view.user_id))}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {view && (
            <div className="space-y-3 text-sm">
              <Row label="Owner" value={view.full_name || "Unnamed"} />
              <Row label="Email" value={view.email || "—"} />
              <Row label="Business Type" value={view.plan === "premium" || view.plan === "unlimited" ? "Pharmacy" : "Retail"} />
              <Row label="Category" value="General Trade" />
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
            <DialogTitle>{analytics ? businessName(analytics) : ""} — Analytics</DialogTitle>
            <DialogDescription>Live performance snapshot.</DialogDescription>
          </DialogHeader>
          {analytics && (
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Listed Products" value={analytics.listed_products ?? 0} />
              <Stat label="Plan MRR" value={`$${PLAN_PRICES[analytics.plan] ?? 0}`} />
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
            <DialogTitle>Change Plan</DialogTitle>
            <DialogDescription>{planChange ? businessName(planChange) : ""}</DialogDescription>
          </DialogHeader>
          <Select value={planValue} onValueChange={setPlanValue}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLANS.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <button onClick={() => setPlanChange(null)} className="h-10 px-4 rounded-xl border border-border text-sm font-bold">Cancel</button>
            <button onClick={submitPlanChange} disabled={busy} className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center gap-2">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Apply
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend */}
      <AlertDialog open={!!suspendBiz} onOpenChange={(o) => !o && setSuspendBiz(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{suspendBiz?.status === "suspended" ? "Activate this business?" : "Suspend this business?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {suspendBiz?.status === "suspended"
                ? "Owner regains access to all workspace features."
                : "Owner will lose access until reactivated."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitSuspend} disabled={busy}>{suspendBiz?.status === "suspended" ? "Activate" : "Suspend"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset */}
      <AlertDialog open={!!resetBiz} onOpenChange={(o) => !o && setResetBiz(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset business data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear inventory products and POS counters for {resetBiz ? businessName(resetBiz) : "this business"}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={submitReset} disabled={busy} className="bg-rose-500 hover:bg-rose-600">Reset Data</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PanelLayout>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex items-center justify-between border-b border-border/60 pb-2">
    <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);
const Stat = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="bg-muted/40 border border-border rounded-xl p-3">
    <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">{label}</p>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

export default AdminBusinesses;
