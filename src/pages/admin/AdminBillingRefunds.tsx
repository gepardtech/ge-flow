import { Undo2 } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminBillingRefunds = () => <DemoPanelPage title="Refunds" description="Refund requests and processed reimbursements." icon={Undo2} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminBillingRefunds;
