import { usePlatformSettings } from "@/components/PlatformSettingsProvider";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", PKR: "₨", AED: "د.إ", INR: "₹",
  CAD: "C$", AUD: "A$", JPY: "¥", CNY: "¥", SAR: "﷼",
};

export const currencySymbol = (code?: string | null) =>
  CURRENCY_SYMBOLS[(code ?? "USD").toUpperCase()] ?? `${(code ?? "USD").toUpperCase()} `;

/**
 * Reactive money + tax helpers driven by the global platform settings.
 * Currency symbol and universal tax update live across the user panel.
 */
export const useMoney = () => {
  const { settings } = usePlatformSettings();
  const code = (settings?.base_currency as string) ?? "USD";
  const sym = currencySymbol(code);
  const taxRate = Number(settings?.universal_tax ?? 0);
  const invoicePrefix = ((settings?.invoice_prefix as string) ?? "INV").trim().replace(/-+$/, "") || "INV";

  const format = (n: number) =>
    `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  /** Build an invoice number using the platform prefix, e.g. GF-8FA3C1. */
  const invoiceNo = (seed?: string) => {
    const tail = (seed ?? Date.now().toString()).replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
    return `${invoicePrefix}-${tail}`;
  };

  return { currency: code, symbol: sym, taxRate, invoicePrefix, invoiceNo, format };
};
