import { ReactNode } from "react";
import { LucideIcon, Sparkles } from "lucide-react";
import PanelLayout, { NavItem } from "@/components/PanelLayout";

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  sidebarLabel: string;
  navItems: NavItem[];
  identityName: string;
  identityRole: string;
  identityBadgeClass?: string;
  initial: string;
  children?: ReactNode;
}

const DemoPanelPage = ({
  title, description, icon: Icon, sidebarLabel, navItems,
  identityName, identityRole, identityBadgeClass, initial, children,
}: Props) => (
  <PanelLayout
    sidebarLabel={sidebarLabel}
    navItems={navItems}
    identityName={identityName}
    identityRole={identityRole}
    identityBadgeClass={identityBadgeClass}
    initial={initial}
  >
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-10 w-10 rounded-xl bg-sky-400/15 flex items-center justify-center">
          <Icon className="h-5 w-5 text-sky-500" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
      </div>
      <p className="text-sm text-muted-foreground ml-[52px]">{description}</p>
    </div>

    {children ?? (
      <div className="grid lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-all">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/15 to-sky-400/15 flex items-center justify-center mb-4">
              <Sparkles className="h-4 w-4 text-violet-500" />
            </div>
            <h3 className="font-bold mb-1.5">Module {i}</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Placeholder section for the {title.toLowerCase()} workspace. We will iterate on this together.
            </p>
            <div className="space-y-2">
              {[80, 60, 40].map((w) => (
                <div key={w} className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-base">Activity Stream</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Recent events for this section</p>
            </div>
            <span className="text-[10px] font-bold tracking-widest text-sky-500 bg-sky-400/10 px-2.5 py-1 rounded-full">DEMO</span>
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-sky-400/20 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">Sample event #{i + 1}</p>
                  <p className="text-xs text-muted-foreground">Demo data — to be replaced with real records</p>
                </div>
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground">PENDING</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
  </PanelLayout>
);

export default DemoPanelPage;
