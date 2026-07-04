import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { ArrowLeft, ArrowRight, CheckCircle2, CreditCard, Lock, ShieldCheck, Wallet, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import InvoiceDialog, { InvoiceData } from "@/components/InvoiceDialog";
import { useMoney } from "@/lib/currency";

type Plan = "standard" | "premium";
type Period = "monthly" | "yearly" | "lifetime";

const PLAN_DATA: Record<Plan, { name: string; entitlements: string[]; pricing: Record<Period, number> }> = {
  standard: {
    name: "Standard Plan",
    entitlements: ["1,000 items limit", "Full POS & Returns", "Multi-user support", "Financial summaries", "Supplier Portal"],
    pricing: { monthly: 4.99, yearly: 14.99, lifetime: 49.99 },
  },
  premium: {
    name: "Premium Plan",
    entitlements: ["Unlimited items", "Batch & expiry tracking", "Advanced analytics", "Multi-branch support", "Priority 24/7 support"],
    pricing: { monthly: 9.99, yearly: 24.99, lifetime: 99.99 },
  },
};

const PERIOD_LABEL: Record<Period, string> = {
  monthly: "MONTHLY CYCLE",
  yearly: "YEARLY CYCLE",
  lifetime: "LIFETIME • ONE-TIME",
};

const Checkout = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { symbol: sym, taxRate, currency } = useMoney();

  const plan = (params.get("plan") as Plan) || "standard";
  const period = (params.get("period") as Period) || "monthly";
  const data = PLAN_DATA[plan] ?? PLAN_DATA.standard;
  const subtotal = data.pricing[period] ?? data.pricing.monthly;

  const tax = useMemo(() => +(Math.max(subtotal, 0) * (taxRate / 100)).toFixed(2), [subtotal, taxRate]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card");
  const [paypalEmail, setPaypalEmail] = useState("");
  const [coupon, setCoupon] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; amount: number; label: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isAdminEmail, setIsAdminEmail] = useState(false);

  const discount = appliedCoupon?.amount ?? 0;
  const total = useMemo(() => +(Math.max(subtotal - discount, 0) + tax).toFixed(2), [subtotal, discount, tax]);

  const applyCoupon = async () => {
    const code = coupon.trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    // Validate via a secure function so the full coupon table is never exposed.
    const { data, error } = await supabase.rpc("validate_coupon", {
      _code: code,
      _plan: plan,
      _subtotal: subtotal,
    });
    setCouponLoading(false);
    const result = Array.isArray(data) ? data[0] : data;
    if (error || !result) {
      setAppliedCoupon(null);
      setCouponError("Invalid or expired coupon code.");
      return;
    }
    if (!result.valid) {
      setAppliedCoupon(null);
      setCouponError(result.reason || "Invalid or expired coupon code.");
      return;
    }
    const amount = Number(result.amount) || 0;
    const label = result.label || "";
    setAppliedCoupon({ code, amount: +amount.toFixed(2), label });
    setCouponError("");
    toast({ title: "Coupon applied!", description: `${label} activated.` });
  };


  const ctaLabel = period === "lifetime" ? "AUTHORIZE & START NODE" : "AUTHORIZE & START TRIAL";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentMethod === "card") {
      if (!card.trim() || !expiry.trim() || !cvc.trim()) {
        toast({ title: "Missing payment details", description: "Please complete card information.", variant: "destructive" });
        return;
      }
    } else {
      if (!paypalEmail.trim()) {
        toast({ title: "PayPal email required", description: "Please enter your PayPal email.", variant: "destructive" });
        return;
      }
    }
    setLoading(true);
    const { data: signupData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, plan, period },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Checkout failed", description: error.message, variant: "destructive" });
      return;
    }
    const inv: InvoiceData = {
      invoiceNumber: `GF-${Date.now().toString().slice(-8)}`,
      date: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      customerName: fullName,
      customerEmail: email,
      planName: data.name,
      period: PERIOD_LABEL[period],
      paymentMethod: paymentMethod === "card" ? `Card •••• ${card.slice(-4) || "****"}` : `PayPal (${paypalEmail})`,
      subtotal,
      discount,
      couponCode: appliedCoupon?.code,
      tax,
      total,
      currencySymbol: sym,
      taxRate,
    };
    setInvoice(inv);
    setIsAdminEmail(email.toLowerCase() === "gepardwebs@gmail.com");
    setShowInvoice(true);
    toast({ title: "Payment successful!", description: `${data.name} activated.` });
  };

  const handleContinue = () => {
    setShowInvoice(false);
    if (invoice) {
      navigate(isAdminEmail ? "/admin" : "/dashboard");
    }
  };

  return (
    <Layout>
      <section className="py-10 md:py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link to="/pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/80 hover:text-primary transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Back to Plans
          </Link>

          <div className="grid lg:grid-cols-[1fr_400px] gap-6">
            {/* LEFT — Form */}
            <form onSubmit={handleSubmit} className="premium-card p-6 md:p-10">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">Secure Checkout</h1>
                  <p className="text-sm italic text-muted-foreground">"Finalize your details to activate your business cloud node."</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Lock className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="border-t border-border my-6" />

              {/* Step 1 */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">1</div>
                  <h2 className="text-lg font-bold">Account Identity</h2>
                </div>
                <Link to="/login" className="text-xs font-semibold text-primary hover:underline">
                  Already have an account? Log In
                </Link>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[10px] font-bold tracking-wider text-muted-foreground mb-2 block">FULL LEGAL NAME</label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="e.g. Alex Gepard" className="h-12" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold tracking-wider text-muted-foreground mb-2 block">WORK EMAIL IDENTITY</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="alex@geflow.io" className="h-12" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold tracking-wider text-muted-foreground mb-2 block">ACCOUNT PASSWORD</label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" className="h-12" />
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-bold">2</div>
                <h2 className="text-lg font-bold">Secure Payment</h2>
              </div>

              <div className="bg-muted/40 rounded-2xl p-5 space-y-4">
                {/* Payment method toggler */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-background rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
                      paymentMethod === "card" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <CreditCard className="h-4 w-4" /> PAY WITH CARD
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("paypal")}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold tracking-wider transition-all ${
                      paymentMethod === "paypal" ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Wallet className="h-4 w-4" /> PAY WITH PAYPAL
                  </button>
                </div>

                {paymentMethod === "card" ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold tracking-wider text-muted-foreground mb-2 block">CREDIT OR DEBIT CARD</label>
                      <div className="relative">
                        <CreditCard className="h-4 w-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                        <Input value={card} onChange={(e) => setCard(e.target.value)} placeholder="0000 0000 0000 0000" className="h-12 pl-11 tracking-wider" maxLength={19} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground mb-2 block">EXPIRY DATE</label>
                        <Input value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM / YY" className="h-12" maxLength={7} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold tracking-wider text-muted-foreground mb-2 block">CVC CODE</label>
                        <Input value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="•••" className="h-12" maxLength={4} />
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="text-[10px] font-bold tracking-wider text-muted-foreground mb-2 block">PAYPAL EMAIL ADDRESS</label>
                    <div className="relative">
                      <Wallet className="h-4 w-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
                      <Input
                        type="email"
                        value={paypalEmail}
                        onChange={(e) => setPaypalEmail(e.target.value)}
                        placeholder="you@paypal.com"
                        className="h-12 pl-11"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">You'll be redirected to PayPal to securely complete your payment after creating your account.</p>
                  </div>
                )}
              </div>

              <Button type="submit" disabled={loading} className="cta-btn w-full h-14 rounded-full mt-8 text-sm font-bold tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary">
                {loading ? "PROCESSING..." : <>{ctaLabel} • ${total} <ArrowRight className="h-4 w-4" /></>}
              </Button>

              <p className="text-center text-[10px] font-bold tracking-wider text-muted-foreground mt-4 inline-flex items-center gap-2 justify-center w-full">
                <ShieldCheck className="h-3.5 w-3.5" /> PCI-DSS COMPLIANT • SSL ENCRYPTED
              </p>
            </form>

            {/* RIGHT — Summary */}
            <aside className="premium-card p-6 md:p-7 h-fit lg:sticky lg:top-24">
              <h2 className="text-xl font-bold mb-5">Order Summary</h2>
              <div className="border-t border-border" />

              <div className="flex items-start justify-between py-5">
                <div>
                  <p className="font-bold text-base">{data.name}</p>
                  <p className="text-[10px] font-bold tracking-wider text-primary mt-1">{PERIOD_LABEL[period]}</p>
                </div>
                <p className="text-2xl font-bold">${subtotal}</p>
              </div>

              <div className="border-t border-border" />

              <div className="space-y-2.5 py-5 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span><span className="text-foreground font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-primary">
                    <span>Coupon ({appliedCoupon.code})</span>
                    <span className="font-semibold">−${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Architectural Tax (10%)</span><span className="text-foreground font-semibold">${tax.toFixed(2)}</span>
                </div>
              </div>

              {/* Coupon */}
              <div className="border-t border-border pt-5">
                <label className="text-[10px] font-bold tracking-wider text-muted-foreground mb-2 block">COUPON CODE</label>
                <div className="flex gap-2">
                  <Input
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value); setCouponError(""); }}
                    placeholder="Enter code"
                    className="h-10 uppercase"
                  />
                  <Button type="button" onClick={applyCoupon} disabled={couponLoading} variant="outline" className="h-10 px-4 text-xs font-bold tracking-wider">
                    {couponLoading ? "..." : "APPLY"}
                  </Button>
                </div>
                {couponError && <p className="text-xs text-destructive mt-2">{couponError}</p>}
                {appliedCoupon && <p className="text-xs text-primary mt-2 font-semibold">✓ {appliedCoupon.label} applied</p>}
              </div>

              <div className="border-t border-border" />

              <div className="flex items-center justify-between py-5">
                <p className="text-base font-bold">Grand Total</p>
                <p className="text-3xl font-bold text-primary">${total.toFixed(2)}</p>
              </div>

              <div className="border-t border-border" />

              <div className="pt-5">
                <p className="text-[10px] font-bold tracking-wider text-primary mb-3 inline-flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" /> ACTIVE ENTITLEMENTS
                </p>
                <ul className="space-y-2.5">
                  {data.entitlements.map((e) => (
                    <li key={e} className="flex items-center gap-2 text-sm font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" /> {e}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-[10px] font-semibold tracking-wider text-muted-foreground mt-6 pt-5 border-t border-border">
                BY COMPLETING THIS PURCHASE, YOU AGREE TO OUR <span className="text-foreground font-bold">TERMS OF SERVICE.</span>
              </p>
            </aside>
          </div>
        </div>
      </section>
      <InvoiceDialog open={showInvoice} onClose={() => setShowInvoice(false)} onContinue={handleContinue} invoice={invoice} />
    </Layout>
  );
};

export default Checkout;
