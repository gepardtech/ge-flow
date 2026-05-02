import { AlertCircle } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
import { usePlan } from "@/hooks/usePlan";

const UserOutOfStock = () => {
  const { plan } = usePlan();
  const max = plan.limits.outOfStockMax;
  return (
    <UserPanelGate pageTitle="Out of Stock">
      <DemoPanelPage
        title="Out of Stock"
        description={`${plan.label} plan: monitor up to ${max === "unlimited" ? "unlimited" : max} out-of-stock SKUs.`}
        icon={AlertCircle}
        navItems={USER_NAV}
        {...USER_IDENTITY}
      />
    </UserPanelGate>
  );
};
export default UserOutOfStock;
