import { AlertCircle } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
const UserOutOfStock = () => <DemoPanelPage title="Out of Stock" description="Items that need urgent restocking before sales are lost." icon={AlertCircle} navItems={USER_NAV} {...USER_IDENTITY} />;
export default UserOutOfStock;
