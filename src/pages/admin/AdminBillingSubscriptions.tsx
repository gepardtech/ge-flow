import { Repeat } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminBillingSubscriptions = () => <DemoPanelPage title="Subscriptions" description="Active recurring subscriptions across all customers." icon={Repeat} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminBillingSubscriptions;
