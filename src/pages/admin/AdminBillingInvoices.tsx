import { Receipt } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminBillingInvoices = () => <DemoPanelPage title="Invoices" description="Issued invoices, payment status and downloads." icon={Receipt} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminBillingInvoices;
