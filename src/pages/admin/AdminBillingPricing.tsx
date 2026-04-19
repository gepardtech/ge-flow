import { DollarSign } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminBillingPricing = () => <DemoPanelPage title="Pricing Plans" description="Configure tiers, intervals and feature limits." icon={DollarSign} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminBillingPricing;
