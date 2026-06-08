import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ShieldCheck, Clock, User } from "lucide-react";
import { listAuditLogs, listStaff } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/audit-logs")({
  component: AuditLogsPage,
});

function AuditLogsPage() {
  const listFn = useServerFn(listAuditLogs);
  const staffFn = useServerFn(listStaff);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => listFn(),
  });

  const { data: staff } = useQuery({
    queryKey: ["staff"],
    queryFn: () => staffFn(),
  });

  const staffMap = new Map<string, string>();
  for (const s of staff ?? []) {
    staffMap.set(s.user_id, s.display_name ?? "—");
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <ShieldCheck size={22} className="text-emerald-400" />
            Admin Activity History
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Audit trail of password resets and other admin actions.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#1e293b] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
            <tr>
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-left">Actor</th>
              <th className="px-4 py-3 text-left">Target</th>
              <th className="px-4 py-3 text-left">Details</th>
              <th className="px-4 py-3 text-right">When</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {(!logs || logs.length === 0) && !isLoading && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  No audit entries yet.
                </td>
              </tr>
            )}
            {(logs ?? []).map((log: any) => (
              <tr key={log.id} className="border-t border-white/5 hover:bg-white/[0.02] transition">
                <td className="px-4 py-3">
                  <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded bg-emerald-500/15 text-emerald-300">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <User size={12} className="text-slate-500" />
                    <span>{staffMap.get(log.actor_id) ?? "—"}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {log.target_type && log.target_id ? (
                    <span className="text-slate-300">
                      {staffMap.get(log.target_id) ?? log.target_id.slice(0, 8) + "…"}
                    </span>
                  ) : (
                    <span className="text-slate-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400 max-w-[260px] truncate">
                  {log.details?.reason ?? "—"}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5 text-slate-400 text-xs">
                    <Clock size={12} />
                    {new Date(log.created_at).toLocaleString()}
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
