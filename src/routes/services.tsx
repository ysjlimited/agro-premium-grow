import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Egg, Wheat, Leaf, Truck, Check, ShieldCheck } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { FeedEstimator } from "@/components/FeedEstimator";
import { PageBanner } from "@/components/PageBanner";
import banner from "@/assets/banner.jpg.asset.json";
import brooding from "@/assets/brooding.jpg.asset.json";
import chicks from "@/assets/chicks.jpg.asset.json";
import cashew from "@/assets/cashew.jpg.asset.json";
import maize from "@/assets/maize.webp.asset.json";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Services & Products — YSJ Limited Broiler Farm" },
      { name: "description", content: "Commercial broilers, poultry brooding, bulk distribution, animal feeds, cashew and maize. Includes our free broiler feed & profit estimator." },
      { property: "og:title", content: "Services & Products — YSJ Limited Broiler Farm" },
      { property: "og:description", content: "Premium poultry, feeds and cash crops with a built-in feed & profit estimator." },
      { property: "og:image", content: banner.url },
      { property: "og:url", content: "/services" },
    ],
    links: [{ rel: "canonical", href: "/services" }],
  }),
  component: Services,
});

type Cat = "all" | "poultry" | "feeds" | "crops" | "farm";

interface Product {
  cat: Exclude<Cat, "all">;
  img: string;
  title: string;
  blurb: string;
  specs: { k: string; v: string }[];
  features: string[];
  process: string[];
}

const products: Product[] = [
  {
    cat: "poultry",
    img: banner.url,
    title: "Commercial Broiler Production",
    blurb: "Healthy, well-finished broilers raised to commercial weight under strict veterinary oversight.",
    specs: [
      { k: "Live weight", v: "1.8 – 2.6 kg" },
      { k: "Market age", v: "38 – 45 days" },
      { k: "Pricing", v: "From ₦3,500 / kg" },
    ],
    features: ["Hygienically raised", "Vaccinated flocks", "Bulk and retail options"],
    process: ["Source quality day-old chicks", "Brooding & grow-out", "Pre-sale health check", "Delivery / pickup"],
  },
  {
    cat: "poultry",
    img: brooding.url,
    title: "Poultry Brooding Services",
    blurb: "Specialised first-week brooding to deliver strong, uniform chicks ready for grow-out.",
    specs: [
      { k: "Capacity / cycle", v: "Up to 5,000 chicks" },
      { k: "Duration", v: "1 – 3 weeks" },
      { k: "Pricing", v: "On request" },
    ],
    features: ["Climate-controlled houses", "24/7 monitoring", "Optimised feed conversion"],
    process: ["Pre-arrival sanitation", "Reception & warming", "Vaccination schedule", "Transfer-ready chicks"],
  },
  {
    cat: "poultry",
    img: chicks.url,
    title: "Bulk Distribution & Wholesale Supply",
    blurb: "Reliable supply for traders, processors and HORECA buyers across Oyo State.",
    specs: [
      { k: "Min. order", v: "100 birds" },
      { k: "Delivery", v: "Oyo State & Southwest" },
      { k: "Lead time", v: "24 – 72 hours" },
    ],
    features: ["Wholesale pricing", "Cold-chain options", "Repeat-order contracts"],
    process: ["Order placement", "Quote & confirmation", "Quality check & packaging", "Logistics & delivery"],
  },
  {
    cat: "feeds",
    img: maize.url,
    title: "Animal Feeds",
    blurb: "Nutritionally balanced feed for starter, grower and finisher stages.",
    specs: [
      { k: "Form", v: "Crumble / pellet / mash" },
      { k: "Bag size", v: "25 kg" },
      { k: "Pricing", v: "From ₦18,000 / bag" },
    ],
    features: ["Maize, soy & premix blend", "Consistent crude protein", "Improved FCR"],
    process: ["Raw material screening", "Formulation", "Milling & blending", "Bagging & dispatch"],
  },
  {
    cat: "crops",
    img: cashew.url,
    title: "Cashew",
    blurb: "Raw cashew nuts and apples from our 10-acre cultivated facility.",
    specs: [
      { k: "Season", v: "Feb – May" },
      { k: "Grade", v: "Premium" },
      { k: "Pricing", v: "Market rate" },
    ],
    features: ["Hand-picked", "Sun-dried", "Bulk available"],
    process: ["Cultivation", "Harvesting", "Drying & sorting", "Packaging"],
  },
  {
    cat: "crops",
    img: maize.url,
    title: "Maize",
    blurb: "Premium yellow & white maize for feed and food markets.",
    specs: [
      { k: "Season", v: "Year-round" },
      { k: "Bag size", v: "100 kg" },
      { k: "Pricing", v: "On request" },
    ],
    features: ["Low moisture", "Clean grain", "Bulk wholesale"],
    process: ["Planting", "Harvesting", "Drying", "Bagging"],
  },
  {
    cat: "farm",
    img: brooding.url,
    title: "Farm Consultancy",
    blurb: "Advisory for setting up brooding houses, biosecurity zones and feed programmes.",
    specs: [
      { k: "Format", v: "On-site & remote" },
      { k: "Engagement", v: "Per project" },
      { k: "Pricing", v: "Custom quote" },
    ],
    features: ["Setup planning", "SOP development", "Staff training"],
    process: ["Discovery call", "Site assessment", "Action plan", "Implementation support"],
  },
];

const tabs: { id: Cat; label: string; icon: typeof Egg }[] = [
  { id: "all", label: "All", icon: ShieldCheck },
  { id: "poultry", label: "Poultry & Livestock", icon: Egg },
  { id: "feeds", label: "Animal Feeds", icon: Truck },
  { id: "crops", label: "Cash Crops", icon: Leaf },
  { id: "farm", label: "Farm Services", icon: Wheat },
];

function Services() {
  const [cat, setCat] = useState<Cat>("all");
  const filtered = cat === "all" ? products : products.filter((p) => p.cat === cat);

  return (
    <SiteShell>
      <PageBanner
        eyebrow="Catalogue"
        title="Services & products"
        subtitle="Poultry, feeds and crops — produced and supplied to commercial standards. Filter by category or use our feed & profit estimator below."
      />

      {/* INTRO */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 text-center reveal">
          <span className="text-xs uppercase tracking-[0.22em] text-primary-deep font-semibold">Explore</span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold">Browse our offerings</h2>
        </div>

        {/* TABS */}
        <div className="mx-auto max-w-7xl px-5 lg:px-8 mt-10 flex flex-wrap gap-2 justify-center">
          {tabs.map((t) => {
            const I = t.icon;
            const active = cat === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setCat(t.id)}
                className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold border transition ${
                  active
                    ? "bg-primary-deep text-primary-foreground border-primary-deep shadow-elegant"
                    : "bg-card text-charcoal/80 border-border hover:bg-secondary"
                }`}
              >
                <I size={14}/> {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 grid lg:grid-cols-2 gap-8">
          {filtered.map((p) => (
            <article key={p.title} className="reveal group overflow-hidden rounded-3xl border border-border bg-card hover:shadow-elegant transition">
              <div className="relative h-64 overflow-hidden">
                <img src={p.img} alt={p.title} loading="lazy" className="h-full w-full object-cover group-hover:scale-110 transition duration-700"/>
              </div>
              <div className="p-7 space-y-5">
                <div>
                  <h3 className="text-2xl font-bold">{p.title}</h3>
                  <p className="mt-2 text-muted-foreground">{p.blurb}</p>
                </div>

                <dl className="grid sm:grid-cols-3 gap-3">
                  {p.specs.map((s) => (
                    <div key={s.k} className="rounded-xl bg-secondary/50 p-3">
                      <dt className="text-[11px] uppercase tracking-widest text-muted-foreground">{s.k}</dt>
                      <dd className="mt-1 font-mono text-sm font-bold text-primary-deep">{s.v}</dd>
                    </div>
                  ))}
                </dl>

                <div>
                  <div className="text-xs uppercase tracking-widest font-semibold text-primary-deep mb-2">Features</div>
                  <ul className="grid sm:grid-cols-2 gap-1.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check size={14} className="text-gold"/> {f}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest font-semibold text-primary-deep mb-2">Process</div>
                  <ol className="flex flex-wrap gap-2">
                    {p.process.map((step, i) => (
                      <li key={step} className="rounded-full border border-border bg-background px-3 py-1 text-xs">
                        <span className="font-mono text-gold mr-1">{String(i + 1).padStart(2, "0")}</span>{step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ESTIMATOR */}
      <section className="pb-28">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-10 reveal text-center max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.22em] text-primary-deep font-semibold">Interactive tool</span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold">Plan your next batch</h2>
            <p className="mt-3 text-muted-foreground">Estimate feed requirements, expected weight and projected profit.</p>
          </div>
          <div className="reveal">
            <FeedEstimator />
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
