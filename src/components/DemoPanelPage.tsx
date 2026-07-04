import { ReactNode } from "react";
import { LucideIcon, Sparkles, TrendingUp, Activity, ArrowUpRight, Plus, Search, Filter } from "lucide-react";
import PanelLayout, { NavItem } from "@/components/PanelLayout";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  sidebarLabel?: string;
  navItems?: NavItem[];
  identityName?: string;
  identityRole?: string;
  identityBadgeClass?: string;
  initial?: string;
  children?: ReactNode;
  /** When true, render only the page content (no PanelLayout wrapper).
   *  Used when the page is already inside a gate that provides the layout. */
  bare?: boolean;
}

const DemoPanelPage = ({
  title, description, icon: Icon, sidebarLabel, navItems,
  identityName, identityRole, identityBadgeClass, initial, children, bare,
}: Props) => {
  const isAdmin = (navItems ?? []).some((n) => n.to.startsWith("/admin"));


  const stats = [
    { label: "TOTAL", value: "—", change: "+0%", icon: Sparkles, accent: "hover:shadow-sky-500/15", iconBg: "bg-sky-400/15 text-sky-500" },
    { label: "ACTIVE", value: "—", change: "+0%", icon: Activity, accent: "hover:shadow-emerald-500/15", iconBg: "bg-emerald-400/15 text-emerald-500" },
    { label: "GROWTH", value: "—", change: "+0%", icon: TrendingUp, accent: "hover:shadow-violet-500/15", iconBg: "bg-violet-400/15 text-violet-500" },
    { label: "PENDING", value: "—", change: "0", icon: ArrowUpRight, accent: "hover:shadow-amber-500/15", iconBg: "bg-amber-400/15 text-amber-500" },
  ];

  return (
    <PanelLayout
      sidebarLabel={sidebarLabel}
      navItems={navItems}
      identityName={identityName}
      identityRole={identityRole}
      identityBadgeClass={identityBadgeClass}
      initial={initial}
      isAdmin={isAdmin}
    >
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-1">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input placeholder="Search..." className="h-10 w-56 pl-10 pr-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
          </div>
          <button className="h-10 px-4 rounded-xl bg-card border border-border text-sm font-bold inline-flex items-center gap-2 hover:bg-muted transition">
            <Filter className="h-4 w-4" /> Filter
          </button>
          <button className="h-10 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-bold inline-flex items-center gap-2 hover:shadow-lg hover:shadow-sky-500/30 hover:-translate-y-0.5 transition-all">
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      </div>

      {children ?? (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s) => (
              <div key={s.label} className={`bg-card border border-border rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-xl ${s.accent}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${s.iconBg}`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <span className="text-[10px] font-bold tracking-widest text-emerald-500">{s.change}</span>
                </div>
                <p className="text-[10px] font-bold tracking-widest text-muted-foreground mb-1">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">{title} Records</h3>
                <p className="text-xs text-muted-foreground">Live view — connect this module to populate real data.</p>
              </div>
              <span className="text-[10px] font-bold tracking-widest text-sky-500 bg-sky-400/10 px-2.5 py-1 rounded-full">REAL-TIME</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-bold tracking-widest text-muted-foreground border-b border-border">
                    <th className="text-left px-4 py-3">NAME</th>
                    <th className="text-left px-4 py-3">CATEGORY</th>
                    <th className="text-left px-4 py-3">STATUS</th>
                    <th className="text-right px-4 py-3">UPDATED</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-sky-400/20 to-violet-400/20 flex items-center justify-center">
                            <Icon className="h-4 w-4 text-sky-500" />
                          </div>
                          <div>
                            <p className="font-semibold">Record #{i + 1001}</p>
                            <p className="text-xs text-muted-foreground">Auto-generated placeholder</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">{["Operations", "Catalog", "Customer", "Vendor", "Inventory", "Finance"][i % 6]}</td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Active
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right text-xs text-muted-foreground">{i + 1}h ago</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gradient-to-br from-sky-500/10 to-violet-500/10 border border-border rounded-2xl p-6">
            <div className="inline-flex items-center gap-2 text-[10px] font-bold tracking-widest bg-sky-500/15 text-sky-600 dark:text-sky-300 px-2.5 py-1 rounded-full mb-3">
              <Sparkles className="h-3 w-3" /> GEFLOW INTELLIGENCE
            </div>
            <h3 className="font-bold text-lg">Module ready to be activated</h3>
            <p className="text-sm text-muted-foreground mt-1">This {title.toLowerCase()} workspace is set up with realtime hooks. We'll wire it to real records next.</p>
          </div>
        </>
      )}
    </PanelLayout>
  );
};

export default DemoPanelPage;
