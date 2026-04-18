import { Settings } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminSettings = () => <DemoPanelPage title="System Settings" description="Branding, security policies and platform defaults." icon={Settings} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminSettings;
