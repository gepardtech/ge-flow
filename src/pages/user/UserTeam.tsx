import { Users } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";

const UserTeam = () => (
  <UserPanelGate pageTitle="Team Hub" module="team">
    <DemoPanelPage title="Team Hub" description="Invite cashiers, managers and warehouse staff." icon={Users} bare />
  </UserPanelGate>
);
export default UserTeam;
