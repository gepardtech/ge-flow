import { Users } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
const UserTeam = () => <DemoPanelPage title="Team Hub" description="Invite cashiers, managers and warehouse staff." icon={Users} navItems={USER_NAV} {...USER_IDENTITY} />;
export default UserTeam;
