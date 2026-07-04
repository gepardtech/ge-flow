import { Settings } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";

const UserWorkspace = () => (
  <UserPanelGate pageTitle="Workspace" module="settings">
    <DemoPanelPage title="Workspace Settings" description="Branding, receipts, taxes and operational preferences." icon={Settings} bare />
  </UserPanelGate>
);
export default UserWorkspace;
