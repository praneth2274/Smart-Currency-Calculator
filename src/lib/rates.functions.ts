import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Live rates: open.er-api.com — free, no key, 160+ currencies.
const LIVE = "https://open.er-api.com/v6";
// Historical: Frankfurter (ECB) — free, ~31 currencies.
const HIST = "https://api.frankfurter.dev/v1";

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Rate service error: ${res.status}`);
  return (await res.json()) as T;
}

const CodeSchema = z.string().regex(/^[A-Z]{3}$/);

type LiveResponse = {
  result: string;
  base_code: string;
  time_last_update_utc: string;
  rates: Record<string, number>;
};

export const getLatestRates = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ base: CodeSchema.default("USD") }).parse(input ?? {}))
  .handler(async ({ data }) => {
    const json = await fetchJson<LiveResponse>(`${LIVE}/latest/${data.base}`);
    if (json.result !== "success") throw new Error("Rate service unavailable");
    return {
      base: json.base_code,
      date: json.time_last_update_utc,
      rates: json.rates,
    };
  });

export const convertAmount = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({ from: CodeSchema, to: CodeSchema, amount: z.number().positive().max(1e12) })
      .parse(input)
  )
  .handler(async ({ data }) => {
    if (data.from === data.to) {
      return { rate: 1, result: data.amount, date: new Date().toISOString() };
    }
    const json = await fetchJson<LiveResponse>(`${LIVE}/latest/${data.from}`);
    if (json.result !== "success") throw new Error("Rate service unavailable");
    const rate = json.rates[data.to];
    if (typeof rate !== "number") throw new Error(`Rate for ${data.to} unavailable`);
    return { rate, result: data.amount * rate, date: json.time_last_update_utc };
  });

export const getHistoricalRates = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        from: CodeSchema,
        to: CodeSchema,
        range: z.enum(["1W", "1M", "3M", "6M", "1Y", "5Y"]).default("1M"),
      })
      .parse(input)
  )
  .handler(async ({ data }) => {
    const days = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365, "5Y": 1825 }[data.range];
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    const s = start.toISOString().slice(0, 10);
    const e = end.toISOString().slice(0, 10);
    const json = await fetchJson<{ rates: Record<string, Record<string, number>> }>(
      `${HIST}/${s}..${e}?base=${data.from}&symbols=${data.to}`
    );
    const series = Object.entries(json.rates)
      .map(([date, r]) => ({ date, value: r[data.to] }))
      .filter((p) => typeof p.value === "number")
      .sort((a, b) => a.date.localeCompare(b.date));
    return { series };
  });

// Market movers vs a base currency using week-over-week open.er-api snapshots
export const getMarketMovers = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ base: CodeSchema.default("USD") }).parse(input ?? {}))
  .handler(async ({ data }) => {
    const today = await fetchJson<LiveResponse>(`${LIVE}/latest/${data.base}`);
    if (today.result !== "success") throw new Error("Rate service unavailable");

    // For change %: fetch Frankfurter week-ago snapshot for the codes it supports,
    // then intersect with today's rates. Frankfurter allows a ~30 currency universe.
    const weekAgoDate = new Date(Date.now() - 8 * 864e5).toISOString().slice(0, 10);
    let past: Record<string, number> = {};
    try {
      const hist = await fetchJson<{ rates: Record<string, number> }>(
        `${HIST}/${weekAgoDate}?base=${data.base}`
      );
      past = hist.rates;
    } catch {
      past = {};
    }

    const movers = Object.keys(today.rates).map((code) => {
      const now = today.rates[code];
      const p = past[code];
      const pct = typeof p === "number" && p > 0 ? ((now - p) / p) * 100 : 0;
      return { code, rate: now, changePct: pct };
    });
    return { date: today.time_last_update_utc, base: data.base, movers };
  });
