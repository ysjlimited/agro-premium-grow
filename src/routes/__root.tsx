import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import logo from "@/assets/logo.png.asset.json";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-primary-deep">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link to="/" className="inline-flex items-center justify-center rounded-full bg-primary-deep px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Try refreshing.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="rounded-full bg-primary-deep px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary"
          >
            Try again
          </button>
          <a href="/" className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold">Go home</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "YSJ Limited Broiler Farm — Premium Poultry & Agro, Ibadan" },
      { name: "description", content: "Commercial broiler production, poultry brooding, animal feeds, cashew and maize. Hygienic, professionally managed agro supply from Ibadan, Nigeria since 2016." },
      { name: "author", content: "YSJ Limited Broiler Farm" },
      { name: "theme-color", content: "#1f4d2c" },
      { property: "og:site_name", content: "YSJ Limited Broiler Farm" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "YSJ Limited Broiler Farm — Premium Poultry & Agro, Ibadan" },
      { property: "og:description", content: "Commercial broiler production, poultry brooding, animal feeds, cashew and maize. Hygienic, professionally managed agro supply from Ibadan, Nigeria since 2016." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "YSJ Limited Broiler Farm — Premium Poultry & Agro, Ibadan" },
      { name: "twitter:description", content: "Commercial broiler production, poultry brooding, animal feeds, cashew and maize. Hygienic, professionally managed agro supply from Ibadan, Nigeria since 2016." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/82443446-6f5a-4046-8fa3-1aaeb75bc423" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/82443446-6f5a-4046-8fa3-1aaeb75bc423" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: logo.url },
      { rel: "apple-touch-icon", href: logo.url },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "YSJ Limited Broiler Farm",
          alternateName: "YSJ Poultry & Agro-Farms",
          image: logo.url,
          telephone: "+2349131201229",
          email: "ysjlimitedbroilerfarm@gmail.com",
          address: {
            "@type": "PostalAddress",
            streetAddress: "Road 5, Lamona, Oluhunda Akobo",
            addressLocality: "Ibadan",
            addressRegion: "Oyo",
            addressCountry: "NG",
          },
          foundingDate: "2016",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
