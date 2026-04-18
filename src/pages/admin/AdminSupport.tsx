import { LifeBuoy } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminSupport = () => <DemoPanelPage title="Support" description="Tickets, escalations and contact submissions." icon={LifeBuoy} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminSupport;
