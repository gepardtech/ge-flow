import { Eye } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminFeatures = () => <DemoPanelPage title="Feature Control" description="Toggle modules and rollout flags per plan." icon={Eye} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminFeatures;
