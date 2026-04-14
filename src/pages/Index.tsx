import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import DashboardPreview from "@/components/DashboardPreview";
import CTASection from "@/components/CTASection";
import {
  Package, Zap, TrendingUp, Users, Cloud, ShieldCheck,
  FileSpreadsheet, AlertTriangle, Calculator, Clock
} from "lucide-react";

const problems = [
  { icon: FileSpreadsheet, title: "Still using Excel?", desc: "Spreadsheets break, lose data, and can't scale with your business." },
  { icon: AlertTriangle, title: "Stock errors daily?", desc: "Manual counting leads to mismatches, overstocking, and lost sales." },
  { icon: Calculator, title: "Can't track profit?", desc: "Without real-time data, you're guessing — not growing." },
  { icon: Clock, title: "Slow billing?", desc: "Manual invoicing wastes time and frustrates customers." },
];

const benefits = [
  { icon: Package, title: "Real-time Stock Tracking", desc: "Know exactly what's in stock, what's running low, and what's selling fast." },
  { icon: Zap, title: "Fast Billing System", desc: "Process sales in seconds with our lightning-fast POS system." },
  { icon: TrendingUp, title: "Profit Visibility", desc: "See your margins, expenses, and profits at a glance." },
  { icon: Users, title: "Multi-user System", desc: "Add staff with role-based access. Everyone sees only what they need." },
  { icon: Cloud, title: "Cloud Access Anywhere", desc: "Manage your business from any device, anywhere in the world." },
  { icon: ShieldCheck, title: "Secure & Reliable", desc: "Enterprise-grade security with automatic backups." },
];

const testimonials = [
  { name: "Ahmed R.", biz: "Pharmacy Owner", text: "GeFlow replaced 3 different tools. Now everything is in one place." },
  { name: "Sarah K.", biz: "Retail Store Manager", text: "Our billing is 5x faster. Customers love the speed." },
  { name: "David M.", biz: "Warehouse Operator", text: "Stock errors dropped to zero. I trust the numbers now." },
];

const Index = () => (
  <Layout>
    {/* Hero */}
    <section className="bg-hero-gradient relative overflow-hidden">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6">
              <span className="text-primary-foreground/90 text-xs font-medium">✨ Built for Pharmacies, Retail & Warehouses</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              Run Your Entire Business From One Platform
            </h1>
            <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg leading-relaxed">
              GeFlow replaces spreadsheets, manual registers, and disconnected tools with one powerful cloud-based system for inventory, sales, purchases, and profit tracking.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" variant="hero-outline" asChild>
                <Link to="/signup">Get Started Free</Link>
              </Button>
              <Button size="lg" variant="ghost" className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/features">View Features →</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center">
            <DashboardPreview />
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>

    {/* Problem */}
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold text-sm mb-2">The Problem</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Your business deserves better than this</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Most businesses still rely on outdated tools that cost time, money, and accuracy.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((p) => (
            <div key={p.title} className="glass-card rounded-xl p-6 hover:shadow-md transition-shadow">
              <p.icon className="h-8 w-8 text-destructive mb-4" />
              <h3 className="font-semibold mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Solution */}
    <section className="section-padding bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold text-sm mb-2">The Solution</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">One system. Everything connected.</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="glass-card rounded-xl p-8">
            <h3 className="font-semibold text-destructive mb-4">❌ Old Way</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Pen-and-paper stock counting</li>
              <li>• Excel sheets for billing</li>
              <li>• No idea about real profit</li>
              <li>• No multi-branch visibility</li>
              <li>• Manual purchase tracking</li>
            </ul>
          </div>
          <div className="glass-card rounded-xl p-8 border-primary/30">
            <h3 className="font-semibold text-accent mb-4">✅ GeFlow Way</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Real-time inventory system</li>
              <li>• Fast POS with instant invoicing</li>
              <li>• Automatic profit tracking</li>
              <li>• Multi-branch control panel</li>
              <li>• Smart purchase management</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    {/* Benefits */}
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold text-sm mb-2">Key Benefits</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to grow</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b) => (
            <div key={b.title} className="glass-card rounded-xl p-6 hover:shadow-md transition-all group">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <b.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Dashboard Preview */}
    <section className="section-padding bg-muted/30">
      <div className="container mx-auto px-4 text-center">
        <p className="text-primary font-semibold text-sm mb-2">Live Dashboard Preview</p>
        <h2 className="text-3xl md:text-4xl font-bold mb-4">See everything at a glance</h2>
        <p className="text-muted-foreground mb-10 max-w-xl mx-auto">Sales, stock levels, profits, and alerts — all in one beautiful dashboard.</p>
        <div className="flex justify-center">
          <DashboardPreview />
        </div>
      </div>
    </section>

    {/* Testimonials */}
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-primary font-semibold text-sm mb-2">Testimonials</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by real businesses</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {testimonials.map((t) => (
            <div key={t.name} className="glass-card rounded-xl p-6">
              <p className="text-sm text-muted-foreground mb-4 italic">"{t.text}"</p>
              <div>
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.biz}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <CTASection />
  </Layout>
);

export default Index;
