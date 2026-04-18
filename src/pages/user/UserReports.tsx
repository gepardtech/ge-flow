import { FileText } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
const UserReports = () => <DemoPanelPage title="Reports" description="Daily, monthly and custom reports across your business." icon={FileText} navItems={USER_NAV} {...USER_IDENTITY} />;
export default UserReports;
