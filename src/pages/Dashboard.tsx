import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, User, CreditCard, Activity, Mail } from "lucide-react";

interface Profile {
  full_name: string | null;
  email: string | null;
  plan: string;
  usage: number;
}

const Dashboard = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, plan, usage")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile((data as Profile) || { full_name: null, email: user.email ?? null, plan: "free", usage: 0 });
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading dashboard...</div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <h1 className="font-bold text-lg">GeFlow Dashboard</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <h2 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name?.split(" ")[0] || "there"} 👋</h2>
        <p className="text-muted-foreground mb-8">Here's a quick snapshot of your GeFlow workspace.</p>

        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground mb-3">
              <CreditCard className="h-4 w-4 text-primary" /> CURRENT PLAN
            </div>
            <p className="text-2xl font-bold capitalize">{profile?.plan || "free"}</p>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground mb-3">
              <Activity className="h-4 w-4 text-primary" /> USAGE
            </div>
            <p className="text-2xl font-bold">{profile?.usage ?? 0}<span className="text-sm text-muted-foreground"> / 100</span></p>
          </div>
          <div className="premium-card p-6">
            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-muted-foreground mb-3">
              <Mail className="h-4 w-4 text-primary" /> EMAIL
            </div>
            <p className="text-sm font-semibold truncate">{profile?.email}</p>
          </div>
        </div>

        <div className="premium-card p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Account Information</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 text-sm">
            <div>
              <p className="text-xs font-bold tracking-wider text-muted-foreground mb-1">FULL NAME</p>
              <p className="font-semibold">{profile?.full_name || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider text-muted-foreground mb-1">EMAIL</p>
              <p className="font-semibold">{profile?.email}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider text-muted-foreground mb-1">PLAN</p>
              <p className="font-semibold capitalize">{profile?.plan}</p>
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider text-muted-foreground mb-1">USAGE</p>
              <p className="font-semibold">{profile?.usage ?? 0} actions</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-6 italic">
            This is a demo dashboard. We'll wire up real workspace tools, inventory, and analytics in the next iteration.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
