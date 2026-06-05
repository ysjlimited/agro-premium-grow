import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, FileText, Loader2, BarChart3 } from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { getReport } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/reports")({
  component: ReportsPage,
});

type Period = "weekly" | "monthly" | "yearly";

function rangeFor(p: Period): { start: string; end: string; bucket: "day" | "week" | "month" } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  if (p === "weekly") {
    const s = new Date(now); s.setDate(s.getDate() - 6);
    return { start: s.toISOString().slice(0, 10), end, bucket: "day" };
  }
  if (p === "monthly") {
    const s = new Date(now); s.setDate(s.getDate() - 29);
    return { start: s.toISOString().slice(0, 10), end, bucket: "day" };
  }
  const s = new Date(now); s.setMonth(s.getMonth() - 11); s.setDate(1);
  return { start: s.toISOString().slice(0, 10), end, bucket: "month" };
}

function ReportsPage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [{ start, end, bucket }, setRange] = useState(rangeFor("weekly"));
  const reportFn = useServerFn(getReport);
  const mut = useMutation({
    mutationFn: () => reportFn({ data: { start, end, bucket } }),
    onError: (e: Error) => toast.error(e.message),
  });
  const data = mut.data;

  const setP = (p: Period) => { setPeriod(p); setRange(rangeFor(p)); };

  const headers = ["Period", "Entries", "Mortality", "Harvested", "Feed bags", "Water (L)", "Expenses (₦)", "Sales (₦)", "Profit (₦)"];
  const toRow = (g: any) => [g.period, g.entries, g.mortality, g.harvested, g.feed_bags, g.water_liters, g.expenses, g.sales, g.profit];

  const exportExcel = () => {
    if (!data) return toast.error("Generate report first");
    const wb = XLSX.utils.book_new();
    const aoa = [
      [`YSJ Limited — ${period.toUpperCase()} Report`],
      [`Range: ${start} → ${end}`],
      [],
      headers,
      ...data.periods.map(toRow),
      [],
      ["TOTAL", data.totals.entries, data.totals.mortality, data.totals.harvested,
        data.totals.feed_bags, data.totals.water_liters, data.totals.expenses, data.totals.sales, data.totals.profit],
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = headers.map(() => ({ wch: 14 }));
    XLSX.utils.book_append_sheet(wb, ws, "Summary");
    const detail = [
      ["Date", "House", "Mortality", "Harvested", "Feed bags", "Water (L)", "Expenses", "Sales", "Notes"],
      ...data.rows.map((r: any) => [r.log_date, r.house_id, r.mortality, r.birds_harvested, r.feed_bags, r.water_liters, r.expenses, r.sales, r.notes ?? ""]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(detail);
    XLSX.utils.book_append_sheet(wb, ws2, "Daily entries");
    XLSX.writeFile(wb, `ysj-${period}-${start}_to_${end}.xlsx`);
  };

  const exportPdf = () => {
    if (!data) return toast.error("Generate report first");
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("YSJ Limited — Poultry Operations Report", 14, 15);
    doc.setFontSize(10);
    doc.text(`${period.toUpperCase()} • ${start} → ${end}`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [headers],
      body: data.periods.map(toRow).map((r) => r.map((v) => typeof v === "number" ? v.toLocaleString() : v)),
      foot: [["TOTAL", data.totals.entries, data.totals.mortality, data.totals.harvested,
        data.totals.feed_bags, data.totals.water_liters, data.totals.expenses, data.totals.sales, data.totals.profit]
        .map((v, i) => i === 0 ? v : (typeof v === "number" ? v.toLocaleString() : v))],
      headStyles: { fillColor: [16, 185, 129] },
      footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
      styles: { fontSize: 9 },
    });
    doc.save(`ysj-${period}-${start}_to_${end}.pdf`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Reports</h1>
          <p className="text-sm text-slate-400">Weekly, monthly and yearly summaries — printable in Excel and PDF.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-[#1e293b] p-5 flex flex-wrap items-end gap-3">
        <div className="inline-flex rounded-lg overflow-hidden border border-white/10">
          {(["weekly", "monthly", "yearly"] as Period[]).map((p) => (
            <button key={p} onClick={() => setP(p)}
              className={`px-4 py-2 text-xs uppercase tracking-widest ${period === p ? "bg-emerald-500 text-white" : "bg-[#0b1224] text-slate-300 hover:bg-white/5"}`}>
              {p}
            </button>
          ))}
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Start</div>
          <input type="date" value={start} onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
            className="rounded-lg bg-[#0b1224] border border-white/10 px-3 py-2 text-sm text-white"/>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1">End</div>
          <input type="date" value={end} onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
            className="rounded-lg bg-[#0b1224] border border-white/10 px-3 py-2 text-sm text-white"/>
        </div>
        <button onClick={() => mut.mutate()} disabled={mut.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {mut.isPending ? <Loader2 size={14} className="animate-spin"/> : <BarChart3 size={14}/>}
          Generate
        </button>
        <div className="flex-1"/>
        <button onClick={exportExcel} disabled={!data}
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-sm text-emerald-300 disabled:opacity-40">
          <FileSpreadsheet size={14}/> Excel
        </button>
        <button onClick={exportPdf} disabled={!data}
          className="inline-flex items-center gap-2 rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-sm text-rose-300 disabled:opacity-40">
          <FileText size={14}/> PDF
        </button>
      </div>

      {data && (
        <div className="rounded-2xl border border-white/5 bg-[#1e293b] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-widest text-slate-400">
                <tr>{headers.map((h) => <th key={h} className="px-3 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {data.periods.map((g: any) => (
                  <tr key={g.period} className="border-t border-white/5">
                    <td className="px-3 py-3 font-mono text-xs">{g.period}</td>
                    <td className="px-3 py-3 font-mono">{g.entries}</td>
                    <td className="px-3 py-3 font-mono text-rose-300">{g.mortality}</td>
                    <td className="px-3 py-3 font-mono">{g.harvested}</td>
                    <td className="px-3 py-3 font-mono">{g.feed_bags}</td>
                    <td className="px-3 py-3 font-mono">{g.water_liters}</td>
                    <td className="px-3 py-3 font-mono">₦{Number(g.expenses).toLocaleString()}</td>
                    <td className="px-3 py-3 font-mono text-emerald-300">₦{Number(g.sales).toLocaleString()}</td>
                    <td className="px-3 py-3 font-mono">₦{Number(g.profit).toLocaleString()}</td>
                  </tr>
                ))}
                {data.periods.length === 0 && (
                  <tr><td colSpan={9} className="p-6 text-center text-slate-500">No data in this range.</td></tr>
                )}
              </tbody>
              {data.periods.length > 0 && (
                <tfoot className="bg-white/[0.03]">
                  <tr className="font-semibold">
                    <td className="px-3 py-3">TOTAL</td>
                    <td className="px-3 py-3 font-mono">{data.totals.entries}</td>
                    <td className="px-3 py-3 font-mono text-rose-300">{data.totals.mortality}</td>
                    <td className="px-3 py-3 font-mono">{data.totals.harvested}</td>
                    <td className="px-3 py-3 font-mono">{data.totals.feed_bags}</td>
                    <td className="px-3 py-3 font-mono">{data.totals.water_liters}</td>
                    <td className="px-3 py-3 font-mono">₦{Number(data.totals.expenses).toLocaleString()}</td>
                    <td className="px-3 py-3 font-mono text-emerald-300">₦{Number(data.totals.sales).toLocaleString()}</td>
                    <td className="px-3 py-3 font-mono">₦{Number(data.totals.profit).toLocaleString()}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
