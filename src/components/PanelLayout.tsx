import { ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, ChevronLeft, LogOut, RefreshCw, Search, Sun, Moon, LucideIcon } from "lucide-react";
import { useTheme } from "next-themes";

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

interface Props {
  children: ReactNode;
  sidebarLabel: string;
  navItems: NavItem[];
  identityName: string;
  identityRole: string;
  identityBadgeClass?: string;
  initial: string;
}

const PanelLayout = ({ children, sidebarLabel, navItems, identityName, identityRole, identityBadgeClass = "bg-primary/10 text-primary", initial }: Props) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className={`${collapsed ? "w-20" : "w-64"} hidden md:flex flex-col border-r border-border bg-background transition-all duration-300`}>
        <div className="flex items-center justify-between p-4 border-b border-border h-16">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm">G</div>
              <span className="font-bold text-lg">GeFlow</span>
            </Link>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 rounded-lg hover:bg-muted flex items-center justify-center">
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          {!collapsed && <p className="text-[10px] font-bold tracking-widest text-muted-foreground px-3 mb-3 mt-2">{sidebarLabel}</p>}
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-sky-400 text-white shadow-sm dark:bg-sky-500/90"
                        : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
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

        {!collapsed && (
          <div className="p-3 border-t border-border">
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
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-border bg-background flex items-center gap-3 px-4 md:px-6">
          <div className="flex-1 max-w-xl relative">
            <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search anything..."
              className="w-full h-10 pl-10 pr-4 bg-muted/40 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center relative">
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-destructive" />
            </button>
            <button className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button onClick={handleLogout} className="h-10 w-10 rounded-xl hover:bg-muted flex items-center justify-center">
              <LogOut className="h-4 w-4" />
            </button>
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-foreground font-bold text-sm ml-1">
              {initial}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};

export default PanelLayout;
