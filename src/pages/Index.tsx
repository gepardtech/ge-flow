import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import CTASection from "@/components/CTASection";
import heroLaptop from "@/assets/hero-laptop.jpg";
import {
  Package, ShoppingCart, TrendingUp, BarChart3, Users, Layers,
  ArrowRight, Check, Clipboard, Truck, Activity
} from "lucide-react";

const workflowSteps = [
  { icon: Clipboard, title: "Initialize Workspace", desc: "Create your business profile and define your architecture instantly." },
  { icon: Package, title: "Add Inventory", desc: "Import products with price, stock, SKU and categories." },
  { icon: ShoppingCart, title: "Start Sales", desc: "Fast billing with automatic stock deduction." },
  { icon: Truck, title: "Manage Purchases", desc: "Stock increases automatically from suppliers." },
  { icon: Activity, title: "Track Performance", desc: "Profit, reports, and analytics in real time." },
];

const features = [
  { icon: Package, title: "Inventory Engine", desc: "Real-time stock tracking with SKU management and ledger history." },
  { icon: ShoppingCart, title: "Fast POS", desc: "Optimized billing for high-traffic stores with barcode support." },
  { icon: TrendingUp, title: "Profit Analytics", desc: "Live margin and profit calculations with expense tracking." },
  { icon: BarChart3, title: "Smart Reports", desc: "Sales, stock, and financial reports with exportable data." },
  { icon: Users, title: "User Management", desc: "Role-based access control with multi-user support." },
  { icon: Layers, title: "Multi-Branch", desc: "Manage multiple store locations from a single dashboard." },
];

const Index = () => (
  <Layout>
    {/* Hero Section */}
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold leading-tight mb-6">
              Manage your entire business in one{" "}
              <span className="text-primary">intelligent</span> system
            </h1>
            <p className="text-muted-foreground text-lg mb-4 leading-relaxed max-w-md">
              Inventory, sales, purchases, and profit — all in real time.
              Designed for pharmacies, retail stores & warehouses.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <Button size="lg" asChild className="gap-2 px-6">
                <Link to="/signup">Get Started Free <ArrowRight size={16} /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="px-6">
                <Link to="/features">View Demo</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50">
              <img src={heroLaptop} alt="GeFlow Dashboard" width={800} height={600} className="w-full h-auto" />
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Subtle divider */}
    <div className="container mx-auto px-4">
      <div className="border-t border-border" />
    </div>

    {/* Workflow Section */}
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Workflow built for speed</h2>
          <p className="text-muted-foreground">Scale your business in 3 simple steps with our automated architecture.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {workflowSteps.map((step, i) => (
            <div key={step.title} className="text-center group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              {i < workflowSteps.length - 1 && (
                <div className="hidden md:block absolute" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Features Section */}
    <section className="section-padding bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Powerful Features</h2>
          <p className="text-muted-foreground">Everything you need to run your modern retail, grouped for clarity.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {features.map((f) => (
            <div key={f.title} className="glass-card p-6 hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Pricing Section */}
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-3">Choose your GeFlow Plan</h2>
          <p className="text-muted-foreground">Simple, transparent pricing for every business stage.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Free Plan */}
          <div className="glass-card p-8">
            <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">FOREVER FREE</span>
            <h3 className="text-xl font-bold mb-1">Free</h3>
            <p className="text-sm text-muted-foreground mb-4">Perfect for startups.</p>
            <p className="text-4xl font-bold mb-6">$0</p>
            <ul className="space-y-3 mb-8">
              {["100 items limit", "Basic POS", "Single user", "Real time Profit"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Standard Plan */}
          <div className="glass-card p-8 border-primary/40 shadow-lg">
            <h3 className="text-xl font-bold mb-1">Standard</h3>
            <p className="text-sm text-muted-foreground mb-4">For growing retailers.</p>
            <p className="text-4xl font-bold text-primary mb-6">$4.99</p>
            <ul className="space-y-3 mb-8">
              {["1000 items limit", "Full POS & Returns", "Multi user support", "Financial summaries", "Supplier Portal"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Button className="w-full" asChild>
              <Link to="/signup">Choose Plan</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <CTASection />
  </Layout>
);

export default Index;
