import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import {
  Sparkles, Send, Loader2, BarChart3, Settings2, BookOpen, Lightbulb, Bot, User as UserIcon, Building2,
} from "lucide-react";

type Role = "user" | "assistant";
interface Msg { role: Role; content: string; }

type Mode = "analyst" | "operator" | "knowledge" | "advisor";

const MODES: { id: Mode; label: string; icon: typeof BarChart3; desc: string; color: string }[] = [
  { id: "analyst", label: "Analyst", icon: BarChart3, desc: "Sales, profit & inventory analysis", color: "text-sky-500 bg-sky-500/10" },
  { id: "operator", label: "Operator", icon: Settings2, desc: "Reports, orders & drafts", color: "text-violet-500 bg-violet-500/10" },
  { id: "knowledge", label: "Knowledge", icon: BookOpen, desc: "How to use GeFlow", color: "text-emerald-500 bg-emerald-500/10" },
  { id: "advisor", label: "Advisor", icon: Lightbulb, desc: "Strategy & recommendations", color: "text-amber-500 bg-amber-500/10" },
];

const STARTERS: Record<Mode, string[]> = {
  analyst: ["How is my business performing this month?", "Which products are my best and slow sellers?", "Why might my profit be low?"],
  operator: ["Draft a purchase order for my low-stock items", "Write a supplier reorder message", "Summarize this month's sales for a report"],
  knowledge: ["How do I add a product to inventory?", "How does the POS terminal work?", "How do I track low stock?"],
  advisor: ["Give me 3 ways to improve profit", "What inventory risks should I watch?", "Where can I cut costs?"],
};

interface Props { open: boolean; onOpenChange: (v: boolean) => void; }

const AIAssistant = ({ open, onOpenChange }: Props) => {
  const { activeId, businesses } = useActiveBusiness();
  const [mode, setMode] = useState<Mode>("analyst");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeBiz = businesses.find((b) => b.id === activeId);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, mode]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as Role, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("geflow-ai-assistant", {
        body: { messages: next, mode, businessId: activeId ?? "" },
      });
      if (error) throw error;
      if (data?.error) {
        setMessages((m) => [...m, { role: "assistant", content: `⚠️ ${data.error}` }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: data.reply as string }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "⚠️ I couldn't reach GeCore AI right now. Please try again in a moment." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const activeMode = MODES.find((m) => m.id === mode)!;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden h-[85vh] flex flex-col gap-0">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-gradient-to-r from-primary/10 via-transparent to-transparent">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-sky-400 flex items-center justify-center text-white flex-shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold leading-tight">GeFlow AI Assistant</p>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
              <Building2 className="h-3 w-3" /> {activeBiz?.business_name ?? "No business selected"}
            </p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 border-b border-border bg-muted/20">
          {MODES.map((m) => {
            const Icon = m.icon;
            const on = m.id === mode;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex flex-col items-start gap-1 rounded-xl p-2.5 border text-left transition-all ${
                  on ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:bg-muted/50"
                }`}
              >
                <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${m.color}`}><Icon className="h-4 w-4" /></span>
                <span className="text-xs font-bold">{m.label}</span>
                <span className="text-[10px] text-muted-foreground leading-tight hidden sm:block">{m.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-6">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-4 ${activeMode.color}`}>
                <activeMode.icon className="h-7 w-7" />
              </div>
              <p className="font-bold text-lg">{activeMode.label} Mode</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">{activeMode.desc}. Ask about your business — I read your live inventory & sales data.</p>
              <div className="mt-5 flex flex-col gap-2 w-full max-w-md">
                {STARTERS[mode].map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm px-4 py-2.5 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-gradient-to-br from-violet-500 to-sky-400 text-white"
                }`}>
                  {m.role === "user" ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={`rounded-2xl px-4 py-2.5 max-w-[80%] text-sm ${
                  m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/60"
                }`}>
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:mt-2 prose-headings:mb-1 prose-ul:my-1.5 prose-li:my-0.5">
                      <ReactMarkdown>{m.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-500 to-sky-400 text-white flex-shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl px-4 py-3 bg-muted/60 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your business…
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-border p-3">
          <div className="flex items-end gap-2 bg-muted/40 rounded-2xl border border-border p-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
              rows={1}
              placeholder="Ask about sales, stock, profit, forecasts…"
              className="flex-1 bg-transparent resize-none max-h-32 px-2 py-2 text-sm focus:outline-none"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="h-10 w-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 hover:opacity-90 transition flex-shrink-0"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center mt-2">GeFlow AI reads your live business data · Powered by GeCore AI</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIAssistant;
