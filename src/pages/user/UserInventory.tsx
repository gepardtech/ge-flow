import { Package } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
const UserInventory = () => <DemoPanelPage title="Inventory" description="All products, batches and stock levels in one ledger." icon={Package} navItems={USER_NAV} {...USER_IDENTITY} />;
export default UserInventory;
