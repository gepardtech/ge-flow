import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import PanelLayout from "@/components/PanelLayout";
import { userNavForPlanAndModules } from "@/lib/panelNav";
import { usePlan } from "@/hooks/usePlan";
import { useBusinessModules } from "@/hooks/useBusinessModules";
import { isRouteLocked } from "@/lib/plans";
import PlanLockedScreen from "@/components/PlanLockedScreen";

interface Props {
  children: ReactNode;
  pageTitle: string;
  /** Business-category module id this page belongs to. Hidden when not appointed. */
  module?: string;
}

/**
 * Shared wrapper for ALL /dashboard/* pages.
 * - Loads plan in realtime
 * - Renders the user PanelLayout with plan-aware identity
 * - Filters the sidebar to admin-appointed modules for the active business
 * - Blocks locked routes with an upgrade screen
 */
const UserPanelGate = ({ children, pageTitle, module }: Props) => {
  const { plan, planId, fullName, loading } = usePlan();
  const { modules, loading: modulesLoading } = useBusinessModules();
  const location = useLocation();

  if (loading || modulesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading workspace...
      </div>
    );
  }

  const firstName = fullName?.split(" ")[0] || "Operator";
  const initial = firstName.charAt(0).toUpperCase();
  const locked = isRouteLocked(planId, location.pathname);
  const moduleBlocked = !!module && modules !== null && !modules.includes(module);

  return (
    <PanelLayout
      sidebarLabel="BUSINESS WORKSPACE"
      navItems={userNavForPlanAndModules(planId, modules)}
      identityName={`${plan.label} ${firstName}`}
      identityRole={`${plan.label.toUpperCase()} PLAN`}
      identityBadgeClass={plan.badgeClass}
      initial={initial}
      lockedPaths={plan.lockedRoutes}
    >
      {moduleBlocked ? (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl font-bold mb-2">{pageTitle} is not available</h2>
          <p className="text-muted-foreground max-w-md">
            This module hasn't been enabled for your business category. Contact your administrator to request access.
          </p>
        </div>
      ) : locked ? (
        <PlanLockedScreen currentPlan={planId} path={location.pathname} pageTitle={pageTitle} />
      ) : (
        children
      )}
    </PanelLayout>
  );
};

export default UserPanelGate;
