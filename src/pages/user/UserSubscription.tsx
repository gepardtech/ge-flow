import { CreditCard } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";

const UserSubscription = () => (
  <UserPanelGate pageTitle="Subscription">
    <DemoPanelPage title="Subscription" description="Manage your plan, invoices and payment method." icon={CreditCard} bare />
  </UserPanelGate>
);
export default UserSubscription;
