import { ShoppingCart } from "lucide-react";
import DemoPanelPage from "@/components/DemoPanelPage";
import { USER_NAV, USER_IDENTITY } from "@/lib/panelNav";
const UserPOS = () => <DemoPanelPage title="POS Terminal" description="Fast checkout terminal for in-store and counter sales." icon={ShoppingCart} navItems={USER_NAV} {...USER_IDENTITY} />;
export default UserPOS;
