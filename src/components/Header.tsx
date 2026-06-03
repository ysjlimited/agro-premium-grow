import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { RotatingLogo } from "./RotatingLogo";

const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services & Products" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { location } = useRouterState();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-border/60 py-2" : "bg-transparent py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link to="/">
          <RotatingLogo />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="px-4 py-2 text-sm font-medium text-charcoal/80 hover:text-primary-deep transition-colors rounded-full"
              activeProps={{ className: "text-primary-deep bg-secondary" }}
            >
              {n.label}
            </Link>
          ))}
          <Link
            to="/contact"
            className="ml-3 inline-flex items-center rounded-full bg-primary-deep px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant hover:bg-primary transition"
          >
            Request a Quote
          </Link>
        </nav>

        <button
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden mx-4 mt-2 rounded-2xl border border-border bg-card p-3 shadow-elegant">
          <nav className="flex flex-col">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-xl px-4 py-3 text-base font-medium text-charcoal/85 hover:bg-secondary"
                activeProps={{ className: "bg-secondary text-primary-deep" }}
              >
                {n.label}
              </Link>
            ))}
            <Link
              to="/contact"
              className="mt-2 rounded-xl bg-primary-deep px-4 py-3 text-center text-base font-semibold text-primary-foreground"
            >
              Request a Quote
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
