import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getDashboardStats } from "@/lib/admin.functions";
import { Bird, AlertTriangle, Wheat, TrendingUp, Banknote } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Overview,
});

function fmt(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}
function naira(n: number) {
  return "₦" + new Intl.NumberFormat().format(Math.round(n));
}

function Overview() {
  const fetchStats = useServerFn(getDashboardStats);
  const { data, isLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: () => fetchStats() });

  const tiles = [
    { label: "Active flock", value: fmt(data?.activeFlock ?? 0), icon: Bird, accent: "from-emerald-500/20 to-emerald-500/0", iconColor: "text-emerald-400" },
    { label: "Mortality (30d)", value: fmt(data?.totalMortality ?? 0), sub: `${(data?.mortalityRate ?? 0).toFixed(2)}%`, icon: AlertTriangle, accent: "from-rose-500/20 to-rose-500/0", iconColor: "text-rose-400" },
    { label: "Feed bags (30d)", value: fmt(data?.totalFeedBags ?? 0), icon: Wheat, accent: "from-amber-500/20 to-amber-500/0", iconColor: "text-amber-400" },
    { label: "Sales (30d)", value: naira(data?.totalSales ?? 0), icon: Banknote, accent: "from-sky-500/20 to-sky-500/0", iconColor: "text-sky-400" },
    { label: "Profit (30d)", value: naira(data?.profit ?? 0), icon: TrendingUp, accent: "from-violet-500/20 to-violet-500/0", iconColor: "text-violet-400" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-bold">Live Operations</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time KPIs from the last 30 days.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {tiles.map((t, i) => {
          const Icon = t.icon;
          return (
            <div key={i} className={`relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br ${t.accent} bg-[#1e293b] p-5`}>
              <Icon size={18} className={t.iconColor}/>
              <div className="mt-3 font-mono text-2xl font-bold text-white">
                {isLoading ? "…" : t.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-widest text-slate-400">{t.label}</div>
              {t.sub && <div className="mt-0.5 text-[11px] text-slate-500">{t.sub}</div>}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <ChartCard title="Daily mortality">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data?.trend ?? []}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3"/>
              <XAxis dataKey="date" stroke="#64748b" fontSize={11}/>
              <YAxis stroke="#64748b" fontSize={11}/>
              <Tooltip contentStyle={{ background: "#0b1224", border: "1px solid #334155", borderRadius: 8 }}/>
              <Line type="monotone" dataKey="mortality" stroke="#f43f5e" strokeWidth={2} dot={false}/>
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Daily sales (₦)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data?.trend ?? []}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3"/>
              <XAxis dataKey="date" stroke="#64748b" fontSize={11}/>
              <YAxis stroke="#64748b" fontSize={11}/>
              <Tooltip contentStyle={{ background: "#0b1224", border: "1px solid #334155", borderRadius: 8 }}/>
              <Bar dataKey="sales" fill="#10b981" radius={[6, 6, 0, 0]}/>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-5">
      <h3 className="text-sm font-semibold text-slate-200 mb-3">{title}</h3>
      {children}
    </div>
  );
}
