import { BarChart3 } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { ADMIN_NAV, ADMIN_IDENTITY } from "@/lib/panelNav";
const AdminAnalytics = () => <DemoPanelPage title="Analytics" description="System-wide engagement, growth and AI usage analytics." icon={BarChart3} navItems={ADMIN_NAV} {...ADMIN_IDENTITY} />;
export default AdminAnalytics;
