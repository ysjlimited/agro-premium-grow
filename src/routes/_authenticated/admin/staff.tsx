import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listStaff, setUserRole } from "@/lib/admin.functions";
import { toast } from "sonner";

const ROLES = ["admin", "md", "supervisor", "officer"] as const;

export const Route = createFileRoute("/_authenticated/admin/staff")({
  component: StaffPage,
});

function StaffPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listStaff);
  const setFn = useServerFn(setUserRole);
  const { data, isLoading } = useQuery({ queryKey: ["staff"], queryFn: () => listFn() });

  const mut = useMutation({
    mutationFn: (v: { user_id: string; role: (typeof ROLES)[number]; action: "add" | "remove" }) =>
      setFn({ data: v }),
    onSuccess: () => { toast.success("Role updated."); qc.invalidateQueries({ queryKey: ["staff"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Staff Roster</h1>
        <p className="text-sm text-slate-400">Admin/MD only — manage user roles.</p>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#1e293b] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Current roles</th>
              <th className="px-4 py-3 text-left">Add/remove</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={3} className="p-6 text-center text-slate-500">Loading…</td></tr>}
            {data?.map((u) => (
              <tr key={u.id} className="border-t border-white/5">
                <td className="px-4 py-3">{u.display_name ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 && <span className="text-xs text-slate-500">none</span>}
                    {u.roles.map((r) => (
                      <span key={r} className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded bg-emerald-500/15 text-emerald-300">{r}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {ROLES.map((r) => {
                      const has = u.roles.includes(r);
                      return (
                        <button
                          key={r}
                          onClick={() => mut.mutate({ user_id: u.user_id, role: r, action: has ? "remove" : "add" })}
                          className={`text-[10px] px-2 py-1 rounded border ${has ? "border-rose-500/30 text-rose-300 hover:bg-rose-500/10" : "border-white/10 text-slate-300 hover:bg-white/5"}`}
                        >
                          {has ? `− ${r}` : `+ ${r}`}
                        </button>
                      );
                    })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
