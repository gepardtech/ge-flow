import { BarChart3 } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";

const UserAnalytics = () => (
  <UserPanelGate pageTitle="Analytics" module="analytics">
    <DemoPanelPage title="Analytics" description="Charts and performance insights for your business." icon={BarChart3} bare />
  </UserPanelGate>
);
export default UserAnalytics;
