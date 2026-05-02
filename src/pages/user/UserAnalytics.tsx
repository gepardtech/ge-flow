import { BarChart3 } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";

const UserAnalytics = () => (
  <UserPanelGate pageTitle="Analytics">
    <DemoPanelPage title="Analytics" description="Charts and performance insights for your business." icon={BarChart3} navItems={USER_NAV} {...USER_IDENTITY} />
  </UserPanelGate>
);
export default UserAnalytics;
