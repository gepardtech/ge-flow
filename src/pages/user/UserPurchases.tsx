import { ShoppingBag } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
const UserPurchases = () => <DemoPanelPage title="Purchases" description="Supplier orders, receipts and stock-in records." icon={ShoppingBag} navItems={USER_NAV} {...USER_IDENTITY} />;
export default UserPurchases;
