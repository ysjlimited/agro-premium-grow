import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MessageCircle, ShieldCheck, Truck, Leaf, Egg, Wheat, Star } from "lucide-react";
import { PageBanner } from "@/components/PageBanner";
import { SiteShell } from "@/components/SiteShell";
import { AnimatedCounter } from "@/components/AnimatedCounter";
import hero from "@/assets/hero.jpg.asset.json";
import banner from "@/assets/banner.jpg.asset.json";
import brooding from "@/assets/brooding.jpg.asset.json";
import chicks from "@/assets/chicks.jpg.asset.json";
import cashew from "@/assets/cashew.jpg.asset.json";
import maize from "@/assets/maize.webp.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YSJ Limited Broiler Farm — Premium Poultry & Agro, Ibadan" },
      { name: "description", content: "Premium broiler production, poultry brooding, animal feeds, cashew & maize. Hygienic, professionally managed agro supply from Ibadan, Nigeria." },
      { property: "og:title", content: "YSJ Limited Broiler Farm — Premium Poultry & Agro" },
      { property: "og:description", content: "Hygienic broilers, brooding, feeds and cash crops from a professional commercial farm in Ibadan, Nigeria." },
      { property: "og:image", content: hero.url },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteShell>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gold/20 blur-3xl" aria-hidden />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="mx-auto max-w-7xl px-5 lg:px-8 py-20 lg:py-28 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-7 reveal">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-deep">
              <Sparkles size={14}/> Since 2016 · Ibadan, Nigeria
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] tracking-tight">
              Premium <span className="text-gradient-emerald">Broiler Production</span>,
              Poultry Brooding & Agro Supply in Ibadan
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              YSJ Limited delivers hygienically raised broilers, professional brooding services
              and quality animal feeds — alongside cashew and maize from our 10-acre facility.
              Trusted by traders, processors and households across Oyo State.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-primary-deep px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:bg-primary transition">
                Request a Quote <ArrowRight size={16}/>
              </Link>
              <a href="https://wa.me/2349131201229" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-sm font-semibold hover:bg-secondary transition">
                <MessageCircle size={16}/> Chat on WhatsApp
              </a>
            </div>
            <div className="flex items-center gap-5 pt-2">
              <div className="flex -space-x-2">
                {[brooding, chicks, banner].map((a, i) => (
                  <img key={i} src={a.url} alt="" className="h-9 w-9 rounded-full border-2 border-background object-cover"/>
                ))}
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Star size={14} className="fill-gold text-gold"/>
                <Star size={14} className="fill-gold text-gold"/>
                <Star size={14} className="fill-gold text-gold"/>
                <Star size={14} className="fill-gold text-gold"/>
                <Star size={14} className="fill-gold text-gold"/>
                <span className="ml-2 text-muted-foreground">Trusted by wholesale buyers</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 relative reveal">
            <div className="relative rounded-[2rem] overflow-hidden border border-border shadow-elegant">
              <img src={hero.url} alt="YSJ broiler farm facility at night" className="w-full h-[520px] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-deep/40 via-transparent to-transparent"/>
            </div>
            <div className="absolute -bottom-6 -left-6 rounded-2xl bg-card border border-border p-5 shadow-elegant w-56 hidden sm:block">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Active flock</div>
              <div className="font-mono text-3xl font-bold text-primary-deep">20,000+</div>
              <div className="text-xs text-muted-foreground">birds under management</div>
            </div>
            <div className="absolute -top-5 -right-3 rounded-2xl bg-primary-deep text-primary-foreground p-4 shadow-elegant hidden sm:block">
              <Egg size={20}/>
              <div className="mt-2 text-xs uppercase tracking-widest opacity-80">10 acres</div>
              <div className="font-display text-xl font-bold">Farm Facility</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-primary-deep text-primary-foreground">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 grid grid-cols-2 lg:grid-cols-4 gap-10">
          {[
            { v: 20000, suffix: "+", l: "Birds Managed" },
            { v: 10, suffix: "", l: "Acres Farm Facility" },
            { v: 850, suffix: "+", l: "Tonnes Feed Processed" },
            { v: 2016, suffix: "", l: "Operating Since" },
          ].map((s, i) => (
            <div key={i} className="reveal">
              <div className="text-4xl lg:text-5xl font-bold">
                <AnimatedCounter to={s.v} suffix={s.suffix}/>
              </div>
              <div className="mt-2 text-sm uppercase tracking-[0.2em] opacity-80">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FARM TO TABLE */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="max-w-2xl mb-14 reveal">
            <span className="text-xs uppercase tracking-[0.22em] text-primary-deep font-semibold">Our process</span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold">Farm-to-table philosophy</h2>
            <p className="mt-4 text-muted-foreground text-lg">From day-old chicks to bulk distribution — every step is monitored with veterinary discipline and biosecurity.</p>
          </div>

          <ol className="relative grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { n: "01", t: "Brooding", d: "Climate-controlled brooding houses for healthy day-old chicks." },
              { n: "02", t: "Growing", d: "Veterinary nutrition with monitored feed conversion ratios." },
              { n: "03", t: "Processing", d: "Hygienic handling under strict biosecurity protocols." },
              { n: "04", t: "Distribution", d: "Wholesale & retail logistics across Oyo and beyond." },
            ].map((step) => (
              <li key={step.n} className="reveal rounded-3xl border border-border bg-card p-7 hover:-translate-y-1 hover:shadow-elegant transition">
                <div className="font-mono text-xs text-gold tracking-widest">{step.n}</div>
                <div className="mt-2 text-xl font-bold">{step.t}</div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* WHY US — alternating */}
      <section className="py-24 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 space-y-24">
          {[
            { img: brooding.url, icon: ShieldCheck, t: "Strict biosecurity", d: "Controlled-access housing, sanitation protocols and veterinary oversight protect every flock — from day-old to market weight." },
            { img: banner.url, icon: Leaf, t: "Hygienic feed standards", d: "We process and source nutritionally balanced feed to deliver consistent weight gain and meat quality.", reverse: true },
            { img: chicks.url, icon: Truck, t: "Reliable wholesale supply", d: "Bulk orders fulfilled with logistics partners across Oyo State for traders, processors and HORECA buyers." },
          ].map((row, i) => {
            const Icon = row.icon;
            return (
              <div key={i} className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${row.reverse ? "lg:[&>div:first-child]:order-2" : ""}`}>
                <div className="reveal">
                  <img src={row.img} alt="" loading="lazy" className="w-full h-[420px] object-cover rounded-[2rem] border border-border shadow-elegant"/>
                </div>
                <div className="reveal space-y-5">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-deep text-primary-foreground">
                    <Icon size={22}/>
                  </span>
                  <h3 className="text-3xl lg:text-4xl font-bold leading-tight">{row.t}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed max-w-lg">{row.d}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SERVICES PREVIEW */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12 reveal">
            <div className="max-w-xl">
              <span className="text-xs uppercase tracking-[0.22em] text-primary-deep font-semibold">What we offer</span>
              <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold">Services & products</h2>
            </div>
            <Link to="/services" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-deep hover:gap-3 transition-all">
              Explore the catalogue <ArrowRight size={16}/>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { img: banner.url, icon: Egg, t: "Commercial broilers", d: "Healthy, well-finished birds for traders and processors." },
              { img: brooding.url, icon: ShieldCheck, t: "Poultry brooding", d: "Specialised brooding for first-week survival rates." },
              { img: chicks.url, icon: Truck, t: "Bulk distribution", d: "Reliable wholesale logistics across Oyo State." },
              { img: cashew.url, icon: Leaf, t: "Cashew", d: "Cash crop production from our 10-acre facility." },
              { img: maize.url, icon: Wheat, t: "Maize", d: "Premium grain for feed and food markets." },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <article key={i} className="reveal group relative overflow-hidden rounded-3xl border border-border bg-card hover:-translate-y-1 hover:shadow-elegant transition">
                  <div className="relative h-52 overflow-hidden">
                    <img src={s.img} alt="" loading="lazy" className="h-full w-full object-cover group-hover:scale-110 transition duration-700"/>
                    <span className="absolute top-4 left-4 grid h-10 w-10 place-items-center rounded-xl bg-background/90 backdrop-blur text-primary-deep">
                      <Icon size={18}/>
                    </span>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold">{s.t}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* GALLERY MASONRY */}
      <section className="py-24 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-12 reveal">
            <span className="text-xs uppercase tracking-[0.22em] text-primary-deep font-semibold">Inside the farm</span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold">Gallery</h2>
          </div>
          <div className="columns-2 md:columns-3 lg:columns-4 gap-4 [&>*]:mb-4">
            {[hero, banner, brooding, chicks, cashew, maize, banner, brooding].map((a, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-border break-inside-avoid">
                <img src={a.url} alt="" loading="lazy" className="w-full hover:scale-110 transition duration-700"/>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-primary-deep text-primary-foreground p-10 lg:p-16">
            <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-gold/30 blur-3xl"/>
            <div className="relative grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <h2 className="text-3xl lg:text-5xl font-bold leading-tight">Ready to source from a farm you can trust?</h2>
                <p className="mt-4 text-primary-foreground/80 text-lg max-w-lg">Bulk broilers, feeds and cash crops — competitively priced, hygienically produced, professionally managed.</p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-gold text-gold-foreground px-6 py-3.5 text-sm font-semibold hover:opacity-90">
                  Request a Quote <ArrowRight size={16}/>
                </Link>
                <a href="https://wa.me/2349131201229" className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3.5 text-sm font-semibold hover:bg-white/10">
                  <MessageCircle size={16}/> WhatsApp Us
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
