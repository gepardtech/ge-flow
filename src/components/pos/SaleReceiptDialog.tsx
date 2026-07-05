import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CheckCircle2, Printer, ArrowRight } from "lucide-react";

export interface ReceiptLine {
  name: string;
  qty: number;
  unit: number;
  total: number;
}

export interface ReceiptData {
  invoiceNo: string;
  date: Date;
  businessName: string;
  lines: ReceiptLine[];
  subtotal: number;
  discount: number;
  taxRate: number;
  tax: number;
  total: number;
  payMethod: "cash" | "card";
  cashGiven: number;
  changeDue: number;
  symbol: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  data: ReceiptData | null;
  onNewCustomer: () => void;
}

const money = (sym: string, n: number) =>
  `${sym}${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: Date) =>
  d.toLocaleString(undefined, {
    month: "short", day: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).replace(",", "");

const SaleReceiptDialog = ({ open, onOpenChange, data, onNewCustomer }: Props) => {
  if (!data) return null;
  const sym = data.symbol;

  const printReceipt = () => {
    const rows = data.lines
      .map(
        (l) =>
          `<tr><td class="nm">${l.name}</td><td class="qt">${l.qty}</td><td class="pr">${money(sym, l.total)}</td></tr>`,
      )
      .join("");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>${data.invoiceNo}</title>
      <style>
        *{font-family:'Courier New',monospace;box-sizing:border-box}
        body{width:280px;margin:0 auto;padding:12px;color:#111}
        h1{font-size:16px;text-align:center;margin:0;color:#0ea5e9;letter-spacing:1px}
        .sub{text-align:center;font-size:10px;letter-spacing:2px;color:#555;margin:2px 0 10px}
        .meta{font-size:11px;color:#333;margin-bottom:6px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        td{padding:3px 0}
        .qt{text-align:center;width:32px}
        .pr{text-align:right}
        .dash{border-top:1px dashed #999;margin:8px 0}
        .row{display:flex;justify-content:space-between;font-size:11px;padding:2px 0}
        .total{display:flex;justify-content:space-between;font-size:14px;font-weight:bold;color:#0ea5e9;padding-top:6px}
        .foot{text-align:center;font-size:10px;color:#777;margin-top:12px}
      </style></head><body>
      <h1>${data.businessName || "GEFLOW OS"}</h1>
      <div class="sub">TRANSACTION LEDGER</div>
      <div class="meta">INVOICE #${data.invoiceNo}</div>
      <div class="meta">DATE: ${fmtDate(data.date)}</div>
      <div class="dash"></div>
      <table><tbody>${rows}</tbody></table>
      <div class="dash"></div>
      <div class="row"><span>Subtotal</span><span>${money(sym, data.subtotal)}</span></div>
      ${data.discount > 0 ? `<div class="row"><span>Discount</span><span>-${money(sym, data.discount)}</span></div>` : ""}
      <div class="row"><span>Tax (${data.taxRate}%)</span><span>${money(sym, data.tax)}</span></div>
      <div class="total"><span>TOTAL</span><span>${money(sym, data.total)}</span></div>
      <div class="dash"></div>
      <div class="row"><span>Payment</span><span>${data.payMethod.toUpperCase()}</span></div>
      ${data.payMethod === "cash" ? `<div class="row"><span>Cash</span><span>${money(sym, data.cashGiven)}</span></div><div class="row"><span>Change</span><span>${money(sym, data.changeDue)}</span></div>` : ""}
      <div class="foot">Thank you for your purchase!<br/>Powered by GeFlow OS</div>
      </body></html>`;
    const w = window.open("", "_blank", "width=360,height=640");
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-3xl border-border">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-500/15 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-extrabold">Sale Verified</h2>
            <p className="text-[11px] font-bold tracking-widest text-muted-foreground mt-1">
              INVOICE #{data.invoiceNo}
            </p>
          </div>

          {/* Ledger card */}
          <div className="mt-6 rounded-2xl bg-muted/40 border border-border p-5">
            <p className="text-center text-lg font-extrabold text-sky-500 tracking-wide">
              {(data.businessName || "GEFLOW OS").toUpperCase()}
            </p>
            <p className="text-center text-[10px] font-bold tracking-widest text-muted-foreground mt-0.5">
              TRANSACTION LEDGER
            </p>

            <p className="mt-4 text-[11px] font-mono text-muted-foreground">
              DATE: {fmtDate(data.date)}
            </p>

            <div className="my-3 border-t border-dashed border-border" />

            <ul className="space-y-2">
              {data.lines.map((l, i) => (
                <li key={i} className="flex items-center justify-between text-sm font-mono">
                  <span className="truncate max-w-[55%]">{l.name}</span>
                  <span className="text-muted-foreground">{l.qty}</span>
                  <span className="font-bold">{money(sym, l.total)}</span>
                </li>
              ))}
            </ul>

            <div className="my-3 border-t border-dashed border-border" />

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal</span><span>{money(sym, data.subtotal)}</span>
              </div>
              {data.discount > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Discount</span><span>-{money(sym, data.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tax ({data.taxRate}%)</span><span>{money(sym, data.tax)}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-extrabold tracking-wide text-sky-500">TOTAL</span>
              <span className="text-lg font-extrabold text-sky-500">{money(sym, data.total)}</span>
            </div>

            {data.payMethod === "cash" && (
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>CASH {money(sym, data.cashGiven)}</span>
                <span>CHANGE {money(sym, data.changeDue)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 space-y-3">
            <button
              onClick={printReceipt}
              className="w-full h-12 rounded-2xl bg-foreground text-background font-bold inline-flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <Printer className="h-4 w-4" /> Print Receipt
            </button>
            <button
              onClick={onNewCustomer}
              className="w-full h-12 rounded-2xl bg-muted/60 border border-border font-bold inline-flex items-center justify-center gap-2 hover:bg-muted transition"
            >
              Process New Customer <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaleReceiptDialog;
