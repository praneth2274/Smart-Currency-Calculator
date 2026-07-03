import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getAiInsight } from "@/lib/ai-insights.functions";
import { CurrencySelect } from "@/components/CurrencySelect";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingDown, TrendingUp, Minus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getCurrency, HISTORICAL_SUPPORTED } from "@/lib/currencies";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({ meta: [{ title: "AI insights — Meridian FX" }] }),
  component: Insights,
});

function Insights() {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const fn = useServerFn(getAiInsight);

  const analyze = useMutation({
    mutationFn: () => fn({ data: { from, to } }),
    onError: (e) => toast.error((e as Error).message),
  });

  const data = analyze.data;
  const fc = getCurrency(from);
  const tc = getCurrency(to);

  const trendColor =
    data?.trend === "bullish"
      ? "text-success"
      : data?.trend === "bearish"
        ? "text-destructive"
        : "text-muted-foreground";
  const TrendIcon =
    data?.trend === "bullish" ? TrendingUp : data?.trend === "bearish" ? TrendingDown : Minus;

  const signalColor =
    data?.signal === "buy"
      ? "bg-success/15 text-success"
      : data?.signal === "sell"
        ? "bg-destructive/15 text-destructive"
        : "bg-secondary text-muted-foreground";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">AI market insights</h1>
        <p className="text-sm text-muted-foreground">
          Plain-English analysis over the last 30 days, powered by Gemini
        </p>
      </div>

      <div className="surface-card mb-6 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
            <CurrencySelect value={from} onChange={setFrom} filter={(c) => HISTORICAL_SUPPORTED.has(c)} />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
            <CurrencySelect value={to} onChange={setTo} filter={(c) => HISTORICAL_SUPPORTED.has(c)} />
          </div>
          <Button
            onClick={() => analyze.mutate()}
            disabled={analyze.isPending || from === to}
            className="h-11"
          >
            {analyze.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Analyze pair
          </Button>
        </div>
      </div>

      {!data && !analyze.isPending && (
        <div className="surface-card flex flex-col items-center p-14 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold">Ready when you are</h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Pick a currency pair above and click Analyze to receive a market summary, trend,
            volatility rating, and signal.
          </p>
        </div>
      )}

      {analyze.isPending && (
        <div className="surface-card flex items-center justify-center gap-3 p-14 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Analyzing 30 days of data…
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div className="surface-card p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-2xl">
                {fc.flag} → {tc.flag}
              </span>
              <span className="font-display text-lg font-semibold">
                {fc.code}/{tc.code}
              </span>
              <span className={`inline-flex items-center gap-1 text-sm font-semibold ${trendColor}`}>
                <TrendIcon className="h-4 w-4" /> {data.trend}
              </span>
              <span
                className={`ml-auto rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${signalColor}`}
              >
                Signal: {data.signal}
              </span>
            </div>
            <p className="text-base leading-relaxed text-foreground">{data.summary}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="30d start" value={data.metrics.first.toFixed(4)} />
            <MetricCard
              label="Change"
              value={`${data.metrics.changePct >= 0 ? "+" : ""}${data.metrics.changePct.toFixed(2)}%`}
              positive={data.metrics.changePct >= 0}
            />
            <MetricCard label="30d high" value={data.metrics.max.toFixed(4)} />
            <MetricCard label="30d low" value={data.metrics.min.toFixed(4)} />
          </div>

          {data.insights?.length > 0 && (
            <div className="surface-card p-6">
              <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Key insights
              </h3>
              <ul className="space-y-3">
                {data.insights.map((i, idx) => (
                  <li key={idx} className="flex gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="text-sm">{i}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-center text-xs text-muted-foreground">
            AI analysis is informational only — not financial advice.
          </p>
        </div>
      )}
    </main>
  );
}

function MetricCard({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="surface-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={`num mt-1 font-display text-xl font-semibold ${
          positive === undefined ? "" : positive ? "text-success" : "text-destructive"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
