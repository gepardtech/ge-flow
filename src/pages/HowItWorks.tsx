import Layout from "@/components/Layout";
import CTASection from "@/components/CTASection";
import { Building2, Package, ShoppingCart, Truck, BarChart3 } from "lucide-react";

const steps = [
  { icon: Building2, title: "Create Your Workspace", desc: "Sign up and create your business account. The system sets up your inventory, billing, and reports automatically." },
  { icon: Package, title: "Add Your Products", desc: "Add items with price, stock quantity, SKU, and categories. Import in bulk or add one by one." },
  { icon: ShoppingCart, title: "Start Selling (POS)", desc: "Select products, generate invoices, and stock updates automatically with every sale." },
  { icon: Truck, title: "Manage Purchases", desc: "Record supplier purchases and watch your inventory increase in real-time." },
  { icon: BarChart3, title: "Track Everything", desc: "Monitor profit, sales trends, stock levels, and generate reports — all from one dashboard." },
];

const HowItWorks = () => (
  <Layout>
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm mb-2">How It Works</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Up and running in 5 simple steps</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">No complex setup. No learning curve. Just sign up and start managing.</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-0">
          {steps.map((step, i) => (
            <div key={step.title} className="flex gap-6">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
                  {i + 1}
                </div>
                {i < steps.length - 1 && <div className="w-0.5 flex-1 bg-border my-2" />}
              </div>
              <div className="pb-10">
                <div className="flex items-center gap-2 mb-1">
                  <step.icon className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
    <CTASection />
  </Layout>
);

export default HowItWorks;
