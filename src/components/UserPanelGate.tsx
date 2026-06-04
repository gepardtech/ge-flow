import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import PanelLayout from "@/components/PanelLayout";
import { userNavForPlan } from "@/lib/panelNav";
import { usePlan } from "@/hooks/usePlan";
import { isRouteLocked } from "@/lib/plans";
import PlanLockedScreen from "@/components/PlanLockedScreen";

interface Props {
  children: ReactNode;
  pageTitle: string;
}

/**
 * Shared wrapper for ALL /dashboard/* pages.
 * - Loads plan in realtime
 * - Renders the user PanelLayout with plan-aware identity
 * - Blocks locked routes with an upgrade screen
 */
const UserPanelGate = ({ children, pageTitle }: Props) => {
  const { plan, planId, fullName, loading } = usePlan();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading workspace...
      </div>
    );
  }

  const firstName = fullName?.split(" ")[0] || "Operator";
  const initial = firstName.charAt(0).toUpperCase();
  const locked = isRouteLocked(planId, location.pathname);

  return (
    <PanelLayout
      sidebarLabel="BUSINESS WORKSPACE"
      navItems={USER_NAV}
      identityName={`${plan.label} ${firstName}`}
      identityRole={`${plan.label.toUpperCase()} PLAN`}
      identityBadgeClass={plan.badgeClass}
      initial={initial}
      lockedPaths={plan.lockedRoutes}
    >
      {locked ? (
        <PlanLockedScreen currentPlan={planId} path={location.pathname} pageTitle={pageTitle} />
      ) : (
        children
      )}
    </PanelLayout>
  );
};

export default UserPanelGate;
