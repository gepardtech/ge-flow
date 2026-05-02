import { Package } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
import { usePlan } from "@/hooks/usePlan";

const UserInventory = () => {
  const { plan } = usePlan();
  const max = plan.limits.productsMax;
  return (
    <UserPanelGate pageTitle="Inventory">
      <DemoPanelPage
        title="Inventory"
        description={`All products, batches and stock levels. ${plan.label} plan: ${max === "unlimited" ? "unlimited" : `up to ${max}`} products, ${plan.limits.branchesMax === "unlimited" ? "unlimited" : plan.limits.branchesMax} branch(es).`}
        icon={Package}
        navItems={USER_NAV}
        {...USER_IDENTITY}
      />
    </UserPanelGate>
  );
};
export default UserInventory;
