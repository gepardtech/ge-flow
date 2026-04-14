import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    desc: "Perfect for getting started",
    features: ["Basic inventory", "Simple POS", "Single user", "Limited reports"],
    popular: false,
  },
  {
    name: "Standard",
    price: "$4.99",
    period: "/month",
    desc: "For growing businesses",
    features: ["Full POS system", "Supplier management", "Basic reports", "Multi-user access", "Email support"],
    popular: false,
  },
  {
    name: "Premium",
    price: "$9.99",
    period: "/month",
    desc: "For advanced operations",
    features: ["Batch & expiry tracking", "Advanced analytics", "Multi-branch support", "Profit engine", "Automation features", "Priority support"],
    popular: true,
  },
  {
    name: "Lifetime",
    price: "$199",
    period: "one-time",
    desc: "Limited offer — full access forever",
    features: ["Everything in Premium", "Lifetime updates", "Dedicated support", "Early access to AI features"],
    popular: false,
  },
];

const Pricing = () => (
  <Layout>
    <section className="section-padding">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-primary font-semibold text-sm mb-2">Pricing</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Start free and scale as your business grows. No hidden fees.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? "bg-hero-gradient text-primary-foreground ring-2 ring-primary shadow-xl scale-105"
                  : "glass-card"
              }`}
            >
              {plan.popular && (
                <span className="text-xs font-semibold bg-primary-foreground/20 self-start px-3 py-1 rounded-full mb-3">
                  Most Popular
                </span>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <div className="mt-2 mb-1">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className={`text-sm ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}> {plan.period}</span>
              </div>
              <p className={`text-sm mb-6 ${plan.popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{plan.desc}</p>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${plan.popular ? "text-primary-foreground" : "text-accent"}`} />
                    <span className={plan.popular ? "text-primary-foreground/90" : ""}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.popular ? "hero-outline" : "default"}
                className="w-full"
                asChild
              >
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  </Layout>
);

export default Pricing;
