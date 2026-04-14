import Layout from "@/components/Layout";
import CTASection from "@/components/CTASection";
import { Package, ShoppingCart, Truck, BarChart3, FileText, Users } from "lucide-react";

const featureModules = [
  {
    title: "Inventory Module",
    icon: Package,
    features: [
      { title: "Product Management", desc: "Add, edit, and organize products with categories, SKUs, and images." },
      { title: "Stock Ledger", desc: "Track every stock movement with a detailed ledger history." },
      { title: "Batch Tracking", desc: "Manage batches with manufacturing and expiry dates." },
      { title: "Expiry Tracking", desc: "Get alerts before products expire to prevent losses." },
    ],
  },
  {
    title: "POS Module",
    icon: ShoppingCart,
    features: [
      { title: "Fast Billing", desc: "Process transactions in seconds with an intuitive interface." },
      { title: "Barcode Scanning", desc: "Scan barcodes to instantly add items to the cart." },
      { title: "Invoice Generation", desc: "Auto-generate professional invoices for every sale." },
      { title: "Discount Handling", desc: "Apply percentage or flat discounts with ease." },
    ],
  },
  {
    title: "Purchase Module",
    icon: Truck,
    features: [
      { title: "Supplier Management", desc: "Maintain a directory of suppliers with contact and payment details." },
      { title: "Purchase Entry", desc: "Record purchases and automatically increase stock levels." },
      { title: "Stock Auto Increase", desc: "Inventory updates in real-time as purchases are recorded." },
    ],
  },
  {
    title: "Finance Module",
    icon: BarChart3,
    features: [
      { title: "Profit Calculation", desc: "Automatic profit calculations on every sale and period." },
      { title: "Expense Tracking", desc: "Log and categorize all business expenses." },
      { title: "Financial Reports", desc: "Generate P&L statements and financial summaries." },
    ],
  },
  {
    title: "Reports Module",
    icon: FileText,
    features: [
      { title: "Sales Reports", desc: "Daily, weekly, and monthly sales breakdowns." },
      { title: "Stock Reports", desc: "Current stock levels, movement, and valuation reports." },
      { title: "Profit Reports", desc: "Margin analysis and profitability insights." },
    ],
  },
  {
    title: "User Module",
    icon: Users,
    features: [
      { title: "Role-based Access", desc: "Define roles like admin, cashier, and manager with specific permissions." },
      { title: "Multi-user System", desc: "Add unlimited team members with secure individual logins." },
    ],
  },
];

const Features = () => (
  <Layout>
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm mb-2">Features</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Everything your business needs</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">Powerful modules designed to handle every aspect of your business operations.</p>
        </div>

        <div className="space-y-16">
          {featureModules.map((mod) => (
            <div key={mod.title}>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <mod.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="text-2xl font-bold">{mod.title}</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mod.features.map((f) => (
                  <div key={f.title} className="glass-card rounded-xl p-5 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
    <CTASection />
  </Layout>
);

export default Features;
