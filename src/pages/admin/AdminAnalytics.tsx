import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import PanelLayout from "@/components/PanelLayout";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
import {
  Users, Building2, DollarSign, LifeBuoy, TrendingUp, Loader2, Activity, Package, BarChart3,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell,
  PieChart, Pie, Legend,
} from "recharts";

type Profile = { plan: string | null; created_at: string; status: string | null };
type Business = { id: string; category_id: string | null; status: string; created_at: string };
type Sub = { tier: string; cycle: string; status: string; amount: number };
type Invoice = { amount: number; status: string; issue_date: string };
type Ticket = { status: string; category: string };
type Category = { id: string; name: string };

const monthKey = (d: string) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (key: string) => {
  const [y, m] = key.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", { month: "short" });
};
const PLAN_COLORS: Record<string, string> = {
  free: "#94a3b8", standard: "#38bdf8", premium: "#c084fc", lifetime: "#10b981", unlimited: "#f59e0b",
};

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const load = useCallback(async () => {
    const [p, b, s, i, t, c] = await Promise.all([
      supabase.from("profiles").select("plan, created_at, status"),
      supabase.from("businesses").select("id, category_id, status, created_at"),
      supabase.from("subscriptions").select("tier, cycle, status, amount"),
      supabase.from("invoices").select("amount, status, issue_date"),
      supabase.from("support_tickets").select("status, category"),
      supabase.from("business_categories").select("id, name"),
    ]);
    setProfiles((p.data as Profile[]) ?? []);
    setBusinesses((b.data as Business[]) ?? []);
    setSubs((s.data as Sub[]) ?? []);
    setInvoices((i.data as Invoice[]) ?? []);
    setTickets((t.data as Ticket[]) ?? []);
    setCategories((c.data as Category[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener("panel:refresh", onRefresh);
    const ch = supabase.channel("admin_analytics_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "businesses" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, load)
      .subscribe();
    return () => { window.removeEventListener("panel:refresh", onRefresh); supabase.removeChannel(ch); };
  }, [load]);

  const mrr = useMemo(() => subs
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + (s.cycle === "yearly" ? Number(s.amount) / 12 : s.cycle === "lifetime" ? 0 : Number(s.amount)), 0), [subs]);

  const totalRevenue = useMemo(() => invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.amount), 0), [invoices]);

  const openTickets = useMemo(() => tickets.filter((t) => t.status === "open" || t.status === "in_progress").length, [tickets]);
  const activeBiz = useMemo(() => businesses.filter((b) => b.status === "active").length, [businesses]);

  // user growth (cumulative by month, last 6 months)
  const growth = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let k = 5; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const perMonth: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
    profiles.forEach((p) => { const k = monthKey(p.created_at); if (k in perMonth) perMonth[k] += 1; });
    let prior = profiles.filter((p) => monthKey(p.created_at) < keys[0]).length;
    return keys.map((k) => { prior += perMonth[k]; return { month: monthLabel(k), users: prior, joined: perMonth[k] }; });
  }, [profiles]);

  // revenue by month (paid invoices)
  const revenue = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let k = 5; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    const map: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));
    invoices.filter((i) => i.status === "paid").forEach((i) => { const k = monthKey(i.issue_date); if (k in map) map[k] += Number(i.amount); });
    return keys.map((k) => ({ month: monthLabel(k), value: Math.round(map[k]) }));
  }, [invoices]);

  const planDist = useMemo(() => {
    const map: Record<string, number> = {};
    profiles.forEach((p) => { const k = (p.plan ?? "free").toLowerCase(); map[k] = (map[k] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value, color: PLAN_COLORS[name] ?? "#6366f1" }));
  }, [profiles]);

  const bizByCat = useMemo(() => {
    const nameMap = new Map(categories.map((c) => [c.id, c.name]));
    const map: Record<string, number> = {};
    businesses.forEach((b) => { const n = b.category_id ? (nameMap.get(b.category_id) ?? "Uncategorized") : "Uncategorized"; map[n] = (map[n] ?? 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [businesses, categories]);

  return (
    <PanelLayout navItems={ADMIN_NAV} {...ADMIN_IDENTITY} isAdmin>
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Platform Analytics</h1>
          <p className="text-sm text-muted-foreground">Live engagement, growth and revenue intelligence across GeFlow.</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-emerald-400/10 border border-emerald-400/30 text-emerald-600 dark:text-emerald-400 px-3 py-2 rounded-xl">
          <Activity className="h-3.5 w-3.5" />
          <span className="text-[10px] font-bold tracking-widest">REALTIME DATA</span>
        </div>
      </div>

      {loading ? (
        <div className="p-20 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Kpi icon={Users} iconClass="text-sky-500 bg-sky-400/15" label="TOTAL USERS" value={profiles.length} sub={`${profiles.filter((p) => p.status === "active").length} active`} />
            <Kpi icon={Building2} iconClass="text-violet-500 bg-violet-400/15" label="ACTIVE BUSINESSES" value={activeBiz} sub={`${businesses.length} total`} />
            <Kpi icon={DollarSign} iconClass="text-emerald-500 bg-emerald-400/15" label="MONTHLY REVENUE" value={`$${Math.round(mrr).toLocaleString()}`} sub={`$${Math.round(totalRevenue).toLocaleString()} collected`} />
            <Kpi icon={LifeBuoy} iconClass="text-amber-500 bg-amber-400/15" label="OPEN TICKETS" value={openTickets} sub={`${tickets.length} all-time`} />
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-sky-500" /><p className="font-bold">User Growth</p></div>
              <p className="text-sm text-muted-foreground mb-4">Cumulative registered users over the last 6 months.</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={growth}>
                    <defs><linearGradient id="ug" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#38bdf8" stopOpacity={0.5} /><stop offset="100%" stopColor="#38bdf8" stopOpacity={0} /></linearGradient></defs>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                    <Area dataKey="users" stroke="#38bdf8" fill="url(#ug)" strokeWidth={2} name="Total users" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1"><BarChart3 className="h-4 w-4 text-violet-500" /><p className="font-bold">Plan Distribution</p></div>
              <p className="text-sm text-muted-foreground mb-4">Users by subscription plan.</p>
              <div className="h-72">
                {planDist.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={planDist} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                        {planDist.map((e, i) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Legend />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-emerald-500" /><p className="font-bold">Revenue Trend</p></div>
              <p className="text-sm text-muted-foreground mb-4">Collected revenue (paid invoices) per month.</p>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue}>
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v: number) => `$${v.toLocaleString()}`} />
                    <Bar dataKey="value" fill="#10b981" radius={[6, 6, 0, 0]} name="Revenue" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-1"><Package className="h-4 w-4 text-sky-500" /><p className="font-bold">Businesses by Category</p></div>
              <p className="text-sm text-muted-foreground mb-4">Distribution across business categories.</p>
              <div className="h-72">
                {bizByCat.length === 0 ? <Empty /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bizByCat} layout="vertical" margin={{ left: 20 }}>
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={110} />
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                      <Bar dataKey="value" fill="#c084fc" radius={[0, 6, 6, 0]} name="Businesses" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </PanelLayout>
  );
};

const Empty = () => <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet.</div>;

const Kpi = ({ icon: Icon, iconClass, label, value, sub }: any) => (
  <div className="bg-card border border-border rounded-2xl p-5">
    <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${iconClass}`}><Icon className="h-4 w-4" /></div>
    <p className="text-[10px] font-bold tracking-widest text-muted-foreground mt-4">{label}</p>
    <p className="text-3xl font-bold mt-1">{value}</p>
    <p className="text-xs text-muted-foreground mt-1">{sub}</p>
  </div>
);

export default AdminAnalytics;
