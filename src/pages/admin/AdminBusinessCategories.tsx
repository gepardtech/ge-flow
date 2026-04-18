import { Tag } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminBusinessCategories = () => <DemoPanelPage title="Business Categories" description="Define industry verticals available to operators." icon={Tag} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminBusinessCategories;
