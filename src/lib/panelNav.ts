import {
  Activity, Users, Building2, Tag, Package, CreditCard, Eye, BarChart3,
  LifeBuoy, Settings, LayoutDashboard, AlertCircle, ShoppingCart, ShoppingBag,
  FileText, Settings as SettingsIcon, Repeat, DollarSign, Receipt, Undo2,
  SlidersHorizontal, Megaphone, TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PlanId } from "@/lib/plans";

export interface NavChild { label: string; to: string; }
export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  children?: NavChild[];
  /** Plans allowed to access this item. Undefined = all plans. */
  plans?: PlanId[];
}

export const ADMIN_NAV: NavItem[] = [
  { label: "Dashboard", to: "/admin", icon: Activity },
  { label: "User Directory", to: "/admin/users", icon: Users },
  { label: "Businesses", to: "/admin/businesses", icon: Building2 },
  { label: "Business Categories", to: "/admin/business-categories", icon: Tag },
  { label: "Product Categories", to: "/admin/product-categories", icon: Package },
  {
    label: "Billing & Subs", to: "/admin/billing", icon: CreditCard,
    children: [
      { label: "Subscriptions", to: "/admin/billing/subscriptions" },
      { label: "Pricing Plans", to: "/admin/billing/pricing-plans" },
      { label: "Invoices", to: "/admin/billing/invoices" },
      { label: "Refunds", to: "/admin/billing/refunds" },
      { label: "Coupon Codes", to: "/admin/billing/coupons" },
    ],
  },
  { label: "Feature Control", to: "/admin/features", icon: Eye },
  { label: "Plan Limits", to: "/admin/plan-limits", icon: SlidersHorizontal },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { label: "Support", to: "/admin/support", icon: LifeBuoy },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export const USER_NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Inventory", to: "/dashboard/inventory", icon: Package },
  { label: "Out of Stock", to: "/dashboard/out-of-stock", icon: AlertCircle },
  { label: "POS Terminal", to: "/dashboard/pos", icon: ShoppingCart },
  { label: "Purchases", to: "/dashboard/purchases", icon: ShoppingBag },
  { label: "Reports", to: "/dashboard/reports", icon: FileText },
  { label: "Analytics", to: "/dashboard/analytics", icon: BarChart3 },
  { label: "Team Hub", to: "/dashboard/team", icon: Users },
  { label: "Subscription", to: "/dashboard/subscription", icon: CreditCard },
  { label: "Announcements", to: "/dashboard/announcements", icon: Megaphone },
  { label: "Support", to: "/dashboard/support", icon: LifeBuoy },
  { label: "Workspace", to: "/dashboard/workspace", icon: SettingsIcon },
];

export const ADMIN_IDENTITY = {
  sidebarLabel: "SYSTEM ORCHESTRATION",
  identityName: "Admin Bilal",
  identityRole: "SYSTEM ADMIN",
  identityBadgeClass: "bg-rose-500/15 text-rose-500",
  initial: "A",
};

export const USER_IDENTITY = {
  sidebarLabel: "BUSINESS WORKSPACE",
  identityName: "Operator",
  identityRole: "ACCOUNT OWNER",
  identityBadgeClass: "bg-sky-400/15 text-sky-500",
  initial: "U",
};

// re-export icons used by other files if needed
export { Repeat, DollarSign, Receipt, Undo2 };
