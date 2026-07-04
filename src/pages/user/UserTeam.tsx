import { Users } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";

const UserTeam = () => (
  <UserPanelGate pageTitle="Team Hub" module="team">
    <DemoPanelPage title="Team Hub" description="Invite cashiers, managers and warehouse staff." icon={Users} bare />
  </UserPanelGate>
);
export default UserTeam;
