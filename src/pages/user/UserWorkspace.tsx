import { Settings } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";

const UserWorkspace = () => (
  <UserPanelGate pageTitle="Workspace" module="settings">
    <DemoPanelPage title="Workspace Settings" description="Branding, receipts, taxes and operational preferences." icon={Settings} bare />
  </UserPanelGate>
);
export default UserWorkspace;
