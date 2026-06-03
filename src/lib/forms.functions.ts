import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(150),
  message: z.string().trim().min(10).max(2000),
});

const newsletterSchema = z.object({
  email: z.string().trim().email().max(255),
});

const OWNER_EMAIL = "ysjlimitedbroilerfarm@gmail.com";

async function sendOwnerNotification(subject: string, html: string) {
  // Best-effort: only attempts to send when an email domain is configured.
  // Falls back silently so submissions are still captured.
  const apiKey = process.env.LOVABLE_API_KEY;
  if (!apiKey) return { sent: false, reason: "no_api_key" as const };
  try {
    const res = await fetch("https://email.lovable.dev/api/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        to: [{ email: OWNER_EMAIL }],
        subject,
        html_body: html,
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error("Email send failed:", res.status, text);
      return { sent: false, reason: "send_error" as const };
    }
    return { sent: true };
  } catch (err) {
    console.error("Email send threw:", err);
    return { sent: false, reason: "exception" as const };
  }
}

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => contactSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("contact_submissions").insert({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      subject: data.subject,
      message: data.message,
    });
    if (error) {
      console.error("Insert contact failed:", error);
      throw new Error("Could not save your message. Please try again.");
    }

    const html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:560px">
        <h2 style="color:#0b6b3a">New contact form submission — YSJ Limited</h2>
        <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(data.phone || "—")}</p>
        <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
        <hr/>
        <p style="white-space:pre-wrap">${escapeHtml(data.message)}</p>
      </div>
    `;
    const emailResult = await sendOwnerNotification(
      `Contact form: ${data.subject}`,
      html,
    );
    return { ok: true, emailed: emailResult.sent };
  });

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => newsletterSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("newsletter_subscriptions")
      .insert({ email: data.email });
    if (error && !String(error.message).toLowerCase().includes("duplicate")) {
      console.error("Newsletter insert failed:", error);
      throw new Error("Could not subscribe. Please try again.");
    }

    const html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a">
        <h2 style="color:#0b6b3a">New newsletter subscriber</h2>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
      </div>
    `;
    const emailResult = await sendOwnerNotification(
      "New newsletter subscriber — YSJ Limited",
      html,
    );
    return { ok: true, emailed: emailResult.sent };
  });

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
