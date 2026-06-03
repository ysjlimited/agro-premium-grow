import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSubmissions } from "@/lib/admin.functions";
import { Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  component: SubmissionsPage,
});

function SubmissionsPage() {
  const fn = useServerFn(listSubmissions);
  const { data, isLoading } = useQuery({ queryKey: ["submissions"], queryFn: () => fn() });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-bold">Submissions Inbox</h1>
        <p className="text-sm text-slate-400">Contact form messages and newsletter signups.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Panel title="Contact messages" icon={MessageCircle}>
          {isLoading ? <Loading/> : data!.contacts.length === 0 ? <Empty/> : data!.contacts.map((c) => (
            <div key={c.id} className="border-t border-white/5 px-4 py-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span className="font-mono">{new Date(c.created_at).toLocaleString()}</span>
                <a href={`mailto:${c.email}`} className="text-emerald-400 hover:underline">{c.email}</a>
              </div>
              <div className="mt-1 font-semibold text-sm">{c.subject}</div>
              <div className="text-xs text-slate-300 mt-1">{c.name} {c.phone ? `· ${c.phone}` : ""}</div>
              <div className="mt-2 text-sm text-slate-200 whitespace-pre-wrap">{c.message}</div>
            </div>
          ))}
        </Panel>

        <Panel title="Newsletter signups" icon={Mail}>
          {isLoading ? <Loading/> : data!.newsletters.length === 0 ? <Empty/> : data!.newsletters.map((n) => (
            <div key={n.id} className="border-t border-white/5 px-4 py-3 flex justify-between items-center">
              <a href={`mailto:${n.email}`} className="text-sm text-emerald-300 hover:underline">{n.email}</a>
              <span className="font-mono text-xs text-slate-500">{new Date(n.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e293b] overflow-hidden">
      <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5">
        <Icon size={14} className="text-emerald-400"/>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="max-h-[600px] overflow-y-auto">{children}</div>
    </div>
  );
}
function Loading() { return <div className="p-6 text-center text-slate-500 text-sm">Loading…</div>; }
function Empty() { return <div className="p-6 text-center text-slate-500 text-sm">Nothing yet.</div>; }
