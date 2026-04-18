import { Building2 } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminBusinesses = () => <DemoPanelPage title="Businesses" description="Registered businesses across pharmacy, retail and warehouse." icon={Building2} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminBusinesses;
