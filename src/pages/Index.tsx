import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import CTASection from "@/components/CTASection";
import heroLaptop from "@/assets/hero-laptop.jpg";
import aboutOffice from "@/assets/about-office.jpg";
import {
  Package, ShoppingCart, TrendingUp, BarChart3, Users,
  ArrowRight, Check, Clipboard, Truck, Activity, Smartphone, Expand
} from "lucide-react";

const workflowSteps = [
  { icon: Clipboard, num: "01", title: "Create Workspace", desc: "System initializes your business environment instantly." },
  { icon: Package, num: "02", title: "Add Inventory", desc: "Add items with stock, price, and SKU codes." },
  { icon: ShoppingCart, num: "03", title: "Start Sales (POS)", desc: "Fast billing with automatic stock deduction." },
  { icon: Truck, num: "04", title: "Manage Purchases", desc: "Stock increases automatically from suppliers." },
  { icon: Activity, num: "05", title: "Track Performance", desc: "Profit, reports, and analytics in real time." },
];

const features = [
  { icon: Package, title: "Inventory Management", desc: "Real-time stock tracking with SKU system and stock ledger history." },
  { icon: ShoppingCart, title: "POS System", desc: "Fast billing engine with barcode support and instant invoice generation." },
  { icon: TrendingUp, title: "Finance System", desc: "Profit tracking, expense management, and financial summaries." },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Sales reports, stock reports, and profit analytics dashboards." },
  { icon: Users, title: "User Management", desc: "Role-based access control with multi-user system." },
];

const freePlanFeatures = ["100 items limit", "Basic POS", "Single user", "Real time Profit"];
const standardFeatures = ["1000 items limit", "Full POS & Returns", "Multi user support", "Financial summaries", "Supplier Portal"];
const premiumFeatures = ["Unlimited items", "Everything in Standard", "Batch & expiry tracking", "Advanced analytics", "Multi-branch support", "Priority support"];

const Index = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-14 md:py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-[2.75rem] font-display font-bold leading-tight mb-5">
                Manage your entire business in one{" "}
                <span className="text-gradient">intelligent</span> system
              </h1>
              <p className="text-muted-foreground text-base mb-2 leading-relaxed max-w-md">
                Inventory, sales, purchases, and profit — all in real time.
                Designed for pharmacies, retail stores & warehouses.
              </p>
              <div className="flex flex-wrap gap-3 mt-7">
                <Button size="lg" asChild className="gap-2 px-7 cta-btn">
                  <Link to="/signup">Get Started Free <ArrowRight size={16} /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="px-7 cta-btn-outline">
                  <Link to="/features">View Demo</Link>
                </Button>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50 animate-float cursor-pointer transition-transform duration-300 hover:shadow-3xl">
                <img src={heroLaptop} alt="GeFlow Dashboard" width={800} height={600} className="w-full h-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4"><div className="border-t border-border" /></div>

      {/* How It Works */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Workflow built for speed</h2>
            <p className="text-muted-foreground">Scale your business in 5 simple steps with our automated architecture.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {workflowSteps.map((step) => (
              <div key={step.title} className="text-center group cursor-pointer">
                <div className="relative w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                  <step.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-secondary text-secondary-foreground text-[10px] font-bold flex items-center justify-center">
                    {step.num}
                  </span>
                </div>
                <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Powerful Features</h2>
            <p className="text-muted-foreground">Everything you need to run your modern retail, grouped for clarity.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {features.map((f) => (
              <div key={f.title} className="glass-card p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary group-hover:shadow-md transition-all duration-300">
                  <f.icon className="h-5 w-5 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
                </div>
                <h3 className="font-semibold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section — Image LEFT, Content RIGHT */}
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-lg border border-border/50 animate-float cursor-pointer transition-transform duration-300 hover:shadow-2xl">
              <img src={aboutOffice} alt="GeFlow business dashboard" width={800} height={600} loading="lazy" className="w-full h-auto" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">What is GeFlow?</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                GeFlow is a modern business operating system designed to manage inventory, sales, purchases, and profit tracking in real time.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                It replaces manual systems like Excel and registers with a fully digital and automated solution.
              </p>
              <ul className="space-y-3">
                {[
                  { icon: Activity, text: "Real-time business control" },
                  { icon: Smartphone, text: "Multi-device access" },
                  { icon: Expand, text: "Scalable for all business sizes" },
                ].map((item) => (
                  <li key={item.text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section-padding bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Choose your GeFlow Plan</h2>
            <p className="text-muted-foreground mb-6">Simple, transparent pricing for every business stage.</p>

            <div className="inline-flex items-center bg-card border border-border rounded-full p-1 gap-1">
              <button
                onClick={() => setBillingPeriod("monthly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "monthly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >Monthly</button>
              <button
                onClick={() => setBillingPeriod("yearly")}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === "yearly" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
              >Yearly</button>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Free */}
            <div className="glass-card p-7 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full self-start mb-3">FOREVER FREE</span>
              <h3 className="text-xl font-bold mb-1">Free</h3>
              <p className="text-sm text-muted-foreground mb-4">Always free</p>
              <p className="text-4xl font-bold mb-1">$0</p>
              <p className="text-xs text-muted-foreground mb-6">No card needed</p>
              <ul className="space-y-3 mb-8 flex-1">
                {freePlanFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full cta-btn-outline" asChild>
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>

            {/* Standard */}
            <div className={`glass-card p-7 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${billingPeriod === "monthly" ? "border-primary/40 shadow-lg" : ""}`}>
              {billingPeriod === "monthly" ? (
                <span className="inline-block text-xs font-semibold text-primary-foreground bg-primary px-3 py-1 rounded-full self-start mb-3">MOST POPULAR</span>
              ) : <div className="h-[26px] mb-3" />}
              <h3 className="text-xl font-bold mb-1">Standard</h3>
              <p className="text-sm text-muted-foreground mb-4">For growing retailers</p>
              <p className="text-4xl font-bold text-primary mb-1">
                ${billingPeriod === "monthly" ? "4.99" : "14.99"}
              </p>
              <p className="text-xs text-muted-foreground mb-6">per {billingPeriod === "monthly" ? "month" : "year"}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {standardFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button className="w-full cta-btn" asChild>
                <Link to="/signup">Choose Plan</Link>
              </Button>
            </div>

            {/* Premium */}
            <div className={`glass-card p-7 flex flex-col hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${billingPeriod === "yearly" ? "border-primary/40 shadow-lg" : ""}`}>
              {billingPeriod === "yearly" ? (
                <span className="inline-block text-xs font-semibold text-secondary-foreground bg-secondary px-3 py-1 rounded-full self-start mb-3">20% OFF</span>
              ) : <div className="h-[26px] mb-3" />}
              <h3 className="text-xl font-bold mb-1">Premium</h3>
              <p className="text-sm text-muted-foreground mb-4">For advanced operations</p>
              <p className="text-4xl font-bold mb-1">
                <span className={billingPeriod === "yearly" ? "text-primary" : ""}>
                  ${billingPeriod === "monthly" ? "9.99" : "24.99"}
                </span>
              </p>
              <p className="text-xs text-muted-foreground mb-6">per {billingPeriod === "monthly" ? "month" : "year"}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button variant={billingPeriod === "yearly" ? "default" : "outline"} className={`w-full ${billingPeriod === "yearly" ? "cta-btn" : "cta-btn-outline"}`} asChild>
                <Link to="/signup">Choose Plan</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <CTASection />
    </Layout>
  );
};

export default Index;
