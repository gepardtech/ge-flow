import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PanelLayout from "@/components/PanelLayout";
import { userNavForPlanAndModules } from "@/lib/panelNav";
import { usePlatformFeatures } from "@/hooks/usePlatformFeatures";
import { usePlan } from "@/hooks/usePlan";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { useBusinessModules } from "@/hooks/useBusinessModules";
import {
  Package, ShoppingCart, FileText, BarChart3, Plus, Sparkles, AlertTriangle, Clock, TrendingUp
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(n || 0);

interface DayPoint { day: string; sales: number; profit: number; }
interface Operation { id: string; type: string; amount: number; meta: string; status: string; }
interface TopItem { name: string; units: number; profit: number; }

const Stat = ({ label, value, delta, deltaClass = "text-emerald-500", icon: Icon, iconClass, onClick }: any) => (
  <button
    onClick={onClick}
    className="text-left bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      {delta && <span className={`text-[11px] font-bold ${deltaClass}`}>{delta}</span>}
    </div>
    <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </button>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { plan, planId, fullName, loading: planLoading } = usePlan();
  const { active, loading: bizLoading } = useActiveBusiness();
  const { modules } = useBusinessModules();
  const { isEnabled: isFeatureEnabled } = usePlatformFeatures(planId);

  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ todaySales: 0, todayProfit: 0, totalRevenue: 0, totalProducts: 0, lowStock: 0 });
  const [chart, setChart] = useState<DayPoint[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [topItems, setTopItems] = useState<TopItem[]>([]);
  const [alerts, setAlerts] = useState<{ title: string; sub: string; tone: "amber" | "rose" }[]>([]);

  const currency = active?.currency || "USD";

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }
    if (!active) { setLoading(false); return; }

    setLoading(true);
    const bizId = active.id;
    const since = new Date(); since.setDate(since.getDate() - 29); since.setHours(0, 0, 0, 0);
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

    const [{ data: products }, { data: sales }, { data: saleItems }, { data: movements }] = await Promise.all([
      supabase.from("products").select("id, name, stock_units, min_stock_alert, expiry_date, status").eq("business_id", bizId),
      supabase.from("sales").select("id, total, profit, status, processed_by, created_at").eq("business_id", bizId).gte("created_at", since.toISOString()).order("created_at", { ascending: false }),
      supabase.from("sale_items").select("product_name, quantity, unit_price, unit_cost, created_at").eq("owner_user_id", user.id).gte("created_at", since.toISOString()),
      supabase.from("stock_movements").select("id, type, quantity, created_at, product_id").eq("business_id", bizId).eq("type", "in").order("created_at", { ascending: false }).limit(5),
    ]);

    const prods = products ?? [];
    const allSales = sales ?? [];

    // KPIs
    const completed = allSales.filter((s) => s.status === "completed");
    const todaySalesRows = completed.filter((s) => new Date(s.created_at) >= todayStart);
    const todaySales = todaySalesRows.reduce((a, s) => a + Number(s.total), 0);
    const todayProfit = todaySalesRows.reduce((a, s) => a + Number(s.profit), 0);
    const totalRevenue = completed.reduce((a, s) => a + Number(s.total), 0);
    const lowStock = prods.filter((p) => p.stock_units > 0 && p.stock_units <= p.min_stock_alert).length;
    setKpis({ todaySales, todayProfit, totalRevenue, totalProducts: prods.length, lowStock });

    // Chart — last 30 days
    const byDay: Record<string, { sales: number; profit: number }> = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(since); d.setDate(since.getDate() + i);
      byDay[d.toISOString().slice(0, 10)] = { sales: 0, profit: 0 };
    }
    completed.forEach((s) => {
      const key = new Date(s.created_at).toISOString().slice(0, 10);
      if (byDay[key]) { byDay[key].sales += Number(s.total); byDay[key].profit += Number(s.profit); }
    });
    setChart(Object.entries(byDay).map(([k, v]) => ({ day: new Date(k).toLocaleDateString(undefined, { month: "short", day: "numeric" }), sales: v.sales, profit: v.profit })));

    // Recent operations — sales + stock-in
    const ops: Operation[] = [];
    allSales.slice(0, 4).forEach((s) => ops.push({
      id: s.id, type: "Sale", amount: Number(s.total),
      meta: `${new Date(s.created_at).toLocaleString()} • ${s.processed_by || "You"}`,
      status: s.status === "completed" ? "COMPLETED" : "PENDING",
    }));
    (movements ?? []).slice(0, 2).forEach((m) => ops.push({
      id: m.id, type: "Purchase", amount: m.quantity,
      meta: `${new Date(m.created_at).toLocaleString()} • Stock-in`, status: "COMPLETED",
    }));
    ops.sort((a, b) => 0);
    setOperations(ops.slice(0, 5));

    // Top growth items
    const agg: Record<string, TopItem> = {};
    (saleItems ?? []).forEach((it) => {
      const k = it.product_name;
      if (!agg[k]) agg[k] = { name: k, units: 0, profit: 0 };
      agg[k].units += it.quantity;
      agg[k].profit += (Number(it.unit_price) - Number(it.unit_cost)) * it.quantity;
    });
    setTopItems(Object.values(agg).sort((a, b) => b.profit - a.profit).slice(0, 3));

    // Critical alerts
    const al: { title: string; sub: string; tone: "amber" | "rose" }[] = [];
    prods.filter((p) => p.stock_units > 0 && p.stock_units <= p.min_stock_alert).slice(0, 1).forEach((p) =>
      al.push({ title: `Low Stock: ${p.name}`, sub: `${p.stock_units} units remaining.`, tone: "amber" }));
    const soon = new Date(); soon.setDate(soon.getDate() + 30);
    prods.filter((p) => p.expiry_date && new Date(p.expiry_date) <= soon).slice(0, 1).forEach((p) =>
      al.push({ title: `Expiring: ${p.name}`, sub: `Expires ${new Date(p.expiry_date!).toLocaleDateString()}.`, tone: "rose" }));
    setAlerts(al);

    setLoading(false);
  }, [active, navigate]);

  useEffect(() => {
    if (bizLoading) return;
    if (!active) { navigate("/setup/business"); return; }
    load();
  }, [bizLoading, active, load, navigate]);

  // Realtime
  useEffect(() => {
    if (!active) return;
    const ch = supabase
      .channel(`dashboard-${active.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "products", filter: `business_id=eq.${active.id}` }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "sales", filter: `business_id=eq.${active.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [active, load]);

  if (planLoading || bizLoading || loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading dashboard...</div>;
  }

  const firstName = fullName?.split(" ")[0] || "there";
  const initial = firstName.charAt(0).toUpperCase();
  const hasData = chart.some((c) => c.sales > 0);

  return (
    <PanelLayout
      sidebarLabel="BUSINESS WORKSPACE"
      navItems={userNavForPlanAndModules(planId, modules, isFeatureEnabled)}
      identityName={`${plan.label} ${firstName}`}
      identityRole={`${plan.label.toUpperCase()} PLAN`}
      identityBadgeClass={plan.badgeClass}
      initial={initial}
      lockedPaths={plan.lockedRoutes}
    >
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Welcome back, {firstName} 👋</h1>
          <p className="text-sm text-muted-foreground">Here's your business pulse for the last 30 days.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/dashboard/pos")} className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center gap-2 hover:bg-primary/90 transition shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" /> New Sale
          </button>
          <button onClick={() => navigate("/dashboard/inventory")} className="h-10 px-4 rounded-xl bg-card border border-border text-sm font-bold inline-flex items-center gap-2 hover:bg-muted transition">
            <Plus className="h-4 w-4" /> Add Product
          </button>
          <button onClick={() => navigate("/dashboard/reports")} className="h-10 px-4 rounded-xl bg-card border border-border text-sm font-bold inline-flex items-center gap-2 hover:bg-muted transition">
            <Clock className="h-4 w-4" /> Reports
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Stat label="TODAY SALES" value={money(kpis.todaySales, currency)} iconClass="bg-blue-500/15 text-blue-500" icon={ShoppingCart} onClick={() => navigate("/dashboard/analytics")} />
        <Stat label="TODAY PROFIT" value={money(kpis.todayProfit, currency)} iconClass="bg-emerald-500/15 text-emerald-500" icon={TrendingUp} onClick={() => navigate("/dashboard/analytics")} />
        <Stat label="TOTAL REVENUE" value={money(kpis.totalRevenue, currency)} iconClass="bg-purple-500/15 text-purple-500" icon={BarChart3} onClick={() => navigate("/dashboard/analytics")} />
        <Stat label="TOTAL PRODUCTS" value={kpis.totalProducts.toLocaleString()} delta="" iconClass="bg-amber-500/15 text-amber-500" icon={Package} onClick={() => navigate("/dashboard/inventory")} />
        <Stat label="LOW STOCK" value={kpis.lowStock} delta={kpis.lowStock > 0 ? "ALERT" : "OK"} deltaClass={kpis.lowStock > 0 ? "text-rose-500" : "text-emerald-500"} iconClass="bg-rose-500/15 text-rose-500" icon={AlertTriangle} onClick={() => navigate("/dashboard/low-stock")} />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Revenue Velocity</h3>
              <p className="text-xs text-muted-foreground">Visual correlation between total sales and net profit margins.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-sky-400" /> SALES</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-violet-400" /> PROFIT</span>
            </div>
          </div>
          <div className="h-72">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chart} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c084fc" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={3} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                  <Area type="monotone" dataKey="sales" stroke="#38bdf8" strokeWidth={2.5} fill="url(#g1)" />
                  <Area type="monotone" dataKey="profit" stroke="#c084fc" strokeWidth={2.5} fill="url(#g2)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground">
                <BarChart3 className="h-8 w-8 mb-2 opacity-50" />
                <p className="font-bold text-sm">No sales recorded yet</p>
                <p className="text-xs mt-1">Process sales in the POS terminal to see revenue trends here.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-sky-400 via-cyan-400 to-violet-400 text-white shadow-xl shadow-primary/20">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest bg-white/20 px-2 py-1 rounded-full">
              <Sparkles className="h-3 w-3" /> GEFLOW INTELLIGENCE
            </div>
            <h3 className="font-bold text-xl mt-3">
              {kpis.lowStock > 0 ? `${kpis.lowStock} SKU${kpis.lowStock > 1 ? "s" : ""} need restocking` : kpis.totalProducts === 0 ? "Add your first product" : "Inventory looks healthy"}
            </h3>
            <p className="text-xs text-white/90 mt-1.5 leading-relaxed">
              {kpis.lowStock > 0
                ? "Some products are approaching their safety threshold. Review and restock to avoid stockouts."
                : kpis.totalProducts === 0
                  ? "Start by registering products in the Inventory Hub to unlock live analytics."
                  : "No low-stock alerts right now. Keep processing sales to grow your insights."}
            </p>
            <button onClick={() => navigate(kpis.totalProducts === 0 ? "/dashboard/inventory" : "/dashboard/low-stock")} className="w-full mt-4 h-10 rounded-xl bg-white text-primary text-xs font-bold tracking-wider hover:bg-white/90 transition">
              {kpis.totalProducts === 0 ? "GO TO INVENTORY" : "REVIEW RECOMMENDATION"}
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-base mb-3 inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Critical Alerts</h3>
            <div className="space-y-2.5">
              {alerts.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No critical alerts. Everything is in order.</p>
              ) : alerts.map((a, i) => (
                <div key={i} className={`${a.tone === "amber" ? "bg-amber-500/10 border-amber-500/20" : "bg-rose-500/10 border-rose-500/20"} border rounded-xl p-3`}>
                  <p className="text-xs font-bold">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{a.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Recent Operations</h3>
              <p className="text-xs text-muted-foreground">Live stream of billing and stock-in events.</p>
            </div>
            <button onClick={() => navigate("/dashboard/reports")} className="h-9 px-4 rounded-xl border border-border text-xs font-bold hover:bg-muted">VIEW LEDGER</button>
          </div>
          {operations.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <ShoppingCart className="h-7 w-7 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold">No operations yet</p>
              <p className="text-xs mt-1">Sales and stock movements will appear here in real time.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {operations.map((op) => (
                <div key={op.id} className="flex items-center gap-3 py-4">
                  <div className={`h-10 w-10 rounded-xl ${op.type === "Sale" ? "bg-emerald-500/15 text-emerald-500" : "bg-sky-500/15 text-sky-500"} flex items-center justify-center flex-shrink-0`}>
                    {op.type === "Sale" ? <ShoppingCart className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{op.type} • {op.type === "Sale" ? money(op.amount, currency) : `${op.amount} units`}</p>
                    <p className="text-[11px] text-muted-foreground tracking-wider">{op.meta}</p>
                  </div>
                  <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full ${op.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>
                    {op.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-lg">Top Growth Items</h3>
          <p className="text-xs text-muted-foreground mb-4">Your most profitable SKUs this month.</p>
          {topItems.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <TrendingUp className="h-7 w-7 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3 py-2">
                  <div className="h-8 w-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground tracking-wider">{item.units} UNITS SOLD</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-emerald-500">{money(item.profit, currency)}</p>
                    <p className="text-[10px] text-muted-foreground tracking-wider">PROFIT</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate("/dashboard/inventory")} className="w-full mt-4 h-10 text-xs font-bold tracking-wider text-primary hover:underline">FULL INVENTORY ANALYTICS →</button>
        </div>
      </div>
    </PanelLayout>
  );
};

export default Dashboard;
