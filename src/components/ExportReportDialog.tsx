import { useState } from "react";
import { Calendar as CalendarIcon, Download, FileDown } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface Props {
  rows: Record<string, any>[];
  filename?: string;
  filterField?: string; // field to filter by date
}

const toCSV = (rows: Record<string, any>[]) => {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v).replace(/"/g, '""');
    return /[",\n]/.test(s) ? `"${s}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
};

const ExportReportDialog = ({ rows, filename = "geflow-report", filterField = "created_at" }: Props) => {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>();
  const { toast } = useToast();

  const handleExport = () => {
    if (!range?.from || !range?.to) {
      toast({ title: "Pick a range", description: "Select both a start and end date.", variant: "destructive" });
      return;
    }
    const start = range.from.getTime();
    const end = range.to.getTime() + 24 * 60 * 60 * 1000;
    const filtered = rows.filter((r) => {
      const t = new Date(r[filterField]).getTime();
      return !isNaN(t) ? t >= start && t <= end : true;
    });
    const csv = toCSV(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${format(range.from, "yyyyMMdd")}-${format(range.to, "yyyyMMdd")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Report downloaded", description: `${filtered.length} rows exported.` });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-10 px-4 rounded-xl bg-card border border-border text-sm font-bold inline-flex items-center gap-2 hover:bg-muted hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-0.5">
          <FileDown className="h-4 w-4" /> Export Report
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Report</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Choose a date range to export filtered data as a CSV file.</p>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !range && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {range?.from ? (
                  range.to ? `${format(range.from, "LLL dd, y")} – ${format(range.to, "LLL dd, y")}` : format(range.from, "LLL dd, y")
                ) : "Pick a date range"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={2} initialFocus />
            </PopoverContent>
          </Popover>
          <Button onClick={handleExport} className="w-full" size="lg">
            <Download className="h-4 w-4 mr-2" /> Apply &amp; Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportReportDialog;
