import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, KeyRound, Trash2, Loader2, Pencil } from "lucide-react";
import {
  listStaff, setUserRole, getMyRoles,
  adminCreateStaff, adminResetStaffPassword, adminUpdateStaff, adminDeleteStaff,
} from "@/lib/admin.functions";
import { useConfirm } from "@/components/ConfirmDialog";

const ROLES = ["admin", "md", "supervisor", "officer"] as const;

export const Route = createFileRoute("/_authenticated/admin/staff")({
  component: StaffPage,
});

function StaffPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listStaff);
  const setRoleFn = useServerFn(setUserRole);
  const rolesFn = useServerFn(getMyRoles);
  const createFn = useServerFn(adminCreateStaff);
  const resetFn = useServerFn(adminResetStaffPassword);
  const updateFn = useServerFn(adminUpdateStaff);
  const deleteFn = useServerFn(adminDeleteStaff);

  const { data: me } = useQuery({ queryKey: ["my-roles"], queryFn: () => rolesFn() });
  const isMainAdmin = (me?.roles ?? []).includes("admin");

  const { data, isLoading } = useQuery({ queryKey: ["staff"], queryFn: () => listFn() });
  const [showCreate, setShowCreate] = useState(false);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const confirm = useConfirm();

  const roleMut = useMutation({
    mutationFn: (v: { user_id: string; role: (typeof ROLES)[number]; action: "add" | "remove" }) => setRoleFn({ data: v }),
    onSuccess: () => { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["staff"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const createMut = useMutation({
    mutationFn: (v: any) => createFn({ data: v }),
    onSuccess: () => { toast.success("Staff account created"); qc.invalidateQueries({ queryKey: ["staff"] }); setShowCreate(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  const resetMut = useMutation({
    mutationFn: (v: { user_id: string; new_password: string }) => resetFn({ data: v }),
    onSuccess: () => { toast.success("Password reset"); setResettingId(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const updateMut = useMutation({
    mutationFn: (v: any) => updateFn({ data: v }),
    onSuccess: () => { toast.success("Staff updated"); qc.invalidateQueries({ queryKey: ["staff"] }); setEditingId(null); },
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (user_id: string) => deleteFn({ data: { user_id } }),
    onSuccess: () => { toast.success("Staff deleted"); qc.invalidateQueries({ queryKey: ["staff"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isMainAdmin) {
    return (
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6">
        <h1 className="font-display text-xl font-bold text-amber-300">Restricted</h1>
        <p className="mt-1 text-sm text-amber-200/80">Only the Main Admin can manage staff accounts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Staff Roster</h1>
          <p className="text-sm text-slate-400">Main Admin only — create, edit, reset password, or remove staff.</p>
        </div>
        <button onClick={() => setShowCreate((s) => !s)}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-white">
          <Plus size={14}/> {showCreate ? "Close" : "Add staff"}
        </button>
      </div>

      {showCreate && (
        <CreateStaffForm busy={createMut.isPending} onCancel={() => setShowCreate(false)} onSubmit={(v) => createMut.mutate(v)}/>
      )}

      <div className="rounded-2xl border border-white/5 bg-[#1e293b] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Roles</th>
              <th className="px-4 py-3 text-left">Manage roles</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={4} className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {data?.map((u: any) => (
              <StaffRow key={u.id} u={u}
                editingId={editingId} setEditingId={setEditingId}
                resettingId={resettingId} setResettingId={setResettingId}
                roleMut={roleMut} updateMut={updateMut} resetMut={resetMut} deleteMut={deleteMut}
                confirm={confirm}/>
            ))}
          </tbody>
        </table>
      </div>

      {confirm.node}
    </div>
  );
}

function StaffRow({ u, editingId, setEditingId, resettingId, setResettingId, roleMut, updateMut, resetMut, deleteMut, confirm }: any) {
  return (
    <>
      <tr className="border-t border-white/5 align-top">
        <td className="px-4 py-3">
          <div className="font-medium">{u.display_name ?? "—"}</div>
          <div className="text-[10px] text-slate-500 font-mono">{u.user_id.slice(0, 8)}…</div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1">
            {u.roles.length === 0 && <span className="text-xs text-slate-500">none</span>}
            {u.roles.map((r: string) => (
              <span key={r} className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded bg-emerald-500/15 text-emerald-300">{r}</span>
            ))}
          </div>
        </td>
        <td className="px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map((r) => {
              const has = u.roles.includes(r);
              return (
                <button key={r}
                  onClick={() => roleMut.mutate({ user_id: u.user_id, role: r, action: has ? "remove" : "add" })}
                  className={`text-[10px] px-2 py-1 rounded border ${has ? "border-rose-500/30 text-rose-300 hover:bg-rose-500/10" : "border-white/10 text-slate-300 hover:bg-white/5"}`}>
                  {has ? `− ${r}` : `+ ${r}`}
                </button>
              );
            })}
          </div>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="inline-flex gap-1">
            <button onClick={() => setEditingId(editingId === u.user_id ? null : u.user_id)}
              title="Edit name/email"
              className="p-1.5 rounded hover:bg-white/5 text-slate-300"><Pencil size={14}/></button>
            <button onClick={() => setResettingId(resettingId === u.user_id ? null : u.user_id)}
              title="Reset password"
              className="p-1.5 rounded hover:bg-white/5 text-amber-300"><KeyRound size={14}/></button>
            <button
              onClick={() => confirm.confirm({
                title: "Delete this staff account?",
                description: <>This permanently removes <strong>{u.display_name ?? "this user"}</strong> and revokes their access. This cannot be undone.</>,
                onConfirm: () => deleteMut.mutate(u.user_id),
              })}
              className="p-1.5 rounded hover:bg-rose-500/10 text-rose-300"><Trash2 size={14}/></button>
          </div>
        </td>
      </tr>
      {editingId === u.user_id && (
        <tr className="bg-white/[0.02]"><td colSpan={4} className="px-4 py-3">
          <EditStaffInline initial={u} busy={updateMut.isPending}
            onCancel={() => setEditingId(null)}
            onSubmit={(patch: any) => updateMut.mutate({ user_id: u.user_id, ...patch })}/>
        </td></tr>
      )}
      {resettingId === u.user_id && (
        <tr className="bg-white/[0.02]"><td colSpan={4} className="px-4 py-3">
          <ResetPasswordInline busy={resetMut.isPending}
            onCancel={() => setResettingId(null)}
            onSubmit={(pw: string) => resetMut.mutate({ user_id: u.user_id, new_password: pw })}/>
        </td></tr>
      )}
    </>
  );
}

function CreateStaffForm({ onSubmit, onCancel, busy }: { onSubmit: (v: any) => void; onCancel: () => void; busy: boolean }) {
  const [v, setV] = useState({ email: "", password: "", display_name: "", role: "officer" as "officer" | "supervisor" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(v); }}
      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <Field label="Display name"><input required value={v.display_name} onChange={(e) => setV({ ...v, display_name: e.target.value })} className={inp}/></Field>
      <Field label="Email"><input required type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} className={inp}/></Field>
      <Field label="Temporary password"><input required type="text" minLength={8} value={v.password} onChange={(e) => setV({ ...v, password: e.target.value })} placeholder="min 8 chars" className={inp}/></Field>
      <Field label="Role">
        <select value={v.role} onChange={(e) => setV({ ...v, role: e.target.value as any })} className={inp}>
          <option value="officer">Officer</option><option value="supervisor">Supervisor</option>
        </select>
      </Field>
      <div className="lg:col-span-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {busy && <Loader2 size={14} className="animate-spin"/>} Create staff
        </button>
      </div>
    </form>
  );
}

function EditStaffInline({ initial, onSubmit, onCancel, busy }: { initial: any; onSubmit: (v: any) => void; onCancel: () => void; busy: boolean }) {
  const [v, setV] = useState({ display_name: initial.display_name ?? "", email: "" });
  return (
    <form onSubmit={(e) => { e.preventDefault(); const patch: any = { display_name: v.display_name }; if (v.email) patch.email = v.email; onSubmit(patch); }}
      className="grid sm:grid-cols-3 gap-3 items-end">
      <Field label="Display name"><input value={v.display_name} onChange={(e) => setV({ ...v, display_name: e.target.value })} className={inp}/></Field>
      <Field label="New email (optional)"><input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} className={inp}/></Field>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {busy && <Loader2 size={14} className="animate-spin"/>} Save
        </button>
      </div>
    </form>
  );
}

function ResetPasswordInline({ onSubmit, onCancel, busy }: { onSubmit: (pw: string) => void; onCancel: () => void; busy: boolean }) {
  const [pw, setPw] = useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(pw); }} className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[240px]">
        <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">New password (min 8)</span>
        <input required minLength={8} type="text" value={pw} onChange={(e) => setPw(e.target.value)} className={inp}/>
      </div>
      <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-white/5">Cancel</button>
      <button disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60">
        {busy && <Loader2 size={14} className="animate-spin"/>} Reset password
      </button>
    </form>
  );
}

const inp = "w-full rounded-lg bg-[#0b1224] border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}
