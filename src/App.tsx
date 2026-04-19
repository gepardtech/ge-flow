import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import HowItWorks from "./pages/HowItWorks";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Privacy from "./pages/Privacy";
import Refund from "./pages/Refund";
import Terms from "./pages/Terms";
import Disclaimer from "./pages/Disclaimer";
import NotFound from "./pages/NotFound";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminBusinesses from "./pages/admin/AdminBusinesses";
import AdminBusinessCategories from "./pages/admin/AdminBusinessCategories";
import AdminProductCategories from "./pages/admin/AdminProductCategories";
import AdminBilling from "./pages/admin/AdminBilling";
import AdminBillingSubscriptions from "./pages/admin/AdminBillingSubscriptions";
import AdminBillingPricing from "./pages/admin/AdminBillingPricing";
import AdminBillingInvoices from "./pages/admin/AdminBillingInvoices";
import AdminBillingRefunds from "./pages/admin/AdminBillingRefunds";
import AdminFeatures from "./pages/admin/AdminFeatures";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminSettings from "./pages/admin/AdminSettings";

import UserInventory from "./pages/user/UserInventory";
import UserOutOfStock from "./pages/user/UserOutOfStock";
import UserPOS from "./pages/user/UserPOS";
import UserPurchases from "./pages/user/UserPurchases";
import UserReports from "./pages/user/UserReports";
import UserAnalytics from "./pages/user/UserAnalytics";
import UserTeam from "./pages/user/UserTeam";
import UserSubscription from "./pages/user/UserSubscription";
import UserWorkspace from "./pages/user/UserWorkspace";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/features" element={<Features />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/businesses" element={<AdminBusinesses />} />
          <Route path="/admin/business-categories" element={<AdminBusinessCategories />} />
          <Route path="/admin/product-categories" element={<AdminProductCategories />} />
          <Route path="/admin/billing" element={<AdminBilling />} />
          <Route path="/admin/billing/subscriptions" element={<AdminBillingSubscriptions />} />
          <Route path="/admin/billing/pricing-plans" element={<AdminBillingPricing />} />
          <Route path="/admin/billing/invoices" element={<AdminBillingInvoices />} />
          <Route path="/admin/billing/refunds" element={<AdminBillingRefunds />} />
          <Route path="/admin/features" element={<AdminFeatures />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/support" element={<AdminSupport />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/inventory" element={<UserInventory />} />
          <Route path="/dashboard/out-of-stock" element={<UserOutOfStock />} />
          <Route path="/dashboard/pos" element={<UserPOS />} />
          <Route path="/dashboard/purchases" element={<UserPurchases />} />
          <Route path="/dashboard/reports" element={<UserReports />} />
          <Route path="/dashboard/analytics" element={<UserAnalytics />} />
          <Route path="/dashboard/team" element={<UserTeam />} />
          <Route path="/dashboard/subscription" element={<UserSubscription />} />
          <Route path="/dashboard/workspace" element={<UserWorkspace />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/disclaimer" element={<Disclaimer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
