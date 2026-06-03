import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Stethoscope, Building2, Lock, Award, Target, Compass } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";
import { PageBanner } from "@/components/PageBanner";
import banner from "@/assets/banner.jpg.asset.json";
import brooding from "@/assets/brooding.jpg.asset.json";
import madam from "@/assets/madam-md.png.asset.json";
import sam from "@/assets/mr-sam.png.asset.json";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About YSJ Limited Broiler Farm — Our Story, Mission & Leadership" },
      { name: "description", content: "Founded in 2016 in Ibadan, YSJ Limited Broiler Farm operates a 10-acre facility producing hygienic broilers, brooding services, feeds, cashew and maize." },
      { property: "og:title", content: "About YSJ Limited Broiler Farm" },
      { property: "og:description", content: "Our story, mission, vision and leadership — Madam MD and Mr. Sam." },
      { property: "og:image", content: banner.url },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <SiteShell>
      <PageBanner
        eyebrow="About us"
        title="A professional agro enterprise rooted in trust & quality"
        subtitle="Founded in 2016 in Ibadan — a 10-acre commercial poultry and agro facility serving traders, processors and households."
      />

      {/* INTRO */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 reveal">
            <span className="text-xs uppercase tracking-[0.22em] text-primary-deep font-semibold">Our story</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              From a single brooding house to a <span className="text-gradient-emerald">10-acre facility</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              YSJ Limited Broiler Farm — also operating as YSJ Poultry & Agro-Farms — was
              founded in 2016 in Ibadan. From a single brooding house, we've grown into a
              10-acre commercial facility serving traders, processors and households with
              hygienically raised broilers, professional brooding services, animal feeds
              and cash crops.
            </p>
          </div>
          <div className="lg:col-span-6 reveal">
            <img src={banner.url} alt="YSJ farm facility interior" className="w-full h-[480px] object-cover rounded-[2rem] border border-border shadow-elegant"/>
          </div>
        </div>
      </section>


      {/* MISSION VISION */}
      <section className="py-20 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 grid md:grid-cols-2 gap-6">
          {[
            { icon: Target, t: "Our Mission", d: "To provide healthy and quality poultry products through hygienic farming practices, professional management, and reliable commercial supply." },
            { icon: Compass, t: "Our Vision", d: "To become one of the most trusted premium poultry and agro-production companies in Nigeria." },
          ].map((b) => {
            const I = b.icon;
            return (
              <div key={b.t} className="reveal rounded-3xl border border-border bg-card p-10 shadow-elegant">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-deep text-primary-foreground">
                  <I size={22}/>
                </span>
                <h2 className="mt-5 text-3xl font-bold">{b.t}</h2>
                <p className="mt-4 text-muted-foreground text-lg leading-relaxed">{b.d}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* LEADERSHIP */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="text-center mb-14 reveal">
            <span className="text-xs uppercase tracking-[0.22em] text-primary-deep font-semibold">Leadership</span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold">The people behind YSJ</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">Decades of combined expertise in poultry production, agribusiness and operational excellence.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {[
              { img: madam.url, name: "Madam MD", role: "Managing Director", bio: "Leads the farm's strategic vision, financial stewardship and operational standards." },
              { img: sam.url, name: "Mr. Sam", role: "Deputy Managing Director", bio: "Oversees production, biosecurity, and commercial distribution across all product lines." },
            ].map((p) => (
              <article key={p.name} className="reveal group rounded-[2rem] border border-border bg-card overflow-hidden hover:shadow-elegant transition">
                <div className="relative h-[420px] overflow-hidden bg-secondary">
                  <img src={p.img} alt={p.name} className="h-full w-full object-cover object-top group-hover:scale-105 transition duration-700"/>
                </div>
                <div className="p-7">
                  <h3 className="text-2xl font-bold">{p.name}</h3>
                  <div className="mt-1 text-sm uppercase tracking-[0.18em] text-primary-deep font-semibold">{p.role}</div>
                  <p className="mt-3 text-muted-foreground leading-relaxed">{p.bio}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* FACILITIES / BIOSECURITY */}
      <section className="py-24 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 reveal">
              <img src={brooding.url} alt="Brooding house" className="w-full h-[460px] object-cover rounded-[2rem] border border-border shadow-elegant"/>
            </div>
            <div className="lg:col-span-7 reveal space-y-6">
              <span className="text-xs uppercase tracking-[0.22em] text-primary-deep font-semibold">Facilities & biosecurity</span>
              <h2 className="text-3xl lg:text-5xl font-bold">Engineered for healthy, consistent production</h2>
              <div className="grid sm:grid-cols-2 gap-5">
                {[
                  { icon: Building2, t: "Modern brooding houses", d: "Climate-controlled environments for optimal first-week survival." },
                  { icon: Stethoscope, t: "Veterinary standards", d: "Routine health checks and structured vaccination programmes." },
                  { icon: Lock, t: "Controlled access", d: "Restricted-entry biosecurity zones across all production areas." },
                  { icon: ShieldCheck, t: "Hygiene protocols", d: "Strict sanitation and waste-management routines." },
                ].map((f) => {
                  const I = f.icon;
                  return (
                    <div key={f.t} className="rounded-2xl border border-border bg-card p-5">
                      <I size={20} className="text-primary-deep"/>
                      <h3 className="mt-3 font-semibold">{f.t}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-5 lg:px-8">
          <div className="text-center mb-14 reveal">
            <span className="text-xs uppercase tracking-[0.22em] text-primary-deep font-semibold">Our journey</span>
            <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold">From 2016 to today</h2>
          </div>
          <ol className="relative border-l-2 border-primary-deep/15 ml-3 space-y-10">
            {[
              { y: "2016", t: "Founded in Ibadan", d: "Operations begin with a single brooding house and a vision for premium poultry." },
              { y: "2018", t: "Expanded production", d: "Doubled flock capacity and introduced structured biosecurity protocols." },
              { y: "2020", t: "Diversified into feeds", d: "Launched in-house feed processing for quality control and cost efficiency." },
              { y: "2022", t: "Added cash crops", d: "Cashew and maize integrated into the 10-acre facility." },
              { y: "Today", t: "Trusted commercial supplier", d: "Serving traders, processors and households with 20,000+ birds managed." },
            ].map((m) => (
              <li key={m.y} className="reveal pl-8 relative">
                <span className="absolute -left-[11px] top-1.5 grid h-5 w-5 place-items-center rounded-full bg-primary-deep text-[10px] font-bold text-primary-foreground">
                  <Award size={10}/>
                </span>
                <div className="font-mono text-sm tracking-widest text-gold">{m.y}</div>
                <div className="mt-1 text-xl font-bold">{m.t}</div>
                <p className="mt-1 text-muted-foreground">{m.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </SiteShell>
  );
}
