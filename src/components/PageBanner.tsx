import banner from "@/assets/banner.jpg.asset.json";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

/** Reusable hero banner strip rendered at the top of inner pages. */
export function PageBanner({ eyebrow, title, subtitle }: Props) {
  return (
    <section className="relative overflow-hidden">
      <img
        src={banner.url}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-deep/85 via-primary-deep/70 to-primary-deep/40" />
      <div className="relative mx-auto max-w-7xl px-5 lg:px-8 py-24 lg:py-32 text-primary-foreground">
        {eyebrow && (
          <span className="text-xs uppercase tracking-[0.22em] font-semibold text-gold">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-3 font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.05] max-w-3xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-5 text-lg text-primary-foreground/85 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
