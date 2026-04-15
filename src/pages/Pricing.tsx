import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import { Check } from "lucide-react";

const freePlanFeatures = ["100 items limit", "Basic POS", "Single user", "Real time Profit"];
const standardFeatures = ["1000 items limit", "Full POS & Returns", "Multi user support", "Financial summaries", "Supplier Portal"];
const premiumFeatures = ["Unlimited items", "Everything in Standard", "Batch & expiry tracking", "Advanced analytics", "Multi-branch support", "Priority support"];
const lifetimeFeatures = ["Everything in Premium", "Lifetime updates", "Dedicated support", "Early access to AI features"];

const Pricing = () => {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");

  return (
    <Layout>
      <section className="section-padding">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-semibold text-sm mb-2">Pricing</p>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Simple, transparent pricing</h1>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">Start free and scale as your business grows. No hidden fees.</p>

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

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Free */}
            <div className="glass-card p-7 flex flex-col">
              <span className="inline-block text-xs font-semibold text-primary bg-primary/10 px-3 py-1 rounded-full self-start mb-3">FOREVER FREE</span>
              <h3 className="text-xl font-bold mb-1">Free</h3>
              <p className="text-sm text-muted-foreground mb-4">Always free</p>
              <p className="text-4xl font-bold mb-1">$0</p>
              <p className="text-xs text-muted-foreground mb-6">No card needed</p>
              <ul className="space-y-3 mb-8 flex-1">
                {freePlanFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" asChild><Link to="/signup">Get Started</Link></Button>
            </div>

            {/* Standard */}
            <div className={`glass-card p-7 flex flex-col ${billingPeriod === "monthly" ? "border-primary/40 shadow-lg" : ""}`}>
              {billingPeriod === "monthly" ? (
                <span className="inline-block text-xs font-semibold text-primary-foreground bg-primary px-3 py-1 rounded-full self-start mb-3">MOST POPULAR</span>
              ) : <div className="mb-3" />}
              <h3 className="text-xl font-bold mb-1">Standard</h3>
              <p className="text-sm text-muted-foreground mb-4">For growing retailers</p>
              <p className="text-4xl font-bold text-primary mb-1">${billingPeriod === "monthly" ? "4.99" : "14.99"}</p>
              <p className="text-xs text-muted-foreground mb-6">per {billingPeriod === "monthly" ? "month" : "year"}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {standardFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              <Button className="w-full" asChild><Link to="/signup">Choose Plan</Link></Button>
            </div>

            {/* Premium */}
            <div className={`glass-card p-7 flex flex-col ${billingPeriod === "yearly" ? "border-primary/40 shadow-lg" : ""}`}>
              {billingPeriod === "yearly" ? (
                <span className="inline-block text-xs font-semibold text-primary-foreground bg-accent px-3 py-1 rounded-full self-start mb-3">20% OFF</span>
              ) : <div className="mb-3" />}
              <h3 className="text-xl font-bold mb-1">Premium</h3>
              <p className="text-sm text-muted-foreground mb-4">For advanced operations</p>
              <p className="text-4xl font-bold mb-1"><span className={billingPeriod === "yearly" ? "text-primary" : ""}>${billingPeriod === "monthly" ? "9.99" : "24.99"}</span></p>
              <p className="text-xs text-muted-foreground mb-6">per {billingPeriod === "monthly" ? "month" : "year"}</p>
              <ul className="space-y-3 mb-8 flex-1">
                {premiumFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              <Button variant={billingPeriod === "yearly" ? "default" : "outline"} className="w-full" asChild><Link to="/signup">Choose Plan</Link></Button>
            </div>

            {/* Lifetime */}
            <div className="glass-card p-7 flex flex-col">
              <div className="mb-3" />
              <h3 className="text-xl font-bold mb-1">Lifetime</h3>
              <p className="text-sm text-muted-foreground mb-4">Limited offer</p>
              <p className="text-4xl font-bold mb-1">$199</p>
              <p className="text-xs text-muted-foreground mb-6">one-time payment</p>
              <ul className="space-y-3 mb-8 flex-1">
                {lifetimeFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="h-4 w-4 text-primary flex-shrink-0" /> {f}</li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" asChild><Link to="/signup">Get Started</Link></Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Pricing;
