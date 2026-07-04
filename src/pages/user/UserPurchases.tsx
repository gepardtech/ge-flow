import { ShoppingBag } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";

const UserPurchases = () => (
  <UserPanelGate pageTitle="Purchases" module="purchases">
    <DemoPanelPage title="Purchases" description="Supplier orders, receipts and stock-in records." icon={ShoppingBag} bare />
  </UserPanelGate>
);
export default UserPurchases;
