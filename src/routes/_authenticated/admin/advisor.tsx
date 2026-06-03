import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { aiAdvise } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/advisor")({
  component: AdvisorPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function AdvisorPage() {
  const fn = useServerFn(aiAdvise);
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: "Hi! I'm your poultry advisor. Ask me about flock performance, FCR optimization, mortality trends, biosecurity or financials." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    if (!input.trim() || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: input.trim() }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const r = await fn({ data: { messages: next } });
      setMessages([...next, { role: "assistant", content: r.content }]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-5rem)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <Sparkles size={16}/>
        </span>
        <div>
          <h1 className="font-display text-xl font-bold">AI Advisor</h1>
          <p className="text-xs text-slate-400">Grounded in your last 30 days of farm data.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === "user" ? "bg-emerald-500 text-white" : "bg-[#1e293b] text-slate-100 border border-white/5"}`}>
              {m.content}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="rounded-2xl px-4 py-2.5 bg-[#1e293b] border border-white/5 inline-flex items-center gap-2 text-xs text-slate-400">
              <Loader2 size={12} className="animate-spin"/> Thinking…
            </div>
          </div>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="mt-4 flex gap-2">
        <input
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about FCR, mortality, biosecurity…"
          className="flex-1 rounded-xl bg-[#1e293b] border border-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-emerald-500/40"
        />
        <button disabled={busy} className="rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 text-sm font-semibold text-white disabled:opacity-60 inline-flex items-center gap-2">
          <Send size={14}/>
        </button>
      </form>
    </div>
  );
}
