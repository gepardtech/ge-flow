import { CreditCard } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminBilling = () => <DemoPanelPage title="Billing & Subscriptions" description="Recurring revenue, invoices and plan changes." icon={CreditCard} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminBilling;
