import { ReactNode, useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, ChevronLeft, ChevronDown, LogOut, RefreshCw, Search, Sun, Moon, Settings, LifeBuoy, User as UserIcon, LogIn, LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface NavChild { label: string; to: string; }
export interface NavItem { label: string; to: string; icon: LucideIcon; children?: NavChild[]; }

interface Notification { id: string; title: string; description: string; createdAt: string; unread: boolean; }

interface Props {
  children: ReactNode;
  sidebarLabel: string;
  navItems: NavItem[];
  identityName: string;
  identityRole: string;
  identityBadgeClass?: string;
  initial: string;
  isAdmin?: boolean;
}

const PanelLayout = ({ children, sidebarLabel, navItems, identityName, identityRole, identityBadgeClass = "bg-primary/10 text-primary", initial, isAdmin = false }: Props) => {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Auto-open groups containing the active route
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    navItems.forEach((item) => {
      if (item.children?.some((c) => location.pathname.startsWith(c.to)) || location.pathname === item.to) {
        if (item.children) initial[item.to] = true;
      }
    });
    setOpenGroups((prev) => ({ ...initial, ...prev }));
  }, [location.pathname, navItems]);

  const settingsPath = isAdmin ? "/admin/settings" : "/dashboard/workspace";
  const supportPath = isAdmin ? "/admin/support" : "/contact";

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const fetchNotifications = useCallback(async () => {
    if (isAdmin) {
      const { data } = await supabase
        .from("contact_submissions")
        .select("id, name, message, is_read, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      setNotifications(
        (data ?? []).map((d: any) => ({
          id: d.id,
          title: `New message from ${d.name}`,
          description: d.message?.slice(0, 80) ?? "",
          createdAt: d.created_at,
          unread: !d.is_read,
        }))
      );
    } else {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setNotifications([
          { id: "welcome", title: "Welcome to GeFlow", description: "Your workspace is ready.", createdAt: data.user.created_at, unread: true },
        ]);
      }
    }
  }, [isAdmin]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // Realtime updates for admin
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel("contact_notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "contact_submissions" }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin, fetchNotifications]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
    window.dispatchEvent(new CustomEvent("panel:refresh"));
    toast({ title: "Refreshed", description: "Latest data loaded." });
    setTimeout(() => setRefreshing(false), 700);
  };

  const unreadCount = notifications.filter((n) => n.unread).length;
  const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar — fixed height, internal scroll only on nav */}
      <aside className={`${collapsed ? "w-20" : "w-64"} hidden md:flex flex-col border-r border-border bg-background transition-all duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border h-16 flex-shrink-0">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-sky-400 flex items-center justify-center text-white font-bold text-sm">G</div>
              <span className="font-bold text-lg bg-gradient-to-r from-violet-500 to-sky-400 bg-clip-text text-transparent">GeFlow</span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Nav — scrollable */}
        <nav className="flex-1 p-3 overflow-y-auto min-h-0">
          {!collapsed && <p className="text-[10px] font-bold tracking-widest text-muted-foreground px-3 mb-3 mt-2">{sidebarLabel}</p>}
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isGroup = !!item.children?.length;
              const groupOpen = openGroups[item.to] ?? false;
              const active = location.pathname === item.to ||
                (isGroup && item.children!.some((c) => location.pathname === c.to));

              if (isGroup && !collapsed) {
                return (
                  <li key={item.to}>
                    <button
                      onClick={() => setOpenGroups((s) => ({ ...s, [item.to]: !groupOpen }))}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        active ? "bg-sky-400 text-white shadow-sm dark:bg-sky-500/90" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${groupOpen ? "rotate-180" : ""}`} />
                    </button>
                    {groupOpen && (
                      <ul className="mt-1 ml-7 space-y-0.5 border-l border-border pl-2">
                        {item.children!.map((c) => {
                          const cActive = location.pathname === c.to;
                          return (
                            <li key={c.to}>
                              <Link
                                to={c.to}
                                className={`block px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                  cActive ? "bg-sky-400/15 text-sky-600 dark:text-sky-300" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                }`}
                              >
                                {c.label}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              }

              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active ? "bg-sky-400 text-white shadow-sm dark:bg-sky-500/90" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Frozen footer */}
        {!collapsed && (
          <div className="p-3 border-t border-border flex-shrink-0 bg-background">
            <div className="bg-muted/40 rounded-xl p-3 mb-2">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground">IDENTITY</p>
              <p className="font-bold text-sm mt-1">{identityName}</p>
              <span className={`inline-block text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full mt-1.5 ${identityBadgeClass}`}>{identityRole}</span>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="h-16 border-b border-border bg-background flex items-center gap-3 px-4 md:px-6 flex-shrink-0">
          <div className="flex-1 max-w-xl relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full h-10 pl-10 pr-4 bg-muted/40 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {/* Theme toggle */}
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center transition-all hover:scale-105"
              aria-label="Toggle theme"
            >
              {mounted && (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />)}
            </button>

            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center relative transition-all hover:scale-105">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <p className="font-bold text-sm">Notifications</p>
                  <span className="text-[10px] font-bold tracking-widest text-sky-500">{unreadCount} NEW</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="p-6 text-center text-xs text-muted-foreground">No notifications</p>
                  ) : (
                    notifications.map((n) => (
                      <div key={n.id} className={`p-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${n.unread ? "bg-sky-400/5" : ""}`}>
                        <p className="text-sm font-semibold">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </PopoverContent>
            </Popover>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center transition-all hover:scale-105"
              aria-label="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>

            {/* Quick logout */}
            <button
              onClick={handleLogout}
              className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center transition-all hover:scale-105"
              aria-label="Logout"
              title="Logout"
            >
              <LogIn className="h-4 w-4 rotate-180" />
            </button>

            {/* Profile dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm ml-1 hover:scale-105 transition-transform">
                  {initial}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-bold">{identityName}</p>
                  <p className="text-[10px] font-bold tracking-widest text-muted-foreground mt-0.5">{identityRole}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(settingsPath)}>
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(supportPath)}>
                  <LifeBuoy className="h-4 w-4 mr-2" /> Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};

export default PanelLayout;
