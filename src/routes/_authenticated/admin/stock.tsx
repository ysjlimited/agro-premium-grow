import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, AlertTriangle } from "lucide-react";
import { createStock, deleteStock, listStock, updateStock, getMyRoles } from "@/lib/admin.functions";
import { useConfirm } from "@/components/ConfirmDialog";

export const Route = createFileRoute("/_authenticated/admin/stock")({
  component: StockPage,
});

type StockRow = {
  id: string; name: string; category: string; quantity: number;
  unit: string; reorder_level: number; notes: string | null;
};

function StockPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listStock);
  const createFn = useServerFn(createStock);
  const updateFn = useServerFn(updateStock);
  const deleteFn = useServerFn(deleteStock);
  const rolesFn = useServerFn(getMyRoles);
  const { data: rolesData } = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const isAdmin = (rolesData?.roles ?? []).includes("admin");

  const { data, isLoading } = useQuery({ queryKey: ["stock"], queryFn: () => listFn() });
  const [editing, setEditing] = useState<StockRow | null>(null);
  const [creating, setCreating] = useState(false);
  const confirm = useConfirm();

  const createMut = useMutation({
    mutationFn: (v: any) => createFn({ data: v }),
    onSuccess: () => { toast.success("Stock item added"); qc.invalidateQueries({ queryKey: ["stock"] }); setCreating(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: (v: { id: string; patch: any }) => updateFn({ data: v }),
    onSuccess: () => { toast.success("Stock updated"); qc.invalidateQueries({ queryKey: ["stock"] }); setEditing(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => { toast.success("Stock deleted"); qc.invalidateQueries({ queryKey: ["stock"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Stock</h1>
          <p className="text-sm text-slate-400">Feed, medication, and supplies inventory.</p>
        </div>
        {isAdmin && (
          <button onClick={() => { setCreating(true); setEditing(null); }}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-white">
            <Plus size={14}/> New stock item
          </button>
        )}
      </div>

      {(creating || editing) && isAdmin && (
        <StockForm
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
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Qty</th>
              <th className="px-4 py-3 text-left">Reorder at</th>
              {isAdmin && <th className="px-4 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={5} className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {data?.map((s: StockRow) => {
              const low = Number(s.quantity) <= Number(s.reorder_level);
              return (
                <tr key={s.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 capitalize text-slate-300">{s.category}</td>
                  <td className="px-4 py-3 font-mono">
                    {Number(s.quantity).toLocaleString()} {s.unit}
                    {low && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-300">
                        <AlertTriangle size={10}/> low
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{Number(s.reorder_level)} {s.unit}</td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <button onClick={() => { setEditing(s); setCreating(false); }}
                          className="p-1.5 rounded hover:bg-white/5 text-slate-300"><Pencil size={14}/></button>
                        <button
                          onClick={() => confirm.confirm({
                            title: "Delete stock item?",
                            description: <>This will permanently delete <strong>{s.name}</strong>. This cannot be undone.</>,
                            onConfirm: () => deleteMut.mutate(s.id),
                          })}
                          className="p-1.5 rounded hover:bg-rose-500/10 text-rose-300"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
            {data && data.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-slate-500">No stock items yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {confirm.node}
    </div>
  );
}

function StockForm({ initial, onSubmit, onCancel, busy }: {
  initial?: StockRow; onSubmit: (v: any) => void; onCancel: () => void; busy: boolean;
}) {
  const [v, setV] = useState({
    name: initial?.name ?? "",
    category: (initial?.category as any) ?? "feed",
    quantity: Number(initial?.quantity ?? 0),
    unit: initial?.unit ?? "bag",
    reorder_level: Number(initial?.reorder_level ?? 0),
    notes: initial?.notes ?? "",
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}
      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <Field label="Name"><input required value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} className={inp}/></Field>
      <Field label="Category">
        <select value={v.category} onChange={(e) => setV({ ...v, category: e.target.value as any })} className={inp}>
          <option value="feed">Feed</option><option value="medication">Medication</option>
          <option value="equipment">Equipment</option><option value="supplies">Supplies</option>
          <option value="other">Other</option>
        </select>
      </Field>
      <Field label="Unit"><input required value={v.unit} onChange={(e) => setV({ ...v, unit: e.target.value })} placeholder="bag / litre / kg" className={inp}/></Field>
      <Field label="Quantity"><input type="number" min={0} step="0.1" value={v.quantity} onChange={(e) => setV({ ...v, quantity: +e.target.value })} className={inp}/></Field>
      <Field label="Reorder level"><input type="number" min={0} step="0.1" value={v.reorder_level} onChange={(e) => setV({ ...v, reorder_level: +e.target.value })} className={inp}/></Field>
      <Field label="Notes" full>
        <textarea value={v.notes} onChange={(e) => setV({ ...v, notes: e.target.value })} rows={2} className={inp + " resize-none"}/>
      </Field>
      <div className="lg:col-span-3 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {busy && <Loader2 size={14} className="animate-spin"/>} {initial ? "Save changes" : "Add item"}
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
