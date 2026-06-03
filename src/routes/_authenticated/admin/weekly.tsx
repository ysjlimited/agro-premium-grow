import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { compileWeeklySummary, listWeeklySummaries } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/weekly")({
  component: WeeklyPage,
});

function WeeklyPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listWeeklySummaries);
  const compileFn = useServerFn(compileWeeklySummary);
  const { data } = useQuery({ queryKey: ["weekly"], queryFn: () => listFn() });

  const today = new Date();
  const monday = new Date(today); monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6);
  const [from, setFrom] = useState(monday.toISOString().slice(0, 10));
  const [to, setTo] = useState(sunday.toISOString().slice(0, 10));
  const [house, setHouse] = useState("");

  const mut = useMutation({
    mutationFn: () => compileFn({ data: { week_start: from, week_end: to, house_id: house || undefined } }),
    onSuccess: () => { toast.success("Weekly summary compiled."); qc.invalidateQueries({ queryKey: ["weekly"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Weekly Compiler</h1>
        <p className="text-sm text-slate-400">Aggregate daily logs and generate AI strategy insight.</p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-5 flex flex-wrap items-end gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Week start</div>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg bg-[#0b1224] border border-white/10 px-3 py-2 text-sm text-white"/>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Week end</div>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg bg-[#0b1224] border border-white/10 px-3 py-2 text-sm text-white"/>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">House (optional)</div>
          <input value={house} onChange={(e) => setHouse(e.target.value)} placeholder="all houses" className="rounded-lg bg-[#0b1224] border border-white/10 px-3 py-2 text-sm text-white"/>
        </div>
        <button onClick={() => mut.mutate()} disabled={mut.isPending} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {mut.isPending ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>}
          Compile + AI insight
        </button>
      </div>

      <div className="space-y-4">
        {data?.map((w) => (
          <div key={w.id} className="rounded-2xl border border-white/5 bg-[#1e293b] p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <div className="font-mono text-sm text-emerald-300">{w.week_start} → {w.week_end}</div>
                <div className="text-xs text-slate-400 mt-0.5">House: {w.house_id ?? "All"}</div>
              </div>
              <div className="text-right text-xs text-slate-400">FCR: <span className="font-mono text-white">{w.fcr ? Number(w.fcr).toFixed(2) : "—"}</span></div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <Stat l="Mortality" v={w.total_mortality}/>
              <Stat l="Feed bags" v={w.total_feed_bags}/>
              <Stat l="Harvested" v={w.total_harvested}/>
              <Stat l="Sales" v={`₦${Number(w.total_sales).toLocaleString()}`}/>
              <Stat l="Profit" v={`₦${(Number(w.total_sales) - Number(w.total_expenses)).toLocaleString()}`}/>
            </div>
            {w.ai_insight && (
              <div className="mt-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 p-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 mb-2">
                  <Sparkles size={12}/> AI Strategy Insight
                </div>
                <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{w.ai_insight}</div>
              </div>
            )}
          </div>
        ))}
        {data && data.length === 0 && <div className="text-center text-sm text-slate-500 py-10">No weekly summaries yet.</div>}
      </div>
    </div>
  );
}

function Stat({ l, v }: { l: string; v: any }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400">{l}</div>
      <div className="font-mono text-white mt-1">{v}</div>
    </div>
  );
}
