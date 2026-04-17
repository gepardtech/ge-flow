import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, Mail, LogOut, Users, Inbox } from "lucide-react";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface UserRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  plan: string;
  usage: number;
  created_at: string;
}

const Admin = () => {
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [tab, setTab] = useState<"messages" | "users">("messages");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin");

      if (!roles || roles.length === 0) {
        toast({ title: "Access denied", description: "You are not an admin.", variant: "destructive" });
        navigate("/dashboard");
        return;
      }
      setIsAdmin(true);
      fetchAll();
    };
    checkAdmin();
  }, [navigate, toast]);

  const fetchAll = async () => {
    const [{ data: sub }, { data: prof }] = await Promise.all([
      supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email, plan, usage, created_at").order("created_at", { ascending: false }),
    ]);
    setSubmissions((sub as ContactSubmission[]) || []);
    setUsers((prof as UserRow[]) || []);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from("contact_submissions").update({ is_read: true }).eq("id", id);
    setSubmissions((prev) => prev.map((s) => (s.id === id ? { ...s, is_read: true } : s)));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  if (!isAdmin) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Checking access...</div>;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-4 flex items-center justify-between h-14">
          <h1 className="font-bold text-lg">GeFlow Admin</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-2">Control Panel</h2>
        <p className="text-muted-foreground mb-6">Manage GeFlow users and inbound messages.</p>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="premium-card p-5">
            <p className="text-xs font-bold tracking-wider text-muted-foreground mb-2">TOTAL USERS</p>
            <p className="text-3xl font-bold">{users.length}</p>
          </div>
          <div className="premium-card p-5">
            <p className="text-xs font-bold tracking-wider text-muted-foreground mb-2">PAID PLANS</p>
            <p className="text-3xl font-bold text-primary">{users.filter(u => u.plan !== "free").length}</p>
          </div>
          <div className="premium-card p-5">
            <p className="text-xs font-bold tracking-wider text-muted-foreground mb-2">UNREAD MESSAGES</p>
            <p className="text-3xl font-bold text-secondary">{submissions.filter(s => !s.is_read).length}</p>
          </div>
        </div>

        <div className="inline-flex items-center bg-card border border-border rounded-full p-1 gap-1 mb-6">
          <button onClick={() => setTab("messages")} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === "messages" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Inbox className="h-4 w-4" /> Messages
          </button>
          <button onClick={() => setTab("users")} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${tab === "users" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <Users className="h-4 w-4" /> Users
          </button>
        </div>

        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : tab === "messages" ? (
          submissions.length === 0 ? (
            <p className="text-muted-foreground">No submissions yet.</p>
          ) : (
            <div className="space-y-4">
              {submissions.map((s) => (
                <div key={s.id} className={`glass-card rounded-xl p-5 ${!s.is_read ? "border-primary/30" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-sm">{s.name}</span>
                        <span className="text-xs text-muted-foreground">{s.email}</span>
                        {!s.is_read && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">New</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{s.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{new Date(s.created_at).toLocaleString()}</p>
                    </div>
                    {!s.is_read && (
                      <Button variant="outline" size="sm" onClick={() => markAsRead(s.id)}>
                        <Check className="h-3 w-3 mr-1" /> Mark Read
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : users.length === 0 ? (
          <p className="text-muted-foreground">No users yet.</p>
        ) : (
          <div className="premium-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs font-bold tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-5 py-3">NAME</th>
                  <th className="text-left px-5 py-3">EMAIL</th>
                  <th className="text-left px-5 py-3">PLAN</th>
                  <th className="text-left px-5 py-3">USAGE</th>
                  <th className="text-left px-5 py-3">JOINED</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.user_id} className="border-t border-border">
                    <td className="px-5 py-3 font-semibold">{u.full_name || "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${u.plan === "free" ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-5 py-3">{u.usage}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
