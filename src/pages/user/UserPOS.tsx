import { ShoppingCart } from "lucide-react";
import UserPanelGate from "@/components/UserPanelGate";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";

const UserPOS = () => (
  <UserPanelGate pageTitle="POS Terminal">
    <DemoPanelPage title="POS Terminal" description="Fast checkout terminal for in-store and counter sales." icon={ShoppingCart} navItems={USER_NAV} {...USER_IDENTITY} />
  </UserPanelGate>
);
export default UserPOS;
