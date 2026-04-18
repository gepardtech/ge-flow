import { CreditCard } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
const UserSubscription = () => <DemoPanelPage title="Subscription" description="Manage your plan, invoices and payment method." icon={CreditCard} navItems={USER_NAV} {...USER_IDENTITY} />;
export default UserSubscription;
