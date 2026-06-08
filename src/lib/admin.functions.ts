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

// ============================================================
// BATCHES
// ============================================================
const batchSchema = z.object({
  name: z.string().min(1).max(120),
  breed: z.string().max(80).optional().or(z.literal("")),
  start_date: z.string().min(8),
  bird_count: z.number().int().min(0),
  status: z.enum(["active", "harvested", "closed"]).default("active"),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const listBatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("batches").select("*").order("start_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => batchSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("batches")
      .insert({ ...data, breed: data.breed || null, notes: data.notes || null, created_by: context.userId })
      .select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), patch: batchSchema.partial() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("batches").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("batches").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// STOCK ITEMS
// ============================================================
const stockSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.enum(["feed", "medication", "equipment", "supplies", "other"]).default("feed"),
  quantity: z.number().min(0),
  unit: z.string().min(1).max(30),
  reorder_level: z.number().min(0).default(0),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export const listStock = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("stock_items").select("*").order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => stockSchema.parse(i))
  .handler(async ({ data, context }) => {
    const { error, data: row } = await context.supabase
      .from("stock_items")
      .insert({ ...data, notes: data.notes || null, created_by: context.userId })
      .select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), patch: stockSchema.partial() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stock_items").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("stock_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// DAILY LOG: update, delete, signed photo URL
// ============================================================
export const updateDailyLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      id: z.string().uuid(),
      patch: dailyLogSchema.partial().extend({
        photo_url: z.string().max(500).nullable().optional(),
        batch_id: z.string().uuid().nullable().optional(),
      }),
    }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("daily_logs").update(data.patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteDailyLog = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("daily_logs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const signFarmPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ path: z.string().min(1).max(500) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: s, error } = await context.supabase.storage
      .from("farm-photos").createSignedUrl(data.path, 60 * 60);
    if (error) throw new Error(error.message);
    return { url: s.signedUrl };
  });

// ============================================================
// STAFF ADMIN — only Main Admin can manage staff
// ============================================================
async function assertMainAdmin(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Only the Main Admin can manage staff.");
}

export const adminCreateStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      email: z.string().email().max(255),
      password: z.string().min(8).max(72),
      display_name: z.string().min(1).max(120),
      role: z.enum(["supervisor", "officer"]).default("officer"),
    }).parse(i))
  .handler(async ({ data, context }) => {
    await assertMainAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { display_name: data.display_name },
    });
    if (error) throw new Error(error.message);
    // Trigger creates default 'officer' role. Add chosen role if different.
    if (data.role !== "officer") {
      await supabaseAdmin.from("user_roles").insert({ user_id: created.user!.id, role: data.role });
    }
    return { ok: true, user_id: created.user!.id };
  });

export const adminResetStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ user_id: z.string().uuid(), new_password: z.string().min(8).max(72) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertMainAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, { password: data.new_password });
    if (error) throw new Error(error.message);

    // Audit log entry for password reset
    await supabaseAdmin.from("audit_logs").insert({
      actor_id: context.userId,
      action: "password_reset",
      target_id: data.user_id,
      target_type: "staff",
      details: { reason: "Admin initiated password reset via Staff Roster" },
    });

    return { ok: true };
  });

export const adminUpdateStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      user_id: z.string().uuid(),
      display_name: z.string().min(1).max(120).optional(),
      email: z.string().email().max(255).optional(),
    }).parse(i))
  .handler(async ({ data, context }) => {
    await assertMainAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.email) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, { email: data.email });
      if (error) throw new Error(error.message);
    }
    if (data.display_name) {
      await supabaseAdmin.from("profiles").update({ display_name: data.display_name }).eq("user_id", data.user_id);
    }
    return { ok: true };
  });

export const adminDeleteStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ user_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertMainAdmin(context.supabase, context.userId);
    if (data.user_id === context.userId) throw new Error("You cannot delete your own account.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============================================================
// ARRIVALS — quick increments
// ============================================================
export const addStockArrival = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), delta: z.number().min(0.0001).max(1_000_000) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error: e1 } = await context.supabase
      .from("stock_items").select("quantity").eq("id", data.id).single();
    if (e1) throw new Error(e1.message);
    const next = Number(row.quantity) + data.delta;
    const { error } = await context.supabase.from("stock_items").update({ quantity: next }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, quantity: next };
  });

export const addBatchBirds = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), delta: z.number().int().min(1).max(1_000_000) }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: row, error: e1 } = await context.supabase
      .from("batches").select("bird_count").eq("id", data.id).single();
    if (e1) throw new Error(e1.message);
    const next = Number(row.bird_count) + data.delta;
    const { error } = await context.supabase.from("batches").update({ bird_count: next }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true, bird_count: next };
  });

// ============================================================
// REPORT — aggregate daily logs in a date range
// ============================================================
export const getReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      start: z.string().min(8),
      end: z.string().min(8),
      bucket: z.enum(["day", "week", "month"]).default("day"),
    }).parse(i))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("daily_logs")
      .select("log_date,house_id,opening_stock,mortality,birds_harvested,feed_bags,water_liters,expenses,sales,notes")
      .gte("log_date", data.start)
      .lte("log_date", data.end)
      .order("log_date", { ascending: true });
    if (error) throw new Error(error.message);
    const r = rows ?? [];

    const keyOf = (d: string) => {
      if (data.bucket === "day") return d;
      const dt = new Date(d);
      if (data.bucket === "month") return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
      // week: ISO week starting Monday
      const day = dt.getUTCDay() || 7;
      dt.setUTCDate(dt.getUTCDate() - day + 1);
      return dt.toISOString().slice(0, 10);
    };

    const groups = new Map<string, any>();
    for (const x of r) {
      const k = keyOf(x.log_date);
      const g = groups.get(k) ?? { period: k, mortality: 0, harvested: 0, feed_bags: 0, water_liters: 0, expenses: 0, sales: 0, entries: 0 };
      g.mortality += x.mortality ?? 0;
      g.harvested += x.birds_harvested ?? 0;
      g.feed_bags += Number(x.feed_bags ?? 0);
      g.water_liters += Number(x.water_liters ?? 0);
      g.expenses += Number(x.expenses ?? 0);
      g.sales += Number(x.sales ?? 0);
      g.entries += 1;
      groups.set(k, g);
    }
    const periods = Array.from(groups.values()).sort((a, b) => a.period.localeCompare(b.period))
      .map((g) => ({ ...g, profit: g.sales - g.expenses }));

    const totals = periods.reduce(
      (a, g) => ({
        mortality: a.mortality + g.mortality, harvested: a.harvested + g.harvested,
        feed_bags: a.feed_bags + g.feed_bags, water_liters: a.water_liters + g.water_liters,
        expenses: a.expenses + g.expenses, sales: a.sales + g.sales, profit: a.profit + g.profit,
        entries: a.entries + g.entries,
      }),
      { mortality: 0, harvested: 0, feed_bags: 0, water_liters: 0, expenses: 0, sales: 0, profit: 0, entries: 0 },
    );

    return { periods, totals, rows: r };
  });
