import { Users } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminUsers = () => <DemoPanelPage title="User Directory" description="Search, filter and manage every account in the system." icon={Users} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminUsers;
