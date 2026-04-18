import { Package } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminProductCategories = () => <DemoPanelPage title="Product Categories" description="Global taxonomy for inventory across every workspace." icon={Package} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminProductCategories;
