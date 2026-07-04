import { FileText } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
import { usePlan } from "@/hooks/usePlan";

const UserReports = () => {
  const { plan } = usePlan();
  const w = plan.limits.reportsWindowDays;
  const window = w === "lifetime" ? "any time period (lifetime)" : `${w} days`;
  return (
    <UserPanelGate pageTitle="Reports" module="reports">
      <DemoPanelPage
        title="Reports"
        description={`${plan.label} plan: report window covers ${window}.`}
        icon={FileText}
        bare
      />
    </UserPanelGate>
  );
};
export default UserReports;
