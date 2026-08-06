import { useState } from "react";
import {
  PayPalButtons,
  PayPalCardFieldsProvider,
  PayPalNumberField,
  PayPalExpiryField,
  PayPalCVVField,
  usePayPalCardFields,
} from "@paypal/react-paypal-js";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CaptureResult {
  status: string;
  plan: string;
  cycle: string;
  amount: number;
  currency: string;
  method: string;
  payerEmail: string;
  invoiceNumber: string;
  hasBusiness: boolean;
}

interface Props {
  plan: string;
  cycle: string;
  amount: number;
  couponCode?: string | null;
  /** Creates/authenticates the account. Must resolve true before payment starts. */
  ensureAuth: () => Promise<boolean>;
  onSuccess: (result: CaptureResult) => void;
  ctaLabel: string;
  priceLabel: string;
}

const createOrder = async (plan: string, cycle: string, amount: number, coupon?: string | null) => {
  const { data, error } = await supabase.functions.invoke("paypal-payments", {
    body: { action: "create", plan, cycle, amount, currency: "USD", coupon },
  });
  if (error || !data?.id) throw new Error(data?.error || error?.message || "Could not start the payment");
  return data.id as string;
};

const captureOrder = async (orderId: string, plan: string, cycle: string) => {
  const { data, error } = await supabase.functions.invoke("paypal-payments", {
    body: { action: "capture", orderId, plan, cycle },
  });
  if (error || !data || data.error) throw new Error(data?.error || error?.message || "Payment could not be captured");
  return data as CaptureResult;
};

/* --------------------------- Card submit button --------------------------- */
const CardSubmit = ({ ctaLabel, priceLabel, busy, setBusy }: {
  ctaLabel: string; priceLabel: string; busy: boolean; setBusy: (v: boolean) => void;
}) => {
  const { cardFieldsForm } = usePayPalCardFields();
  const { toast } = useToast();

  const submit = async () => {
    if (!cardFieldsForm) return;
    const state = await cardFieldsForm.getState();
    if (!state.isFormValid) {
      toast({ title: "Check your card details", description: "Please complete all card fields.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await cardFieldsForm.submit();
    } catch (e) {
      setBusy(false);
      toast({ title: "Payment failed", description: (e as Error).message, variant: "destructive" });
    }
  };

  return (
    <>
      <Button
        type="button"
        onClick={submit}
        disabled={busy}
        className="cta-btn w-full h-14 rounded-full mt-8 text-sm font-bold tracking-wider gap-2 bg-primary text-primary-foreground hover:bg-primary"
      >
        {busy ? "PROCESSING..." : <>{ctaLabel} • {priceLabel} <ArrowRight className="h-4 w-4" /></>}
      </Button>
      <p className="text-center text-[10px] font-bold tracking-wider text-muted-foreground mt-4 inline-flex items-center gap-2 justify-center w-full">
        <ShieldCheck className="h-3.5 w-3.5" /> PCI-DSS COMPLIANT • SSL ENCRYPTED
      </p>
    </>
  );
};

/* ------------------------------ Card section ------------------------------ */
export const PayPalCardSection = ({ plan, cycle, amount, couponCode, ensureAuth, onSuccess, ctaLabel, priceLabel }: Props) => {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <PayPalCardFieldsProvider
      createOrder={async () => {
        const ok = await ensureAuth();
        if (!ok) throw new Error("Account details are required");
        return createOrder(plan, cycle, amount, couponCode);
      }}
      onApprove={async (data) => {
        try {
          const result = await captureOrder(data.orderID, plan, cycle);
          onSuccess(result);
        } catch (e) {
          toast({ title: "Payment failed", description: (e as Error).message, variant: "destructive" });
        } finally {
          setBusy(false);
        }
      }}
      onError={(err) => {
        setBusy(false);
        toast({ title: "Payment failed", description: String((err as Error)?.message ?? err), variant: "destructive" });
      }}
      style={{ input: { "font-size": "15px", "font-family": "inherit", padding: "12px" } }}
    >
      <div>
        <label className="text-[10px] font-bold tracking-wider text-muted-foreground mb-2 block">CREDIT OR DEBIT CARD</label>
        <div className="paypal-field rounded-md border border-input bg-background px-2">
          <PayPalNumberField />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold tracking-wider text-muted-foreground mb-2 block">EXPIRY DATE</label>
          <div className="paypal-field rounded-md border border-input bg-background px-2">
            <PayPalExpiryField />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-bold tracking-wider text-muted-foreground mb-2 block">CVC CODE</label>
          <div className="paypal-field rounded-md border border-input bg-background px-2">
            <PayPalCVVField />
          </div>
        </div>
      </div>
      <CardSubmit ctaLabel={ctaLabel} priceLabel={priceLabel} busy={busy} setBusy={setBusy} />
    </PayPalCardFieldsProvider>
  );
};

/* ----------------------------- PayPal buttons ----------------------------- */
export const PayPalWalletSection = ({ plan, cycle, amount, couponCode, ensureAuth, onSuccess, payerEmail }: Props & { payerEmail?: string }) => {
  const { toast } = useToast();

  return (
    <div className="mt-5">
      <PayPalButtons
        style={{ layout: "vertical", shape: "pill", color: "gold", height: 48, label: "paypal" }}
        createOrder={async () => {
          const ok = await ensureAuth();
          if (!ok) throw new Error("Account details are required");
          return createOrder(plan, cycle, amount, couponCode);
        }}
        onApprove={async (data) => {
          try {
            const result = await captureOrder(data.orderID, plan, cycle);
            onSuccess(result);
          } catch (e) {
            toast({ title: "Payment failed", description: (e as Error).message, variant: "destructive" });
          }
        }}
        onError={(err) => {
          toast({ title: "PayPal error", description: String((err as Error)?.message ?? err), variant: "destructive" });
        }}
      />
      {payerEmail ? (
        <p className="text-[11px] text-muted-foreground mt-2">
          A PayPal window will open to confirm the payment for <span className="font-semibold text-foreground">{payerEmail}</span>.
        </p>
      ) : null}
    </div>
  );
};
