import {
  Activity, Users, Building2, Tag, Package, CreditCard, Eye, BarChart3,
  LifeBuoy, Settings, LayoutDashboard, AlertCircle, ShoppingCart, ShoppingBag,
  FileText, Settings as SettingsIcon, Repeat, DollarSign, Receipt, Undo2,
  SlidersHorizontal, Megaphone, TriangleAlert, Bell,
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
  /** Business-category module id required to see this item. Undefined = always visible. */
  module?: string;
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
  { label: "Notifications", to: "/admin/notifications", icon: Bell },
  { label: "Support", to: "/admin/support", icon: LifeBuoy },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

export const USER_NAV: NavItem[] = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { label: "Inventory", to: "/dashboard/inventory", icon: Package, module: "inventory" },
  { label: "Low Stock", to: "/dashboard/low-stock", icon: TriangleAlert, module: "inventory" },
  { label: "Out of Stock", to: "/dashboard/out-of-stock", icon: AlertCircle, module: "inventory" },
  { label: "POS Terminal", to: "/dashboard/pos", icon: ShoppingCart, module: "pos" },
  { label: "Purchases", to: "/dashboard/purchases", icon: ShoppingBag, plans: ["standard", "premium", "lifetime"], module: "purchases" },
  { label: "Reports", to: "/dashboard/reports", icon: FileText, module: "reports" },
  { label: "Analytics", to: "/dashboard/analytics", icon: BarChart3, plans: ["premium", "lifetime"], module: "analytics" },
  { label: "My Businesses", to: "/dashboard/businesses", icon: Building2 },
  { label: "Team Hub", to: "/dashboard/team", icon: Users, plans: ["standard", "premium", "lifetime"], module: "team" },
  { label: "Subscription", to: "/dashboard/subscription", icon: CreditCard },
  {
    label: "Announcements", to: "/dashboard/announcements", icon: Megaphone,
    children: [
      { label: "All Updates", to: "/dashboard/announcements" },
      { label: "Notifications", to: "/dashboard/announcements/notifications" },
    ],
  },
  { label: "Support", to: "/dashboard/support", icon: LifeBuoy },
  { label: "Workspace", to: "/dashboard/workspace", icon: SettingsIcon, module: "settings" },
];

/** Returns the nav items a given plan is allowed to see. */
export const userNavForPlan = (planId: PlanId): NavItem[] =>
  USER_NAV.filter((item) => !item.plans || item.plans.includes(planId));

/**
 * Returns nav items allowed by BOTH the user's plan and the admin-appointed
 * modules for the active business category. When `modules` is null (no business
 * category resolved yet) module gating is skipped so account pages stay usable.
 */
export const userNavForPlanAndModules = (
  planId: PlanId,
  modules: string[] | null,
  isFeatureEnabled: (code?: string | null) => boolean = () => true,
): NavItem[] =>
  USER_NAV.filter((item) => {
    if (item.plans && !item.plans.includes(planId)) return false;
    if (item.module && modules !== null && !modules.includes(item.module)) return false;
    if (item.module && !isFeatureEnabled(item.module)) return false;
    return true;
  });



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
