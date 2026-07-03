import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const CodeSchema = z.string().regex(/^[A-Z]{3}$/);

/* ---------- Favorites ---------- */
export const listFavorites = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("favorites")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const addFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ from: CodeSchema, to: CodeSchema }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("favorites")
      .insert({ user_id: context.userId, from_currency: data.from, to_currency: data.to });
    if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    return { ok: true };
  });

export const removeFavorite = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("favorites").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Conversion history ---------- */
export const listConversions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("conversions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data;
  });

export const logConversion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        from: CodeSchema,
        to: CodeSchema,
        amount: z.number().positive(),
        rate: z.number().positive(),
        result: z.number().positive(),
      })
      .parse(input)
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("conversions").insert({
      user_id: context.userId,
      from_currency: data.from,
      to_currency: data.to,
      amount: data.amount,
      rate: data.rate,
      result: data.result,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const clearConversions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase.from("conversions").delete().eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ---------- Alerts ---------- */
export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        from: CodeSchema,
        to: CodeSchema,
        threshold: z.number().positive(),
        direction: z.enum(["above", "below"]),
      })
      .parse(input)
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("alerts").insert({
      user_id: context.userId,
      from_currency: data.from,
      to_currency: data.to,
      threshold: data.threshold,
      direction: data.direction,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const toggleAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid(), active: z.boolean() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("alerts").update({ active: data.active }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("alerts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
