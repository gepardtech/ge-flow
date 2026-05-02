import { CreditCard } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";

const UserSubscription = () => (
  <UserPanelGate pageTitle="Subscription">
    <DemoPanelPage title="Subscription" description="Manage your plan, invoices and payment method." icon={CreditCard} navItems={USER_NAV} {...USER_IDENTITY} />
  </UserPanelGate>
);
export default UserSubscription;
