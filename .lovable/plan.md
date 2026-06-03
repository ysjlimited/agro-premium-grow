
## YSJ Limited Broiler Farm — Build Plan

The project is on **TanStack Start + React + Tailwind v4** (not plain HTML). I'll implement the spec as React routes/components — same visual design, same content, same interactions — and keep everything fully responsive and SEO-ready.

### Design System (src/styles.css)
- Primary: deep emerald `oklch(0.38 0.11 150)`; accent: warm amber/gold `oklch(0.78 0.15 75)`; background: ivory `oklch(0.98 0.01 85)`; foreground: charcoal `oklch(0.22 0.02 250)`.
- Fonts via Google Fonts: **Space Grotesk** (display), **Inter** (body), **JetBrains Mono** (numbers).
- Tokens for subtle shadows, hairline borders, generous py-24 sections, rounded-2xl.

### Assets
Upload all 8 user images (Logo, Hero, banner, brooding, image 2, Cashew, corn, Mr. Sam, Madam YSJ) via `lovable-assets create` from `/mnt/user-uploads/` so they're served from the CDN.

### Routes (TanStack file-based, each with its own `head()` for SEO)
- `src/routes/__root.tsx` — add Google Fonts link, sitewide meta defaults, shared Header (glassmorphic sticky nav, mobile hamburger, rotating logo) + Footer + Floating WhatsApp button + Scroll-to-top + Preloader. `<Outlet />` preserved.
- `src/routes/index.tsx` — Home: split hero, animated counter stats, farm-to-table timeline, alternating "why choose us" rows, services preview cards, masonry gallery, final CTA.
- `src/routes/about.tsx` — story, mission/vision, leadership cards (Madam MD + Mr. Sam with uploaded photos), facilities/biosecurity, 2016→present timeline.
- `src/routes/services.tsx` — filter tabs (Poultry, Feeds, Cash Crops, Farm Services), product cards (Broilers, Brooding, Wholesale, Feeds, Cashew, Maize), and the **Broiler Feed & Profit Estimator** calculator (batch size + target age → feed needed, expected weight, projected profit).
- `src/routes/contact.tsx` — contact form (Zod-validated, mailto fallback), phone/WhatsApp/email links, Google Maps iframe embed for Akobo Ibadan, business hours, socials.

### Shared Components (src/components/)
`Header.tsx`, `Footer.tsx`, `RotatingLogo.tsx` (360° spin on click), `WhatsAppFab.tsx` (links to `https://wa.me/2349131201229`), `ScrollToTop.tsx`, `Preloader.tsx`, `AnimatedCounter.tsx` (IntersectionObserver + JetBrains Mono), `Reveal.tsx` (fade-up on scroll using IntersectionObserver — keeps bundle light vs AOS/GSAP), `MasonryGallery.tsx`, `FeedEstimator.tsx`.

### Interactions
- Smooth scroll (`scroll-behavior: smooth`).
- Scroll-triggered fade/slide-up via a small IntersectionObserver hook (no extra deps).
- Hover lift/scale via Tailwind utilities.
- Logo rotates on click via a CSS keyframe toggled with state.
- Sticky navbar switches to glass/blur after scrollY > 20.

### SEO / Performance
- Per-route `head()` with title, description, og:title, og:description; hero image as `og:image` on Home (leaf only).
- Semantic landmarks (`<header>`, `<main>`, `<section>`, `<footer>`); single H1 per page; alt text on every image; `loading="lazy"` on non-hero images.
- JSON-LD `LocalBusiness` (Organization) on root with name, address, phone, email.
- Favicon set to the YSJ logo asset.

### Contact info wired everywhere
- Phone/WhatsApp: `09131201229` (intl `+2349131201229`)
- Email: `ysjlimitedbroilerfarm@gmail.com`
- Address: Road 5, Lamona, Oluhunda Akobo, Ibadan, Nigeria

### Out of scope / notes
- The user's spec says "HTML5 + vanilla JS"; this project is React/TanStack. The visual result will match exactly — please confirm if you'd rather I scaffold a separate static HTML build instead.
- No backend needed; the contact form will open the user's mail client via `mailto:` with prefilled subject/body. Say the word if you'd prefer real email delivery (I'd enable Lovable Cloud + a server function).
