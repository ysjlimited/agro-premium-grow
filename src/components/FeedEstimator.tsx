import { useMemo, useState } from "react";
import { Calculator, Leaf } from "lucide-react";

/**
 * Broiler Feed & Profit Estimator
 * Industry-typical figures used as defaults; users tune via the inputs.
 */
export function FeedEstimator() {
  const [batch, setBatch] = useState(500);
  const [age, setAge] = useState(42); // days
  const [pricePerKg, setPricePerKg] = useState(3500); // ₦/kg live weight
  const [chickCost, setChickCost] = useState(1200); // ₦
  const [feedPriceKg, setFeedPriceKg] = useState(900); // ₦/kg

  const stats = useMemo(() => {
    // Approximate live-weight (kg) by age in days
    const expectedKg = Math.max(0.4, Math.min(3.4, 0.05 + age * 0.062));
    // Cumulative feed per bird (kg) — typical broiler curve
    const feedPerBird = Math.max(0.3, age * 0.13);
    const totalFeedKg = feedPerBird * batch;
    const totalFeedTonnes = totalFeedKg / 1000;

    const revenue = expectedKg * batch * pricePerKg;
    const feedCost = totalFeedKg * feedPriceKg;
    const chicks = chickCost * batch;
    const overhead = 0.15 * (feedCost + chicks); // labour, meds, utilities
    const totalCost = feedCost + chicks + overhead;
    const profit = revenue - totalCost;
    const margin = revenue ? (profit / revenue) * 100 : 0;

    return { expectedKg, feedPerBird, totalFeedKg, totalFeedTonnes, revenue, totalCost, profit, margin };
  }, [batch, age, pricePerKg, chickCost, feedPriceKg]);

  const naira = (n: number) =>
    "₦" + Math.round(n).toLocaleString();

  return (
    <div className="rounded-3xl border border-border bg-card p-6 lg:p-10 shadow-elegant">
      <div className="flex items-center gap-3 mb-6">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-deep text-primary-foreground">
          <Calculator size={20} />
        </span>
        <div>
          <h3 className="text-2xl font-bold">Broiler Feed & Profit Estimator</h3>
          <p className="text-sm text-muted-foreground">Plan your next batch in seconds.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-5">
          <Field label="Batch size (birds)" value={batch} setValue={setBatch} min={50} max={20000} step={50} />
          <Field label="Target age (days)" value={age} setValue={setAge} min={28} max={56} step={1} />
          <Field label="Live weight selling price (₦/kg)" value={pricePerKg} setValue={setPricePerKg} min={1000} max={8000} step={50} />
          <Field label="Day-old chick cost (₦/bird)" value={chickCost} setValue={setChickCost} min={500} max={3000} step={50} />
          <Field label="Feed price (₦/kg)" value={feedPriceKg} setValue={setFeedPriceKg} min={300} max={2000} step={25} />
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-primary-deep to-primary text-primary-foreground p-8 space-y-5">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] opacity-80">
            <Leaf size={14}/> Projection
          </div>
          <Result k="Expected live weight / bird" v={`${stats.expectedKg.toFixed(2)} kg`} />
          <Result k="Total feed required" v={`${stats.totalFeedKg.toLocaleString(undefined, { maximumFractionDigits: 0 })} kg`} sub={`${stats.totalFeedTonnes.toFixed(2)} tonnes`} />
          <Result k="Projected revenue" v={naira(stats.revenue)} />
          <Result k="Total production cost" v={naira(stats.totalCost)} />
          <div className="border-t border-white/20 pt-4">
            <Result k="Projected profit" v={naira(stats.profit)} highlight />
            <Result k="Margin" v={`${stats.margin.toFixed(1)}%`} />
          </div>
          <p className="text-[11px] opacity-70">
            Estimates only — actual results vary with feed conversion, mortality, and market prices.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, setValue, min, max, step }: { label: string; value: number; setValue: (n: number) => void; min: number; max: number; step: number }) {
  return (
    <label className="block">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="font-mono text-sm text-primary-deep">{value.toLocaleString()}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full accent-[color:var(--primary-deep)]"
      />
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => setValue(Number(e.target.value))}
        className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono"
      />
    </label>
  );
}

function Result({ k, v, sub, highlight }: { k: string; v: string; sub?: string; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-sm opacity-90">{k}</span>
      <div className="text-right">
        <div className={`font-mono ${highlight ? "text-2xl text-gold" : "text-lg"}`}>{v}</div>
        {sub && <div className="text-xs opacity-70 font-mono">{sub}</div>}
      </div>
    </div>
  );
}
