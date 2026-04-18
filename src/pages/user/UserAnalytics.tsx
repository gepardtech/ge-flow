import { BarChart3 } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
const UserAnalytics = () => <DemoPanelPage title="Analytics" description="Sales velocity, profit margins and category performance." icon={BarChart3} navItems={USER_NAV} {...USER_IDENTITY} />;
export default UserAnalytics;
