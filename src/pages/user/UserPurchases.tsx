import { ShoppingBag } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";

const UserPurchases = () => (
  <UserPanelGate pageTitle="Purchases" module="purchases">
    <DemoPanelPage title="Purchases" description="Supplier orders, receipts and stock-in records." icon={ShoppingBag} navItems={USER_NAV} {...USER_IDENTITY} />
  </UserPanelGate>
);
export default UserPurchases;
