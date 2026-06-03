import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ----- Roles -----
export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: roles }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase.from("profiles").select("display_name,avatar_url").eq("user_id", userId).maybeSingle(),
    ]);
    return {
      userId,
      roles: (roles ?? []).map((r) => r.role as string),
      profile: profile ?? null,
    };
  });

// ----- KPIs -----
export const getDashboardStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("log_date,mortality,feed_bags,birds_harvested,sales,expenses,opening_stock")
      .gte("log_date", since)
      .order("log_date", { ascending: true });

    const rows = logs ?? [];
    const totalMortality = rows.reduce((s, r) => s + (r.mortality ?? 0), 0);
    const totalFeedBags = rows.reduce((s, r) => s + Number(r.feed_bags ?? 0), 0);
    const totalSales = rows.reduce((s, r) => s + Number(r.sales ?? 0), 0);
    const totalExpenses = rows.reduce((s, r) => s + Number(r.expenses ?? 0), 0);
    const totalHarvested = rows.reduce((s, r) => s + (r.birds_harvested ?? 0), 0);
    const latestStock = rows.length ? rows[rows.length - 1].opening_stock ?? 0 : 0;
    const activeFlock = Math.max(0, latestStock - totalMortality - totalHarvested);

    // Group by date for chart
    const byDate = new Map<string, { date: string; mortality: number; feed: number; sales: number }>();
    for (const r of rows) {
      const d = r.log_date;
      const e = byDate.get(d) ?? { date: d, mortality: 0, feed: 0, sales: 0 };
      e.mortality += r.mortality ?? 0;
      e.feed += Number(r.feed_bags ?? 0);
      e.sales += Number(r.sales ?? 0);
      byDate.set(d, e);
    }

    return {
      activeFlock,
      totalMortality,
      totalFeedBags,
      totalSales,
      totalExpenses,
      profit: totalSales - totalExpenses,
      mortalityRate: latestStock ? (totalMortality / latestStock) * 100 : 0,
      trend: Array.from(byDate.values()),
    };
  });

// ----- Daily logs -----
const dailyLogSchema = z.object({
  log_date: z.string().min(8),
  shift: z.enum(["morning", "afternoon", "evening"]),
  house_id: z.string().min(1).max(50),
  opening_stock: z.number().int().min(0),
  mortality: z.number().int().min(0),
  birds_harvested: z.number().int().min(0),
  feed_bags: z.number().min(0),
  water_liters: z.number().min(0),
  weight_sample_g: z.number().nullable().optional(),
  expenses: z.number().min(0),
  sales: z.number().min(0),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const createDailyLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => dailyLogSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error, data: row } = await supabase
      .from("daily_logs")
      .insert({ ...data, officer_id: userId, notes: data.notes || null })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const listDailyLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .order("log_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const addSupervisorComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), comment: z.string().max(2000) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("daily_logs")
      .update({ supervisor_comment: data.comment })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Weekly summaries -----
export const listWeeklySummaries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("weekly_summaries")
      .select("*")
      .order("week_start", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const compileWeeklySummary = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        week_start: z.string(),
        week_end: z.string(),
        house_id: z.string().optional(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let q = supabase
      .from("daily_logs")
      .select("mortality,feed_bags,birds_harvested,sales,expenses,weight_sample_g")
      .gte("log_date", data.week_start)
      .lte("log_date", data.week_end);
    if (data.house_id) q = q.eq("house_id", data.house_id);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const r = rows ?? [];
    const total_mortality = r.reduce((s, x) => s + (x.mortality ?? 0), 0);
    const total_feed_bags = r.reduce((s, x) => s + Number(x.feed_bags ?? 0), 0);
    const total_harvested = r.reduce((s, x) => s + (x.birds_harvested ?? 0), 0);
    const total_sales = r.reduce((s, x) => s + Number(x.sales ?? 0), 0);
    const total_expenses = r.reduce((s, x) => s + Number(x.expenses ?? 0), 0);
    const weights = r.map((x) => Number(x.weight_sample_g)).filter((n) => !isNaN(n) && n > 0);
    const avg_weight_g = weights.length ? weights.reduce((a, b) => a + b, 0) / weights.length : null;
    const total_weight_kg = total_harvested && avg_weight_g ? (total_harvested * avg_weight_g) / 1000 : null;
    const total_feed_kg = total_feed_bags * 25; // assume 25kg bag
    const fcr = total_weight_kg && total_weight_kg > 0 ? total_feed_kg / total_weight_kg : null;

    // AI insight
    let ai_insight = "AI insight unavailable.";
    const apiKey = process.env.LOVABLE_API_KEY;
    if (apiKey) {
      try {
        const prompt = `You are a poultry farm consultant. Given this week's broiler data, provide a concise (max 180 words) strategy insight in markdown:
- Mortality: ${total_mortality}
- Feed bags (25kg): ${total_feed_bags}
- Harvested: ${total_harvested}
- Avg weight (g): ${avg_weight_g?.toFixed(0) ?? "n/a"}
- FCR: ${fcr?.toFixed(2) ?? "n/a"}
- Sales: ₦${total_sales}
- Expenses: ₦${total_expenses}
- Profit: ₦${total_sales - total_expenses}`;
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
          }),
        });
        if (res.ok) {
          const j = await res.json();
          ai_insight = j.choices?.[0]?.message?.content ?? ai_insight;
        }
      } catch (e) {
        console.error("AI insight error", e);
      }
    }

    const { data: row, error: insErr } = await supabase
      .from("weekly_summaries")
      .insert({
        week_start: data.week_start,
        week_end: data.week_end,
        house_id: data.house_id || null,
        total_mortality,
        total_feed_bags,
        total_harvested,
        total_sales,
        total_expenses,
        avg_weight_g,
        fcr,
        ai_insight,
        compiled_by: userId,
      })
      .select()
      .single();
    if (insErr) throw new Error(insErr.message);
    return row;
  });

// ----- Submissions -----
export const listSubmissions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [c, n] = await Promise.all([
      supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("newsletter_subscriptions").select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    return { contacts: c.data ?? [], newsletters: n.data ?? [] };
  });

// ----- Staff roster -----
export const listStaff = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("user_id,role");
    const byUser = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = byUser.get(r.user_id) ?? [];
      arr.push(r.role as string);
      byUser.set(r.user_id, arr);
    }
    return (profiles ?? []).map((p) => ({ ...p, roles: byUser.get(p.user_id) ?? [] }));
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        user_id: z.string().uuid(),
        role: z.enum(["admin", "md", "supervisor", "officer"]),
        action: z.enum(["add", "remove"]),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Verify caller is admin/md
    const { data: callerRoles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const isAdmin = (callerRoles ?? []).some((r) => r.role === "admin" || r.role === "md");
    if (!isAdmin) throw new Error("Only admin/MD can change roles");

    if (data.action === "add") {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.user_id, role: data.role });
      if (error && !String(error.message).toLowerCase().includes("duplicate"))
        throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.user_id)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

// ----- AI advisor -----
export const aiAdvise = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z
      .object({
        messages: z.array(
          z.object({ role: z.enum(["user", "assistant", "system"]), content: z.string().min(1).max(8000) }),
        ).min(1).max(40),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI not configured");

    // Pull last 30 days metrics for context
    const { supabase } = context;
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const { data: rows } = await supabase
      .from("daily_logs")
      .select("log_date,house_id,mortality,feed_bags,birds_harvested,sales,expenses")
      .gte("log_date", since);

    const metrics = (rows ?? []).reduce(
      (acc, r) => {
        acc.mortality += r.mortality ?? 0;
        acc.feed += Number(r.feed_bags ?? 0);
        acc.sales += Number(r.sales ?? 0);
        acc.expenses += Number(r.expenses ?? 0);
        acc.harvested += r.birds_harvested ?? 0;
        return acc;
      },
      { mortality: 0, feed: 0, sales: 0, expenses: 0, harvested: 0 },
    );

    const systemMsg = {
      role: "system" as const,
      content: `You are the AI advisor for YSJ Limited Broiler Farm in Ibadan, Nigeria. Be concise, practical and Nigeria-context aware (Naira, local feed brands like Top Feeds, Vital, Hybrid). Last 30 days metrics: Mortality ${metrics.mortality}, Feed bags ${metrics.feed}, Harvested ${metrics.harvested}, Sales ₦${metrics.sales}, Expenses ₦${metrics.expenses}.`,
    };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [systemMsg, ...data.messages],
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway error", res.status, t);
      throw new Error("AI gateway error");
    }
    const j = await res.json();
    return { content: j.choices?.[0]?.message?.content ?? "" };
  });
