import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PanelLayout from "@/components/PanelLayout";
import { USER_NAV } from "@/lib/panelNav";
import {
  Package, ShoppingCart, FileText, BarChart3, Plus, Sparkles, AlertTriangle, Clock
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface Profile {
  full_name: string | null;
  email: string | null;
  plan: string;
  usage: number;
}

const chartData = Array.from({ length: 28 }, (_, i) => ({
  day: `Day ${i + 1}`,
  sales: 800 + Math.sin(i / 2) * 500 + Math.random() * 600 + i * 25,
  profit: 200 + Math.cos(i / 3) * 200 + Math.random() * 250 + i * 8,
}));

const Stat = ({ label, value, delta, deltaClass = "text-emerald-500", icon: Icon, iconClass }: any) => (
  <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:shadow-primary/5 transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${iconClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className={`text-[11px] font-bold ${deltaClass}`}>{delta}</span>
    </div>
    <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data } = await supabase
        .from("profiles").select("full_name, email, plan, usage")
        .eq("user_id", user.id).maybeSingle();
      setProfile((data as Profile) || { full_name: null, email: user.email ?? null, plan: "free", usage: 0 });
      setLoading(false);
    };
    load();
  }, [navigate]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading dashboard...</div>;

  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const planLabel = (profile?.plan || "free").charAt(0).toUpperCase() + (profile?.plan || "free").slice(1);
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <PanelLayout
      sidebarLabel="BUSINESS WORKSPACE"
      navItems={USER_NAV}
      identityName={`${planLabel} User ${firstName}`}
      identityRole={`${planLabel.toUpperCase()} PLAN`}
      identityBadgeClass="bg-sky-400/15 text-sky-500"
      initial={initial}
    >
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Welcome back, {planLabel} 👋</h1>
          <p className="text-sm text-muted-foreground">Here's your business pulse for the last 30 days.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-bold inline-flex items-center gap-2 hover:bg-primary/90 transition shadow-md shadow-primary/20">
            <Plus className="h-4 w-4" /> New Sale
          </button>
          <button className="h-10 px-4 rounded-xl bg-card border border-border text-sm font-bold inline-flex items-center gap-2 hover:bg-muted transition">
            <Plus className="h-4 w-4" /> Add Product
          </button>
          <button className="h-10 px-4 rounded-xl bg-card border border-border text-sm font-bold inline-flex items-center gap-2 hover:bg-muted transition">
            <Clock className="h-4 w-4" /> Reports
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Stat label="TODAY SALES" value="$2,450" delta="+12.4%" iconClass="bg-blue-500/15 text-blue-500" icon={ShoppingCart} />
        <Stat label="TODAY PROFIT" value="$840" delta="+5.2%" iconClass="bg-emerald-500/15 text-emerald-500" icon={BarChart3} />
        <Stat label="TOTAL REVENUE" value="$14,250" delta="+8.1%" iconClass="bg-purple-500/15 text-purple-500" icon={BarChart3} />
        <Stat label="TOTAL PRODUCTS" value="1,284" delta="STABLE" deltaClass="text-emerald-500" iconClass="bg-amber-500/15 text-amber-500" icon={Package} />
        <Stat label="LOW STOCK" value="12" delta="-2" deltaClass="text-rose-500" iconClass="bg-rose-500/15 text-rose-500" icon={AlertTriangle} />
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">Revenue Velocity</h3>
              <p className="text-xs text-muted-foreground">Visual correlation between total sales and net profit margins.</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 font-bold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-blue-400" /> SALES</span>
              <span className="inline-flex items-center gap-1.5 font-bold text-muted-foreground"><span className="h-2 w-2 rounded-full bg-purple-400" /> PROFIT</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} interval={3} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Area type="monotone" dataKey="sales" stroke="#60a5fa" strokeWidth={2.5} fill="url(#g1)" />
                <Area type="monotone" dataKey="profit" stroke="#c084fc" strokeWidth={2.5} fill="url(#g2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-blue-400 via-cyan-400 to-purple-400 text-white shadow-xl shadow-primary/20">
            <div className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest bg-white/20 px-2 py-1 rounded-full">
              <Sparkles className="h-3 w-3" /> GEFLOW INTELLIGENCE
            </div>
            <h3 className="font-bold text-xl mt-3">Sales Up 15% Today</h3>
            <p className="text-xs text-white/90 mt-1.5 leading-relaxed">Your medicine category is driving high volume. Suggest restocking Paracetamol to avoid stockout by Friday.</p>
            <button className="w-full mt-4 h-10 rounded-xl bg-white text-primary text-xs font-bold tracking-wider hover:bg-white/90 transition">
              REVIEW RECOMMENDATION
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="font-bold text-base mb-3 inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-500" /> Critical Alerts</h3>
            <div className="space-y-2.5">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
                <p className="text-xs font-bold">Low Stock: Vitamin C</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">8 units remaining in warehouse.</p>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                <p className="text-xs font-bold">Expiring: Aspirin 100mg</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Batch #902 expires in 5 days.</p>
              </div>
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
            <button className="h-9 px-4 rounded-xl border border-border text-xs font-bold hover:bg-muted">VIEW LEDGER</button>
          </div>
          <div className="divide-y divide-border">
            {[
              { type: "Sale", amount: "$124.50", meta: "2 mins ago • PROCESSED BY SARAH C.", status: "COMPLETED", color: "emerald" },
              { type: "Purchase", amount: "$850.00", meta: "15 mins ago • PROCESSED BY ADMIN", status: "PENDING", color: "amber" },
              { type: "Sale", amount: "$45.00", meta: "1 hour ago • PROCESSED BY JOHN D.", status: "COMPLETED", color: "emerald" },
            ].map((op, i) => (
              <div key={i} className="flex items-center gap-3 py-4">
                <div className={`h-10 w-10 rounded-xl bg-${op.color}-500/15 text-${op.color}-500 flex items-center justify-center flex-shrink-0`}>
                  {op.type === "Sale" ? <ShoppingCart className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{op.type} • {op.amount}</p>
                  <p className="text-[11px] text-muted-foreground tracking-wider">{op.meta}</p>
                </div>
                <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full ${op.status === "COMPLETED" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>
                  {op.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-lg">Top Growth Items</h3>
          <p className="text-xs text-muted-foreground mb-4">Your most profitable SKUs this month.</p>
          <div className="space-y-3">
            {[
              { rank: 1, name: "Paracetamol 500mg", sub: "124 UNITS SOLD", growth: "+12%", profit: "$450 PROFIT" },
              { rank: 2, name: "Vitamin C Syrup", sub: "89 UNITS SOLD", growth: "+8%", profit: "$320 PROFIT" },
              { rank: 3, name: "Digital Thermometer", sub: "45 UNITS SOLD", growth: "+5%", profit: "$890 PROFIT" },
            ].map((item) => (
              <div key={item.rank} className="flex items-center gap-3 py-2">
                <div className="h-8 w-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center font-bold text-xs">{item.rank}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground tracking-wider">{item.sub}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-emerald-500">{item.growth}</p>
                  <p className="text-[10px] text-muted-foreground tracking-wider">{item.profit}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-4 h-10 text-xs font-bold tracking-wider text-primary hover:underline">FULL INVENTORY ANALYTICS →</button>
        </div>
      </div>

      <div className="mt-8 bg-card border border-border rounded-2xl p-6">
        <h3 className="font-bold text-lg mb-4">Account Information</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 text-sm">
          <div><p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">FULL NAME</p><p className="font-semibold">{profile?.full_name || "—"}</p></div>
          <div><p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">EMAIL</p><p className="font-semibold truncate">{profile?.email}</p></div>
          <div><p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">PLAN</p><p className="font-semibold capitalize">{profile?.plan}</p></div>
          <div><p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">USAGE</p><p className="font-semibold">{profile?.usage ?? 0} actions</p></div>
        </div>
      </div>
    </PanelLayout>
  );
};

export default Dashboard;
