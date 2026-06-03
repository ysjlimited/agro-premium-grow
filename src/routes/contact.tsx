import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Mail, MapPin, Phone, MessageCircle, Clock, Facebook, Instagram, Send, ArrowRight } from "lucide-react";
import { SiteShell } from "@/components/SiteShell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact YSJ Limited Broiler Farm — Ibadan, Nigeria" },
      { name: "description", content: "Get in touch with YSJ Limited Broiler Farm. Phone, WhatsApp, email, address and Google Maps directions to our Akobo Ibadan facility." },
      { property: "og:title", content: "Contact YSJ Limited Broiler Farm" },
      { property: "og:description", content: "Reach our team in Akobo, Ibadan — phone, WhatsApp, email, map." },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().max(40).optional(),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10, "Tell us a little more").max(2000),
});

function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd) as Record<string, string>;
    const r = schema.safeParse(data);
    if (!r.success) {
      const errs: Record<string, string> = {};
      r.error.issues.forEach((i) => { if (i.path[0]) errs[String(i.path[0])] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    const body = `Name: ${r.data.name}%0D%0AEmail: ${r.data.email}%0D%0APhone: ${r.data.phone ?? ""}%0D%0A%0D%0A${encodeURIComponent(r.data.message)}`;
    window.location.href = `mailto:ysjlimitedbroilerfarm@gmail.com?subject=${encodeURIComponent(r.data.subject)}&body=${body}`;
    setSent(true);
    e.currentTarget.reset();
  };

  return (
    <SiteShell>
      {/* INTRO */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 text-center reveal">
          <span className="text-xs uppercase tracking-[0.22em] text-primary-deep font-semibold">Get in touch</span>
          <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-bold">Let's talk poultry & agro</h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Bulk orders, brooding services, feed supply or general enquiries — our team is ready to help.
          </p>
        </div>
      </section>

      {/* GRID */}
      <section className="pb-20">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 grid lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-7 reveal rounded-3xl border border-border bg-card p-8 lg:p-10 shadow-elegant">
            <h2 className="text-2xl font-bold">Send us a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">We'll reply within one business day.</p>
            <form onSubmit={onSubmit} className="mt-7 grid sm:grid-cols-2 gap-5">
              <Input name="name" label="Full name" error={errors.name} />
              <Input name="email" label="Email" type="email" error={errors.email} />
              <Input name="phone" label="Phone (optional)" error={errors.phone} />
              <Input name="subject" label="Subject" error={errors.subject} />
              <div className="sm:col-span-2">
                <Label>Message</Label>
                <textarea
                  name="message"
                  rows={5}
                  className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary-deep ${errors.message ? "border-destructive" : "border-border"}`}
                />
                {errors.message && <p className="mt-1 text-xs text-destructive">{errors.message}</p>}
              </div>
              <div className="sm:col-span-2 flex flex-wrap justify-between items-center gap-4">
                {sent ? (
                  <p className="text-sm text-primary-deep">Thanks — your email client should now open. We'll be in touch.</p>
                ) : <span/>}
                <button className="inline-flex items-center gap-2 rounded-full bg-primary-deep px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary transition">
                  Send message <ArrowRight size={16}/>
                </button>
              </div>
            </form>
          </div>

          {/* Info */}
          <aside className="lg:col-span-5 space-y-4">
            {[
              { icon: Phone, t: "Phone", v: "09131201229", href: "tel:+2349131201229" },
              { icon: MessageCircle, t: "WhatsApp", v: "09131201229", href: "https://wa.me/2349131201229" },
              { icon: Mail, t: "Email", v: "ysjlimitedbroilerfarm@gmail.com", href: "mailto:ysjlimitedbroilerfarm@gmail.com" },
              { icon: MapPin, t: "Address", v: "Road 5, Lamona, Oluhunda Akobo, Ibadan, Nigeria" },
              { icon: Clock, t: "Business hours", v: "Mon – Sat · 8:00 AM – 6:00 PM" },
            ].map((c) => {
              const I = c.icon;
              const Wrap: any = c.href ? "a" : "div";
              return (
                <Wrap key={c.t} href={c.href} className="reveal flex items-start gap-4 rounded-2xl border border-border bg-card p-5 hover:shadow-elegant transition">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-deep text-primary-foreground">
                    <I size={18}/>
                  </span>
                  <div>
                    <div className="text-xs uppercase tracking-widest text-muted-foreground">{c.t}</div>
                    <div className="mt-1 font-semibold break-all">{c.v}</div>
                  </div>
                </Wrap>
              );
            })}

            <div className="reveal rounded-2xl border border-border bg-card p-5">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Follow us</div>
              <div className="flex gap-2">
                <Social icon={Facebook} href="#" />
                <Social icon={Instagram} href="#" />
                <Social icon={Send} href="https://wa.me/2349131201229" />
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* MAP */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-border shadow-elegant reveal">
            <iframe
              title="YSJ Limited Broiler Farm location"
              src="https://www.google.com/maps?q=Akobo+Ibadan+Nigeria&output=embed"
              className="w-full h-[460px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary-deep to-primary text-primary-foreground p-10 lg:p-16 text-center">
            <h2 className="text-3xl lg:text-5xl font-bold">Become a wholesale partner</h2>
            <p className="mt-4 max-w-xl mx-auto text-primary-foreground/80 text-lg">Talk to our team about repeat-order contracts for broilers, feeds and crops.</p>
            <a href="https://wa.me/2349131201229" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gold text-gold-foreground px-7 py-3.5 text-sm font-bold hover:opacity-90">
              <MessageCircle size={16}/> Start a WhatsApp chat
            </a>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{children}</label>;
}

function Input({ name, label, type = "text", error }: { name: string; label: string; type?: string; error?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        name={name}
        className={`mt-2 w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary-deep ${error ? "border-destructive" : "border-border"}`}
      />
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function Social({ icon: Icon, href }: { icon: typeof Facebook; href: string }) {
  return (
    <a href={href} className="grid h-10 w-10 place-items-center rounded-full border border-border bg-background hover:bg-secondary transition">
      <Icon size={16}/>
    </a>
  );
}
