import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { createDailyLog, listDailyLogs, addSupervisorComment, getMyRoles } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/daily-logs")({
  component: DailyLogsPage,
});

function DailyLogsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listDailyLogs);
  const createFn = useServerFn(createDailyLog);
  const commentFn = useServerFn(addSupervisorComment);
  const rolesFn = useServerFn(getMyRoles);
  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const isSupervisor = (roles?.roles ?? []).some((r) => ["supervisor","admin","md"].includes(r));

  const { data: logs, isLoading } = useQuery({ queryKey: ["daily-logs"], queryFn: () => listFn() });
  const [showForm, setShowForm] = useState(false);

  const mut = useMutation({
    mutationFn: (payload: any) => createFn({ data: payload }),
    onSuccess: () => {
      toast.success("Daily log saved.");
      qc.invalidateQueries({ queryKey: ["daily-logs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowForm(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const commentMut = useMutation({
    mutationFn: (v: { id: string; comment: string }) => commentFn({ data: v }),
    onSuccess: () => {
      toast.success("Comment saved");
      qc.invalidateQueries({ queryKey: ["daily-logs"] });
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Daily Logs</h1>
          <p className="text-sm text-slate-400">Per-shift production entries.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-white">
          <Plus size={14}/> {showForm ? "Close" : "New entry"}
        </button>
      </div>

      {showForm && <LogForm onSubmit={(v) => mut.mutate(v)} busy={mut.isPending}/>}

      <div className="rounded-2xl border border-white/5 bg-[#1e293b] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
              <tr>
                {["Date", "Shift", "House", "Open", "Mort.", "Harv.", "Feed", "Sales", "Notes"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={9} className="p-6 text-center text-slate-500">Loading…</td></tr>}
              {logs?.map((l) => (
                <tr key={l.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-3 font-mono text-xs">{l.log_date}</td>
                  <td className="px-3 py-3 capitalize">{l.shift}</td>
                  <td className="px-3 py-3">{l.house_id}</td>
                  <td className="px-3 py-3 font-mono">{l.opening_stock}</td>
                  <td className="px-3 py-3 font-mono text-rose-300">{l.mortality}</td>
                  <td className="px-3 py-3 font-mono">{l.birds_harvested}</td>
                  <td className="px-3 py-3 font-mono">{l.feed_bags}</td>
                  <td className="px-3 py-3 font-mono text-emerald-300">₦{Number(l.sales).toLocaleString()}</td>
                  <td className="px-3 py-3 max-w-xs">
                    <div className="text-xs text-slate-300 truncate">{l.notes}</div>
                    {l.supervisor_comment && (
                      <div className="mt-1 text-[10px] text-amber-300/80 italic truncate">↳ {l.supervisor_comment}</div>
                    )}
                    {isSupervisor && (
                      <button
                        onClick={() => {
                          const c = prompt("Supervisor comment:", l.supervisor_comment ?? "");
                          if (c !== null) commentMut.mutate({ id: l.id, comment: c });
                        }}
                        className="mt-1 text-[10px] text-emerald-400 hover:underline"
                      >
                        Add/edit comment
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {logs && logs.length === 0 && (
                <tr><td colSpan={9} className="p-6 text-center text-slate-500">No entries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LogForm({ onSubmit, busy }: { onSubmit: (v: any) => void; busy: boolean }) {
  const [v, setV] = useState({
    log_date: new Date().toISOString().slice(0, 10),
    shift: "morning" as const,
    house_id: "",
    opening_stock: 0, mortality: 0, birds_harvested: 0,
    feed_bags: 0, water_liters: 0, weight_sample_g: null as number | null,
    expenses: 0, sales: 0, notes: "",
  });
  const set = <K extends keyof typeof v>(k: K, val: typeof v[K]) => setV({ ...v, [k]: val });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}
      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3"
    >
      <Field label="Date"><input type="date" value={v.log_date} onChange={(e) => set("log_date", e.target.value)} className={inp}/></Field>
      <Field label="Shift">
        <select value={v.shift} onChange={(e) => set("shift", e.target.value as any)} className={inp}>
          <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option>
        </select>
      </Field>
      <Field label="House ID"><input required value={v.house_id} onChange={(e) => set("house_id", e.target.value)} placeholder="A1" className={inp}/></Field>
      <Field label="Opening stock"><input type="number" min={0} value={v.opening_stock} onChange={(e) => set("opening_stock", +e.target.value)} className={inp}/></Field>
      <Field label="Mortality"><input type="number" min={0} value={v.mortality} onChange={(e) => set("mortality", +e.target.value)} className={inp}/></Field>
      <Field label="Birds harvested"><input type="number" min={0} value={v.birds_harvested} onChange={(e) => set("birds_harvested", +e.target.value)} className={inp}/></Field>
      <Field label="Feed bags (25kg)"><input type="number" min={0} step="0.1" value={v.feed_bags} onChange={(e) => set("feed_bags", +e.target.value)} className={inp}/></Field>
      <Field label="Water (L)"><input type="number" min={0} step="0.1" value={v.water_liters} onChange={(e) => set("water_liters", +e.target.value)} className={inp}/></Field>
      <Field label="Avg weight sample (g)"><input type="number" min={0} step="1" value={v.weight_sample_g ?? ""} onChange={(e) => set("weight_sample_g", e.target.value ? +e.target.value : null)} className={inp}/></Field>
      <Field label="Expenses (₦)"><input type="number" min={0} step="1" value={v.expenses} onChange={(e) => set("expenses", +e.target.value)} className={inp}/></Field>
      <Field label="Sales (₦)"><input type="number" min={0} step="1" value={v.sales} onChange={(e) => set("sales", +e.target.value)} className={inp}/></Field>
      <Field label="Notes" full>
        <textarea value={v.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={inp + " resize-none"}/>
      </Field>
      <div className="lg:col-span-4 flex justify-end">
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {busy && <Loader2 size={14} className="animate-spin"/>} Save entry
        </button>
      </div>
    </form>
  );
}

const inp = "w-full rounded-lg bg-[#0b1224] border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50";

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "lg:col-span-4 sm:col-span-2" : ""}`}>
      <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}
