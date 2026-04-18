import { Settings } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
const UserWorkspace = () => <DemoPanelPage title="Workspace Settings" description="Branding, receipts, taxes and operational preferences." icon={Settings} navItems={USER_NAV} {...USER_IDENTITY} />;
export default UserWorkspace;
