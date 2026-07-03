import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CodeSchema = z.string().regex(/^[A-Z]{3}$/);

// Fetch a 30-day series for context so the model has real numbers to reason on.
async function fetch30Day(from: string, to: string) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const s = start.toISOString().slice(0, 10);
  const e = end.toISOString().slice(0, 10);
  const res = await fetch(`https://api.frankfurter.dev/v1/${s}..${e}?base=${from}&symbols=${to}`);
  if (!res.ok) throw new Error("Rate data unavailable");
  const json = (await res.json()) as { rates: Record<string, Record<string, number>> };
  return Object.entries(json.rates)
    .map(([date, r]) => ({ date, value: r[to] }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export const getAiInsight = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ from: CodeSchema, to: CodeSchema }).parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI service unavailable");

    const series = await fetch30Day(data.from, data.to);
    if (series.length < 5) throw new Error("Not enough data");

    const first = series[0].value;
    const last = series[series.length - 1].value;
    const changePct = ((last - first) / first) * 100;
    const values = series.map((p) => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
    const volatility = (Math.sqrt(variance) / mean) * 100;

    const prompt = `You are a currency market analyst. Analyze the ${data.from}/${data.to} pair over the last 30 days.

Metrics:
- Start: ${first.toFixed(4)}
- Current: ${last.toFixed(4)}
- Change: ${changePct.toFixed(2)}%
- 30d high: ${max.toFixed(4)}
- 30d low: ${min.toFixed(4)}
- Volatility: ${volatility.toFixed(2)}%

Return a JSON object exactly like:
{
  "summary": "2-3 sentence plain-English summary of the pair's recent behavior",
  "trend": "bullish" | "bearish" | "neutral",
  "signal": "buy" | "sell" | "hold",
  "volatility": "low" | "medium" | "high",
  "insights": ["3 short bullet insights, each under 15 words"]
}
Return ONLY the JSON. No markdown, no fences.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("Rate limit exceeded. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted.");
    if (!res.ok) throw new Error(`AI error: ${res.status}`);

    const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const raw = json.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/```json\s*|```/g, "").trim();
    let parsed: {
      summary: string;
      trend: "bullish" | "bearish" | "neutral";
      signal: "buy" | "sell" | "hold";
      volatility: "low" | "medium" | "high";
      insights: string[];
    };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = {
        summary: cleaned.slice(0, 300),
        trend: "neutral",
        signal: "hold",
        volatility: "medium",
        insights: [],
      };
    }

    return {
      ...parsed,
      metrics: { first, last, changePct, min, max, volatility },
    };
  });
