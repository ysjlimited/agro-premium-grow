import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Mail, MapPin, Phone, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { toast } from "sonner";
import { RotatingLogo } from "./RotatingLogo";
import { subscribeNewsletter } from "@/lib/forms.functions";

export function Footer() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const subscribe = useServerFn(subscribeNewsletter);

  const onSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = z.string().trim().email().safeParse(email);
    if (!r.success) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    try {
      await subscribe({ data: { email: r.data } });
      setSent(true);
      setEmail("");
      toast.success("Subscribed — thanks! We'll be in touch.");
    } catch (err) {
      console.error(err);
      toast.error("Could not subscribe. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <footer className="mt-24 border-t border-border bg-gradient-to-b from-background to-secondary/60">
      <div className="mx-auto max-w-7xl px-5 lg:px-8 py-16 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4 space-y-5">
          <RotatingLogo size={52} />
          <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
            YSJ Limited Broiler Farm — a premium commercial poultry and agro
            enterprise delivering hygienic broilers, professional brooding,
            quality feeds and cash crops since 2016.
          </p>
          <div className="flex gap-3">
            <a aria-label="Facebook" href="#" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary transition">
              <Facebook size={16} />
            </a>
            <a aria-label="Instagram" href="#" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary transition">
              <Instagram size={16} />
            </a>
            <a aria-label="WhatsApp" href="https://wa.me/2349131201229" className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card hover:bg-secondary transition">
              <Send size={16} />
            </a>
          </div>
        </div>

        <div className="lg:col-span-2">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-primary-deep mb-4">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-primary-deep">Home</Link></li>
            <li><Link to="/about" className="hover:text-primary-deep">About</Link></li>
            <li><Link to="/services" className="hover:text-primary-deep">Services & Products</Link></li>
            <li><Link to="/contact" className="hover:text-primary-deep">Contact</Link></li>
            <li><Link to={"/admin" as any} className="font-semibold text-primary-deep hover:underline">Admin Dashboard →</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-primary-deep mb-4">Contact</h4>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2"><MapPin size={16} className="mt-0.5 text-primary"/> Road 5, Lamona, Oluhunda Akobo, Ibadan, Nigeria</li>
            <li className="flex gap-2"><Phone size={16} className="mt-0.5 text-primary"/> <a href="tel:+2349131201229" className="font-mono">09131201229</a></li>
            <li className="flex gap-2"><Mail size={16} className="mt-0.5 text-primary"/> <a href="mailto:ysjlimitedbroilerfarm@gmail.com" className="break-all">ysjlimitedbroilerfarm@gmail.com</a></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <h4 className="text-sm font-semibold uppercase tracking-widest text-primary-deep mb-4">Newsletter</h4>
          <p className="text-sm text-muted-foreground mb-3">Farm updates, seasonal offers and bulk-supply availability.</p>
          <form
            onSubmit={onSubscribe}
            className="flex items-center rounded-full border border-border bg-card pl-4 pr-1 py-1"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-primary-deep px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60 inline-flex items-center gap-1.5"
            >
              {busy ? <><Loader2 size={12} className="animate-spin"/> …</> : "Subscribe"}
            </button>
          </form>
          {sent && <p className="mt-2 text-xs text-primary-deep">Thanks — we'll be in touch.</p>}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-5 lg:px-8 py-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} YSJ Limited Broiler Farm. All rights reserved.</p>
          <p>Ibadan, Oyo State, Nigeria</p>
        </div>
      </div>
    </footer>
  );
}

