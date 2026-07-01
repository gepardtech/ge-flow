import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import type { ProductRecord } from "./ProductDialog";
import { CalendarIcon, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  products: ProductRecord[];
  categoryName: (id: string | null) => string;
  businessName: string;
}

const csvCell = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const ExportLedgerDialog = ({ open, onOpenChange, products, categoryName, businessName }: Props) => {
  const { toast } = useToast();
  const [range, setRange] = useState<DateRange | undefined>();

  const doExport = () => {
    // NOTE: products carry no created_at here; range is informational for the filename.
    const header = ["Name", "ID", "Category", "Stock", "Price", "Discount", "Status", "Images"];
    const rows = products.map((p) => [
      p.name, p.internal_sku ?? "", categoryName(p.category_id),
      p.stock_units, p.retail_price, p.discount_price ?? "", p.status,
      (p.images ?? []).join(" | "),
    ]);
    const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = range?.from ? `${format(range.from, "yyyyMMdd")}-${range.to ? format(range.to, "yyyyMMdd") : "now"}` : format(new Date(), "yyyyMMdd");
    a.href = url;
    a.download = `${businessName.replace(/\s+/g, "_")}_inventory_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Ledger exported", description: `${rows.length} products written to CSV.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Export Ledger</DialogTitle>
          <DialogDescription>Select a date range, then download your inventory as CSV.</DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !range && "text-muted-foreground")}>
                <CalendarIcon className="h-4 w-4 mr-2" />
                {range?.from ? (range.to ? `${format(range.from, "PP")} – ${format(range.to, "PP")}` : format(range.from, "PP")) : "Pick a date range (optional)"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={1} className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={doExport} className="bg-sky-400 hover:bg-sky-500 text-white font-bold">
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportLedgerDialog;
