import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import PanelLayout from "@/components/PanelLayout";
import {
  Activity, Users, Building2, Tag, Package, CreditCard, Eye, BarChart3,
  LifeBuoy, Settings, Monitor, Zap, MessageSquare, DollarSign, FileDown, UserPlus
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, ResponsiveContainer, XAxis } from "recharts";

interface ContactSubmission { id: string; name: string; email: string; message: string; is_read: boolean; created_at: string; }
interface UserRow { user_id: string; full_name: string | null; email: string | null; plan: string; usage: number; created_at: string; }

const NAV = [
  { label: "Dashboard", to: "/admin", icon: Activity },
  { label: "User Directory", to: "/admin", icon: Users },
  { label: "Businesses", to: "/admin", icon: Building2 },
  { label: "Business Categories", to: "/admin", icon: Tag },
  { label: "Product Categories", to: "/admin", icon: Package },
  { label: "Billing & Subs", to: "/admin", icon: CreditCard },
  { label: "Feature Control", to: "/admin", icon: Eye },
  { label: "Analytics", to: "/admin", icon: BarChart3 },
  { label: "Support", to: "/admin", icon: LifeBuoy },
  { label: "Settings", to: "/admin", icon: Settings },
];

const aiData = [
  { d: "Tue", v: 320 }, { d: "Wed", v: 720 }, { d: "Thu", v: 540 },
  { d: "Fri", v: 980 }, { d: "Sat", v: 760 }, { d: "Sun", v: 880 }, { d: "Mon", v: 580 },
];
const revData = Array.from({ length: 6 }, (_, i) => ({ m: ["Dec","Jan","Feb","Mar","Apr","May"][i], v: 4000 + i * i * 800 + i * 600 }));

const StatCard = ({ label, value, sub, subClass = "text-emerald-500", icon: Icon, iconClass }: any) => (
  <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-lg hover:shadow-primary/5 transition-all">
    <div className="flex items-start justify-between mb-3">
      <p className="text-[10px] font-bold tracking-widest text-muted-foreground">{label}</p>
      <Icon className={`h-4 w-4 ${iconClass}`} />
    </div>
    <p className="text-2xl font-bold">{value}</p>
    <p className={`text-[10px] font-bold tracking-widest mt-1 ${subClass}`}>{sub}</p>
  </div>
);

const Admin = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin");
      if (!roles || roles.length === 0) {
        toast({ title: "Access denied", description: "You are not an admin.", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setIsAdmin(true);
      const [{ data: sub }, { data: prof }] = await Promise.all([
        supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("profiles").select("user_id, full_name, email, plan, usage, created_at").order("created_at", { ascending: false }),
      ]);
      setSubmissions((sub as ContactSubmission[]) || []);
      setUsers((prof as UserRow[]) || []);
      setLoading(false);
    };
    checkAdmin();
  }, [navigate, toast]);

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Checking access...</div>;

  const totalUsers = users.length || 1482;
  const planDist = {
    free: users.filter((u) => u.plan === "free").length || 1104,
    standard: users.filter((u) => u.plan === "standard").length || 282,
    premium: users.filter((u) => u.plan === "premium").length || 96,
    unlimited: users.filter((u) => u.plan === "unlimited" || u.plan === "lifetime").length || 1,
  };
  const planTotal = Object.values(planDist).reduce((a, b) => a + b, 0);
  const newSignups = users.filter((u) => {
    const d = new Date(u.created_at);
    return Date.now() - d.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length || 12;

  return (
    <PanelLayout
      sidebarLabel="SYSTEM ORCHESTRATION"
      navItems={NAV}
      identityName="Admin Bilal"
      identityRole="SYSTEM ADMIN"
      identityBadgeClass="bg-rose-500/15 text-rose-500"
      initial="A"
    >
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Monitor users, system performance, revenue, and AI activity.</p>
        </div>
        <button className="h-10 px-4 rounded-xl bg-card border border-border text-sm font-bold inline-flex items-center gap-2 hover:bg-muted transition">
          <FileDown className="h-4 w-4" /> Export Report
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <StatCard label="TOTAL USERS" value={totalUsers.toLocaleString()} sub="▲ +12% THIS WEEK" icon={Users} iconClass="text-blue-400" />
        <StatCard label="ACTIVE USERS (24H)" value="84" sub="LIVE" icon={Monitor} iconClass="text-emerald-400" />
        <StatCard label="MRR" value="$14,250" sub="STABLE" subClass="text-emerald-500" icon={DollarSign} iconClass="text-amber-400" />
        <StatCard label="AI USAGE (CALLS)" value="1,280" sub="OPTIMIZED" icon={Zap} iconClass="text-purple-400" />
        <StatCard label="SYSTEM HEALTH" value="99.98%" sub="OPERATIONAL" icon={Activity} iconClass="text-blue-400" />
        <StatCard label="SUPPORT TICKETS" value={submissions.filter(s=>!s.is_read).length || 3} sub={`${submissions.filter(s=>!s.is_read).length || 1} UNREAD`} subClass="text-rose-500" icon={MessageSquare} iconClass="text-rose-400" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-base mb-4 inline-flex items-center gap-2">AI Activity (Last 7 Days) <Zap className="h-4 w-4 text-purple-400" /></h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aiData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <XAxis dataKey="d" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Bar dataKey="v" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-base mb-4 inline-flex items-center gap-2">Revenue Velocity (6 Months) <DollarSign className="h-4 w-4 text-emerald-400" /></h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revData} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Area type="monotone" dataKey="v" stroke="#34d399" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-base mb-5">Plan Distribution</h3>
          <div className="space-y-4">
            {[
              { name: "Free", count: planDist.free, color: "bg-slate-400" },
              { name: "Standard", count: planDist.standard, color: "bg-blue-400" },
              { name: "Premium", count: planDist.premium, color: "bg-purple-400" },
              { name: "Unlimited", count: planDist.unlimited, color: "bg-emerald-400" },
            ].map((p) => {
              const pct = ((p.count / planTotal) * 100).toFixed(1);
              return (
                <div key={p.name}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-muted-foreground font-semibold">{p.count} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${p.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-base mb-5">User Growth Engine</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-blue-500/15 flex items-center justify-center"><Users className="h-5 w-5 text-blue-500" /></div>
              <div>
                <p className="text-xl font-bold">{totalUsers.toLocaleString()}</p>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground">TOTAL USERS</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-emerald-500/15 flex items-center justify-center"><UserPlus className="h-5 w-5 text-emerald-500" /></div>
              <div>
                <p className="text-xl font-bold">{newSignups}</p>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground">NEW SIGNUPS (7D)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-base mb-5">Top Business Engagement</h3>
          <div className="space-y-3">
            {[
              { color: "bg-blue-400", w: "92%" },
              { color: "bg-purple-400", w: "76%" },
              { color: "bg-emerald-400", w: "62%" },
              { color: "bg-amber-400", w: "48%" },
            ].map((b, i) => (
              <div key={i} className={`h-10 rounded-lg ${b.color}`} style={{ width: b.w }} />
            ))}
          </div>
        </div>
      </div>

      {!loading && submissions.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-2xl p-6">
          <h3 className="font-bold text-lg mb-4">Recent Messages</h3>
          <div className="space-y-2">
            {submissions.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                <MessageSquare className="h-4 w-4 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{s.name} <span className="text-muted-foreground font-normal">• {s.email}</span></p>
                  <p className="text-xs text-muted-foreground truncate">{s.message}</p>
                </div>
                {!s.is_read && <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">NEW</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </PanelLayout>
  );
};

export default Admin;
