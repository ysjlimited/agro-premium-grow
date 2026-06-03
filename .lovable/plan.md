## Phase A — Real email delivery + public API endpoints + UI polish

**Prerequisite (one-time, you do this):** click the **Set up email domain** button below. You'll be guided through adding 2 DNS records to a domain you own (e.g. `ysjpoultry.com`). Once verified, emails to `ysjlimitedbroilerfarm@gmail.com` will be delivered for real (no more `mailto:`).

After that's set up, I'll:

1. **Public HTTP endpoints (new)** — for external callers / no-JS forms:
   - `POST /api/contact` — Zod-validates payload, inserts into `contact_submissions`, emails the team, returns `{ ok, id }`.
   - `POST /api/newsletter` — same pattern, inserts into `newsletter_subscriptions`, emails the team.
   - Internally both reuse the existing `submitContact` / `subscribeNewsletter` server-fn logic so the existing in-app forms keep working unchanged.
2. **Real email send** — switch `sendOwnerNotification` from "Lovable Email API best-effort" to the proper Lovable transactional template pipeline (sender = your verified domain, to = `ysjlimitedbroilerfarm@gmail.com`). Adds a "Contact form" and "Newsletter signup" branded email template.
3. **UI cleanup verification** — confirm the banner is present on About / Services / Contact (already done) and that the "Animal feeds" column on Home is gone (already done). Nothing else to change here unless you spot a page that's missing it.
4. **Footer button** — add **Admin Dashboard** link in the footer pointing to `/auth` (or `/admin` when signed in).

---

## Phase B — Multi-role Management Portal (begins after Phase A is green)

A separate, password-protected area at `/admin` (under TanStack `_authenticated` layout). Built incrementally — I'll ship it in three sub-phases so you can review after each.

### B1 — Auth + roles foundation

- Email/password sign-in + Google sign-in (`/auth` page).
- `profiles` table (display name, avatar, role).
- `user_roles` table with enum `admin | md | supervisor | officer` and a `has_role()` security-definer function.
- Trigger to auto-create profile on signup.
- First user is auto-promoted to `admin`; subsequent users default to `officer` and must be promoted from the Staff Roster page.
- `/admin` shell: sidebar nav, role-aware menu items, sign-out.

### B2 — Submissions + daily logs + weekly compiler

- **Submissions inbox** — paginated list of `contact_submissions` and `newsletter_subscriptions` with search/export to CSV. (Admin / MD only.)
- **Daily field log** — officers submit per-shift entries: house ID, mortality, feed consumed kg, water L, weight sample, notes. RLS so officers see only their own; supervisors+ see all.
- **Weekly compiler** — supervisors aggregate a week's daily logs into one row (totals, averages, FCR, deltas vs target). One-click "Generate AI strategy insight" calls Lovable AI Gateway (`google/gemini-2.5-flash`) and stores the markdown insight + supervisor comment alongside the compiled row.

### B3 — AI advisor + admin tools

- **AI advisor chat** — sidebar chat against the farm's recent metrics; persists conversations per user.
- **Staff roster** (admin/MD only) — list users, change role, reset password (email magic link), deactivate account.
- **System diagnostics** (admin only) — connection health check, last 50 email send-log rows, recent error log, link to download a bootstrap SQL script.

---

## Technical notes

- **Stack stays the same:** TanStack Start + Supabase via Lovable Cloud. New backend logic = `createServerFn` (app-internal) or server routes under `src/routes/api/public/*` (external HTTP). No Edge Functions.
- **Email:** Lovable Email's queue-based transactional pipeline (`scaffold_transactional_email`) with one React Email template per use case. The owner notification address `ysjlimitedbroilerfarm@gmail.com` stays as the recipient; the **sender** must be from your verified domain (the dialog handles this).
- **AI:** `LOVABLE_API_KEY` is already in secrets — no extra key needed for the AI advisor.
- **RLS:** Every new table gets explicit GRANTs + RLS scoped via `has_role(auth.uid(), 'role')`. Roles never stored on `profiles`.
- **Scope guard:** I will **not** rebuild the public marketing site (the YSK prompt you pasted) — that prompt was treated as a description of the dashboard, but you've confirmed you actually want the Management Portal. Public site stays as-is.

---

## What I need from you to start

1. Click the button below to set up the email sender domain (Phase A blocker).
2. After that's done, just say "go" and I'll ship Phase A end-to-end, then pause for review before starting B1.

<presentation-actions>
<presentation-open-email-setup>Set up email domain</presentation-open-email-setup>
</presentation-actions>
