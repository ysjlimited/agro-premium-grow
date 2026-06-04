import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, ClipboardList, CalendarRange, Inbox,
  Users, Sparkles, LogOut, Menu, X, Bird, Layers, Package,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getMyRoles } from "@/lib/admin.functions";

type NavItem = { to: string; label: string; icon: any; end?: boolean; role?: string[] };
const nav: NavItem[] = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/batches", label: "Batches", icon: Layers },
  { to: "/admin/stock", label: "Stock", icon: Package },
  { to: "/admin/daily-logs", label: "Daily Logs", icon: ClipboardList },
  { to: "/admin/weekly", label: "Weekly Compiler", icon: CalendarRange },
  { to: "/admin/submissions", label: "Submissions", icon: Inbox, role: ["admin", "md", "supervisor"] },
  { to: "/admin/advisor", label: "AI Advisor", icon: Sparkles },
  { to: "/admin/staff", label: "Staff Roster", icon: Users, role: ["admin"] },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const fetchRoles = useServerFn(getMyRoles);
  const { data } = useQuery({ queryKey: ["my-roles"], queryFn: () => fetchRoles() });
  const roles = data?.roles ?? [];
  const [open, setOpen] = useState(false);

  // Force re-login each visit: if no session-marker for this browser tab, sign out & redirect.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!sessionStorage.getItem("ysj-active-session")) {
      supabase.auth.signOut().finally(() => navigate({ to: "/auth" }));
    }
  }, [navigate]);

  const allowed = (r?: readonly string[]) => !r || r.some((x) => roles.includes(x));

  const signOut = async () => {
    sessionStorage.removeItem("ysj-active-session");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };



  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#0b1224] border-r border-white/5 transform ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform`}>
        <div className="px-5 py-5 border-b border-white/5 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <Bird size={18}/>
          </span>
          <div>
            <div className="font-display text-sm font-bold">YSJ Portal</div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Management</div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5">
          {nav.filter((n) => allowed(n.role)).map((n) => {
            const Icon = n.icon as any;
            const active = n.end ? path === n.to : path.startsWith(n.to);
            return (
              <Link
                key={n.to} to={n.to as any} onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? "bg-emerald-500/15 text-emerald-300" : "text-slate-300 hover:bg-white/5"}`}
              >
                <Icon size={16}/> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 left-3 right-3 space-y-2">
          <div className="rounded-xl bg-white/5 border border-white/5 px-3 py-2.5 text-xs">
            <div className="text-slate-400">Signed in as</div>
            <div className="font-medium truncate">{data?.profile?.display_name ?? "—"}</div>
            <div className="text-[10px] mt-1 text-emerald-400 uppercase tracking-widest">
              {roles.join(", ") || "no role"}
            </div>
          </div>
          <button onClick={signOut} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-3 py-2 text-xs">
            <LogOut size={14}/> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {open && <div onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-30"/>}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden h-14 px-4 flex items-center justify-between border-b border-white/5 bg-[#0b1224]">
          <button onClick={() => setOpen(true)} className="p-2 rounded-lg hover:bg-white/5">
            {open ? <X size={18}/> : <Menu size={18}/>}
          </button>
          <span className="font-display font-bold text-sm">YSJ Portal</span>
          <Link to="/" className="text-xs text-slate-400">Site</Link>
        </header>
        <main className="flex-1 p-5 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
