import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, BirdIcon } from "lucide-react";
import { createBatch, deleteBatch, listBatches, updateBatch, getMyRoles, addBatchBirds } from "@/lib/admin.functions";
import { useConfirm } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/_authenticated/admin/batches")({
  component: BatchesPage,
});

type Batch = {
  id: string; name: string; breed: string | null; start_date: string;
  bird_count: number; status: string; notes: string | null;
};

function BatchesPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listBatches);
  const createFn = useServerFn(createBatch);
  const updateFn = useServerFn(updateBatch);
  const deleteFn = useServerFn(deleteBatch);
  const rolesFn = useServerFn(getMyRoles);
  const { data: rolesData } = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const isAdmin = (rolesData?.roles ?? []).includes("admin");

  const { data, isLoading } = useQuery({ queryKey: ["batches"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<Batch | null>(null);
  const [creating, setCreating] = useState(false);
  const confirm = useConfirm();

  const createMut = useMutation({
    mutationFn: (v: any) => createFn({ data: v }),
    onSuccess: () => { toast.success("Batch added"); qc.invalidateQueries({ queryKey: ["batches"] }); setCreating(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: (v: { id: string; patch: any }) => updateFn({ data: v }),
    onSuccess: () => { toast.success("Batch updated"); qc.invalidateQueries({ queryKey: ["batches"] }); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Batch deleted"); qc.invalidateQueries({ queryKey: ["batches"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Batches</h1>
          <p className="text-sm text-slate-400">Flock cycles — only the Main Admin can add, edit, or delete.</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setCreating(true); setEditing(null); }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-white">
            <Plus size={14}/> New batch
          </button>
        )}
      </div>

      {(creating || editing) && isAdmin && (
        <BatchForm
          initial={editing ?? undefined}
          busy={createMut.isPending || updateMut.isPending}
          onCancel={() => { setCreating(false); setEditing(null); }}
          onSubmit={(v) => editing ? updateMut.mutate({ id: editing.id, patch: v }) : createMut.mutate(v)}
        />
      )}

      <div className="rounded-2xl border border-white/5 bg-[#1e293b] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Breed</th>
              <th className="px-4 py-3 text-left">Start</th>
              <th className="px-4 py-3 text-left">Birds</th>
              <th className="px-4 py-3 text-left">Status</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {data?.map((b: Batch) => (
              <tr key={b.id} className="border-t border-white/5">
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3 text-slate-300">{b.breed ?? "—"}</td>
                <td className="px-4 py-3 font-mono text-xs">{b.start_date}</td>
                <td className="px-4 py-3 font-mono">{b.bird_count.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                    b.status === "active" ? "bg-emerald-500/15 text-emerald-300" :
                    b.status === "harvested" ? "bg-amber-500/15 text-amber-300" : "bg-slate-500/15 text-slate-300"}`}>
                    {b.status}
                  </span>
                </td>
                {isAdmin && (
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-1">
                      <button onClick={() => { setEditing(b); setCreating(false); }}
                        className="p-1.5 rounded hover:bg-white/5 text-slate-300"><Pencil size={14}/></button>
                      <button
                        onClick={() => confirm.confirm({
                          title: "Delete batch?",
                          description: <>This will permanently delete <strong>{b.name}</strong>. This cannot be undone.</>,
                          onConfirm: () => deleteMut.mutate(b.id),
                        })}
                        className="p-1.5 rounded hover:bg-rose-500/10 text-rose-300"><Trash2 size={14}/></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
            {data && data.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-slate-500">No batches yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {confirm.node}
    </div>
  );
}

function BatchForm({ initial, onSubmit, onCancel, busy }: {
  initial?: Batch; onSubmit: (v: any) => void; onCancel: () => void; busy: boolean;
}) {
  const [v, setV] = useState({
    name: initial?.name ?? "",
    breed: initial?.breed ?? "",
    start_date: initial?.start_date ?? new Date().toISOString().slice(0, 10),
    bird_count: initial?.bird_count ?? 0,
    status: (initial?.status as "active" | "harvested" | "closed") ?? "active",
    notes: initial?.notes ?? "",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}
      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <Field label="Name"><input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={inp}/></Field>
      <Field label="Breed"><input value={v.breed} onChange={(e) => setV({ ...v, breed: e.target.value })} className={inp} placeholder="Cobb 500"/></Field>
      <Field label="Start date"><input type="date" value={v.start_date} onChange={(e) => setV({ ...v, start_date: e.target.value })} className={inp}/></Field>
      <Field label="Bird count"><input type="number" min={0} value={v.bird_count} onChange={(e) => setV({ ...v, bird_count: +e.target.value })} className={inp}/></Field>
      <Field label="Status">
        <select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value as any })} className={inp}>
          <option value="active">Active</option><option value="harvested">Harvested</option><option value="closed">Closed</option>
        </select>
      </Field>
      <Field label="Notes" full>
        <textarea value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} rows={2} className={inp + " resize-none"}/>
      </Field>
      <div className="lg:col-span-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {busy && <Loader2 size={14} className="animate-spin"/>} {initial ? "Save changes" : "Add batch"}
        </button>
      </div>
    </form>
  );
}
const inp = "w-full rounded-lg bg-[#0b1224] border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50";
function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "lg:col-span-3 sm:col-span-2" : ""}`}>
      <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}
