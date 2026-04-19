import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PanelLayout from "@/components/PanelLayout";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
import { useToast } from "@/hooks/use-toast";
import {
  Search, Filter, Download, UserPlus, MoreVertical, Users as UsersIcon,
  UserCheck, Star, ShieldAlert, ChevronDown,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

interface UserRow {
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

const PLAN_STYLES: Record<string, string> = {
  free: "bg-slate-400/15 text-slate-500",
  standard: "bg-purple-400/15 text-purple-500",
  premium: "bg-sky-400/15 text-sky-500",
  unlimited: "bg-emerald-400/15 text-emerald-500",
  lifetime: "bg-amber-400/15 text-amber-500",
};

const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  suspended: "bg-rose-500",
  pending: "bg-amber-500",
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min${m > 1 ? "s" : ""} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h > 1 ? "s" : ""} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};

const colorFromName = (name: string) => {
  const colors = ["bg-rose-400/20 text-rose-500", "bg-sky-400/20 text-sky-500", "bg-purple-400/20 text-purple-500", "bg-emerald-400/20 text-emerald-500", "bg-amber-400/20 text-amber-500", "bg-violet-400/20 text-violet-500"];
  return colors[(name?.charCodeAt(0) || 0) % colors.length];
};

const AdminUsers = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, full_name, email, plan, status, usage, listed_products, created_at, last_active")
      .order("created_at", { ascending: false });
    if (error) toast({ title: "Failed to load users", description: error.message, variant: "destructive" });
    setUsers((data as UserRow[]) ?? []);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    load();
    const channel = supabase
      .channel("admin_users_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, load)
      .subscribe();
    const onRefresh = () => load();
    window.addEventListener("panel:refresh", onRefresh);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("panel:refresh", onRefresh);
    };
  }, [load]);

  // URL filter (?filter=active)
  useEffect(() => {
    const f = params.get("filter");
    if (f === "active") setStatusFilter("active");
  }, [params]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (planFilter !== "all" && u.plan !== planFilter) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "active") {
          const isActive24h = Date.now() - new Date(u.last_active).getTime() < 24 * 60 * 60 * 1000 && u.status === "active";
          if (!isActive24h) return false;
        } else if (u.status !== statusFilter) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        return (u.full_name ?? "").toLowerCase().includes(q) || (u.email ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [users, search, planFilter, statusFilter]);

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const premiumUsers = users.filter((u) => ["premium", "unlimited", "lifetime"].includes(u.plan)).length;
  const suspended = users.filter((u) => u.status === "suspended").length;

  const updatePlan = async (userId: string, plan: string) => {
    const { error } = await supabase.from("profiles").update({ plan }).eq("user_id", userId);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Plan updated", description: `User plan changed to ${plan}.` });
    }
  };

  const updateStatus = async (userId: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ status }).eq("user_id", userId);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status updated", description: `User status changed to ${status}.` });
    }
  };

  const exportCSV = () => {
    const headers = ["User ID", "Name", "Email", "Plan", "Status", "Joined", "Last Active", "Listed Products"];
    const rows = filtered.map((u) => [u.user_id, u.full_name ?? "", u.email ?? "", u.plan, u.status, u.created_at, u.last_active, u.listed_products]);
    const csv = [headers, ...rows].map((r) => r.map((v) => {
      const s = String(v).replace(/"/g, '""');
      return /[",\n]/.test(s) ? `"${s}"` : s;
    }).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "geflow-users.csv"; a.click(); URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${filtered.length} users exported.` });
  };

  const StatPill = ({ label, value, icon: Icon, accent }: any) => (
    <div className={`bg-card border border-border rounded-2xl p-5 hover:-translate-y-1 hover:shadow-xl ${accent} transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );

  return (
    <PanelLayout navItems={ADMIN_NAV} {...ADMIN_IDENTITY} isAdmin>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">Users Management</h1>
          <p className="text-sm text-muted-foreground">Monitor platform identity, access levels, and account lifecycle.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search identity..."
              className="h-10 w-64 pl-10 pr-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="h-10 px-4 rounded-xl bg-card border border-border text-sm font-bold inline-flex items-center gap-2 hover:bg-muted transition">
                <Filter className="h-4 w-4" /> Filter
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Plan</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={planFilter} onValueChange={setPlanFilter}>
                {["all", "free", "standard", "premium", "unlimited"].map((p) => (
                  <DropdownMenuRadioItem key={p} value={p} className="capitalize">{p}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                {["all", "active", "suspended", "pending"].map((s) => (
                  <DropdownMenuRadioItem key={s} value={s} className="capitalize">{s}</DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={exportCSV} className="h-10 px-4 rounded-xl bg-card border border-border text-sm font-bold inline-flex items-center gap-2 hover:bg-muted transition">
            <Download className="h-4 w-4" /> Export
          </button>
          <button className="h-10 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-bold inline-flex items-center gap-2 hover:shadow-lg hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all">
            <UserPlus className="h-4 w-4" /> Add New User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatPill label="Total Users" value={totalUsers} icon={UsersIcon} accent="hover:shadow-blue-500/15" />
        <StatPill label="Active Users" value={activeUsers} icon={UserCheck} accent="hover:shadow-emerald-500/15" />
        <StatPill label="Premium Users" value={premiumUsers} icon={Star} accent="hover:shadow-purple-500/15" />
        <StatPill label="Suspended" value={suspended} icon={ShieldAlert} accent="hover:shadow-rose-500/15" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-bold tracking-widest text-muted-foreground border-b border-border">
                <th className="text-left px-6 py-4">USER</th>
                <th className="text-left px-4 py-4">PLAN</th>
                <th className="text-left px-4 py-4">STATUS</th>
                <th className="text-left px-4 py-4">JOINED</th>
                <th className="text-left px-4 py-4">LAST ACTIVE</th>
                <th className="text-right px-4 py-4">PRODUCTS</th>
                <th className="text-right px-6 py-4">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">Loading users...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-muted-foreground">No users match your filters.</td></tr>
              ) : filtered.map((u) => {
                const initial = (u.full_name || u.email || "?").charAt(0).toUpperCase();
                return (
                  <tr key={u.user_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center font-bold ${colorFromName(u.full_name || u.email || "")}`}>{initial}</div>
                        <div className="min-w-0">
                          <p className="font-bold">{u.full_name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full uppercase ${PLAN_STYLES[u.plan] || PLAN_STYLES.free}`}>{u.plan}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold capitalize">
                        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[u.status] || "bg-slate-400"}`} />
                        {u.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                    <td className="px-4 py-4 text-xs text-muted-foreground">{timeAgo(u.last_active)}</td>
                    <td className="px-4 py-4 text-right font-bold">{u.listed_products}</td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center ml-auto"><MoreVertical className="h-4 w-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Change Plan</DropdownMenuLabel>
                          <DropdownMenuRadioGroup value={u.plan} onValueChange={(v) => updatePlan(u.user_id, v)}>
                            {["free", "standard", "premium", "unlimited"].map((p) => (
                              <DropdownMenuRadioItem key={p} value={p} className="capitalize">{p}</DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                          <DropdownMenuSeparator />
                          <DropdownMenuLabel>Status</DropdownMenuLabel>
                          <DropdownMenuRadioGroup value={u.status} onValueChange={(v) => updateStatus(u.user_id, v)}>
                            {["active", "suspended", "pending"].map((s) => (
                              <DropdownMenuRadioItem key={s} value={s} className="capitalize">{s}</DropdownMenuRadioItem>
                            ))}
                          </DropdownMenuRadioGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PanelLayout>
  );
};

export default AdminUsers;
