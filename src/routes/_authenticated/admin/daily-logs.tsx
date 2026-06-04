import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Pencil, Trash2, ImageIcon } from "lucide-react";
import {
  createDailyLog, listDailyLogs, addSupervisorComment, getMyRoles,
  updateDailyLog, deleteDailyLog, signFarmPhoto, listBatches,
} from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import { useConfirm } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/_authenticated/admin/daily-logs")({
  component: DailyLogsPage,
});

function DailyLogsPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listDailyLogs);
  const createFn = useServerFn(createDailyLog);
  const updateFn = useServerFn(updateDailyLog);
  const deleteFn = useServerFn(deleteDailyLog);
  const commentFn = useServerFn(addSupervisorComment);
  const rolesFn = useServerFn(getMyRoles);
  const batchesFn = useServerFn(listBatches);
  const signFn = useServerFn(signFarmPhoto);

  const { data: roles } = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const isAdmin = (roles?.roles ?? []).includes("admin");
  const isSupervisor = (roles?.roles ?? []).some((r) => ["supervisor","admin","md"].includes(r));

  const { data: logs, isLoading } = useQuery({ queryKey: ["daily-logs"], queryFn: () => listFn() });
  const { data: batches } = useQuery({ queryKey: ["batches"], queryFn: () => batchesFn() });

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const confirm = useConfirm();

  const createMut = useMutation({
    mutationFn: (payload: any) => createFn({ data: payload }),
    onSuccess: () => {
      toast.success("Daily log saved");
      qc.invalidateQueries({ queryKey: ["daily-logs"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setShowForm(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: (v: { id: string; patch: any }) => updateFn({ data: v }),
    onSuccess: () => { toast.success("Log updated"); qc.invalidateQueries({ queryKey: ["daily-logs"] }); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Log deleted"); qc.invalidateQueries({ queryKey: ["daily-logs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const commentMut = useMutation({
    mutationFn: (v: { id: string; comment: string }) => commentFn({ data: v }),
    onSuccess: () => { toast.success("Comment saved"); qc.invalidateQueries({ queryKey: ["daily-logs"] }); },
  });

  const openPhoto = async (path: string) => {
    try {
      const { url } = await signFn({ data: { path } });
      window.open(url, "_blank");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Daily Logs</h1>
          <p className="text-sm text-slate-400">Per-shift production entries{isAdmin ? " — Main Admin can add, edit and delete." : " — view only."}</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowForm((s) => !s); setEditing(null); }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-white">
            <Plus size={14}/> {showForm ? "Close" : "New entry"}
          </button>
        )}
      </div>

      {((showForm && !editing) || editing) && isAdmin && (
        <LogForm
          initial={editing ?? undefined}
          batches={batches ?? []}
          busy={createMut.isPending || updateMut.isPending}
          onCancel={() => { setShowForm(false); setEditing(null); }}
          onSubmit={(v) => editing ? updateMut.mutate({ id: editing.id, patch: v }) : createMut.mutate(v)}
        />
      )}

      <div className="rounded-2xl border border-white/5 bg-[#1e293b] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
              <tr>
                {["Date", "Shift", "House", "Open", "Mort.", "Harv.", "Feed", "Sales", "Photo", "Notes"].map((h) => (
                  <th key={h} className="px-3 py-3 text-left font-medium">{h}</th>
                ))}
                {isAdmin && <th className="px-3 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={11} className="p-6 text-center text-slate-500">Loading…</td></tr>}
              {logs?.map((l: any) => (
                <tr key={l.id} className="border-t border-white/5 hover:bg-white/[0.02]">
                  <td className="px-3 py-3 font-mono text-xs">{l.log_date}</td>
                  <td className="px-3 py-3 capitalize">{l.shift}</td>
                  <td className="px-3 py-3">{l.house_id}</td>
                  <td className="px-3 py-3 font-mono">{l.opening_stock}</td>
                  <td className="px-3 py-3 font-mono text-rose-300">{l.mortality}</td>
                  <td className="px-3 py-3 font-mono">{l.birds_harvested}</td>
                  <td className="px-3 py-3 font-mono">{l.feed_bags}</td>
                  <td className="px-3 py-3 font-mono text-emerald-300">₦{Number(l.sales).toLocaleString()}</td>
                  <td className="px-3 py-3">
                    {l.photo_url ? (
                      <button onClick={() => openPhoto(l.photo_url)} className="inline-flex items-center gap-1 text-emerald-400 hover:underline text-xs">
                        <ImageIcon size={12}/> view
                      </button>
                    ) : <span className="text-slate-600 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3 max-w-xs">
                    <div className="text-xs text-slate-300 truncate">{l.notes}</div>
                    {l.supervisor_comment && (
                      <div className="mt-1 text-[10px] text-amber-300/80 italic truncate">↳ {l.supervisor_comment}</div>
                    )}
                    {isSupervisor && (
                      <button onClick={() => {
                        const c = prompt("Supervisor comment:", l.supervisor_comment ?? "");
                        if (c !== null) commentMut.mutate({ id: l.id, comment: c });
                      }}
                        className="mt-1 text-[10px] text-emerald-400 hover:underline">Add/edit comment</button>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => { setEditing(l); setShowForm(true); }}
                          className="p-1.5 rounded hover:bg-white/5 text-slate-300"><Pencil size={14}/></button>
                        <button
                          onClick={() => confirm.confirm({
                            title: "Delete this daily log?",
                            description: <>This will permanently delete the log for <strong>{l.log_date}</strong> · <strong>{l.shift}</strong> · house <strong>{l.house_id}</strong>. This cannot be undone.</>,
                            onConfirm: () => deleteMut.mutate(l.id),
                          })}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-rose-300"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {logs && logs.length === 0 && (
                <tr><td colSpan={11} className="p-6 text-center text-slate-500">No entries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {confirm.node}
    </div>
  );
}

function LogForm({ initial, batches, onSubmit, onCancel, busy }: {
  initial?: any; batches: any[]; onSubmit: (v: any) => void; onCancel: () => void; busy: boolean;
}) {
  const [v, setV] = useState({
    log_date: initial?.log_date ?? new Date().toISOString().slice(0, 10),
    shift: (initial?.shift as "morning" | "afternoon" | "evening") ?? "morning",
    house_id: initial?.house_id ?? "",
    batch_id: initial?.batch_id ?? "",
    opening_stock: Number(initial?.opening_stock ?? 0),
    mortality: Number(initial?.mortality ?? 0),
    birds_harvested: Number(initial?.birds_harvested ?? 0),
    feed_bags: Number(initial?.feed_bags ?? 0),
    water_liters: Number(initial?.water_liters ?? 0),
    weight_sample_g: initial?.weight_sample_g != null ? Number(initial.weight_sample_g) : null,
    expenses: Number(initial?.expenses ?? 0),
    sales: Number(initial?.sales ?? 0),
    notes: initial?.notes ?? "",
    photo_url: (initial?.photo_url ?? "") as string,
  });
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("farm-photos").upload(path, file, { upsert: false, contentType: file.type });
      if (error) throw error;
      setV((s) => ({ ...s, photo_url: path }));
      toast.success("Photo uploaded");
    } catch (e) { toast.error((e as Error).message); }
    finally { setUploading(false); }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...v, batch_id: v.batch_id || null, notes: v.notes || "" };
    if (!payload.photo_url) delete payload.photo_url;
    onSubmit(payload);
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Field label="Date"><input type="date" value={v.log_date} onChange={(e) => setV({ ...v, log_date: e.target.value })} className={inp}/></Field>
      <Field label="Shift">
        <select value={v.shift} onChange={(e) => setV({ ...v, shift: e.target.value as any })} className={inp}>
          <option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option>
        </select>
      </Field>
      <Field label="House ID"><input required value={v.house_id} onChange={(e) => setV({ ...v, house_id: e.target.value })} placeholder="A1" className={inp}/></Field>
      <Field label="Batch (optional)">
        <select value={v.batch_id ?? ""} onChange={(e) => setV({ ...v, batch_id: e.target.value })} className={inp}>
          <option value="">— none —</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </Field>
      <Field label="Opening stock"><input type="number" min={0} value={v.opening_stock} onChange={(e) => setV({ ...v, opening_stock: +e.target.value })} className={inp}/></Field>
      <Field label="Mortality"><input type="number" min={0} value={v.mortality} onChange={(e) => setV({ ...v, mortality: +e.target.value })} className={inp}/></Field>
      <Field label="Birds harvested"><input type="number" min={0} value={v.birds_harvested} onChange={(e) => setV({ ...v, birds_harvested: +e.target.value })} className={inp}/></Field>
      <Field label="Feed bags (25kg)"><input type="number" min={0} step="0.1" value={v.feed_bags} onChange={(e) => setV({ ...v, feed_bags: +e.target.value })} className={inp}/></Field>
      <Field label="Water (L)"><input type="number" min={0} step="0.1" value={v.water_liters} onChange={(e) => setV({ ...v, water_liters: +e.target.value })} className={inp}/></Field>
      <Field label="Avg weight sample (g)"><input type="number" min={0} step="1" value={v.weight_sample_g ?? ""} onChange={(e) => setV({ ...v, weight_sample_g: e.target.value ? +e.target.value : null })} className={inp}/></Field>
      <Field label="Expenses (₦)"><input type="number" min={0} step="1" value={v.expenses} onChange={(e) => setV({ ...v, expenses: +e.target.value })} className={inp}/></Field>
      <Field label="Sales (₦)"><input type="number" min={0} step="1" value={v.sales} onChange={(e) => setV({ ...v, sales: +e.target.value })} className={inp}/></Field>
      <Field label="Photo attachment" full>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }}
            className="text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500 file:px-3 file:py-1.5 file:text-white file:text-xs file:font-semibold hover:file:bg-emerald-400"/>
          {uploading && <Loader2 size={14} className="animate-spin text-emerald-400"/>}
          {v.photo_url && <span className="text-xs text-emerald-300 font-mono break-all">{v.photo_url}</span>}
          {v.photo_url && <button type="button" onClick={() => setV({ ...v, photo_url: "" })} className="text-xs text-rose-300 hover:underline">remove</button>}
        </div>
      </Field>
      <Field label="Notes" full>
        <textarea value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} rows={2} className={inp + " resize-none"}/>
      </Field>
      <div className="lg:col-span-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
        <button disabled={busy || uploading} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {busy && <Loader2 size={14} className="animate-spin"/>} {initial ? "Save changes" : "Save entry"}
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
