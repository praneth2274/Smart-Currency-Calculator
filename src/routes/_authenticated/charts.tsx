import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getHistoricalRates } from "@/lib/rates.functions";
import { HISTORICAL_SUPPORTED } from "@/lib/currencies";
import { CurrencySelect } from "@/components/CurrencySelect";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const RANGES = ["1W", "1M", "3M", "6M", "1Y", "5Y"] as const;
type Range = (typeof RANGES)[number];

export const Route = createFileRoute("/_authenticated/charts")({
  head: () => ({ meta: [{ title: "Historical charts — Meridian FX" }] }),
  component: Charts,
});

function Charts() {
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [range, setRange] = useState<Range>("1M");
  const fn = useServerFn(getHistoricalRates);
  const { data, isFetching } = useQuery({
    queryKey: ["history", from, to, range],
    queryFn: () => fn({ data: { from, to, range } }),
  });

  const stats = useMemo(() => {
    if (!data?.series?.length) return null;
    const values = data.series.map((s) => s.value);
    const first = values[0];
    const last = values[values.length - 1];
    return {
      first,
      last,
      changePct: ((last - first) / first) * 100,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [data]);

  const exportCsv = () => {
    if (!data?.series) return;
    const csv = ["date,rate", ...data.series.map((p) => `${p.date},${p.value}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${from}_${to}_${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Historical charts</h1>
        <p className="text-sm text-muted-foreground">
          Compare pair movements across selectable timeframes. Historical data covers 30 major
          currencies (ECB reference series).
        </p>
      </div>

      <div className="surface-card p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
            <CurrencySelect value={from} onChange={setFrom} filter={(c) => HISTORICAL_SUPPORTED.has(c)} />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
            <CurrencySelect value={to} onChange={setTo} filter={(c) => HISTORICAL_SUPPORTED.has(c)} />
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-background p-1">
            {RANGES.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                  range === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data}>
            <Download className="mr-2 h-4 w-4" /> CSV
          </Button>
        </div>

        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Current" value={stats.last.toFixed(4)} />
            <Stat
              label="Change"
              value={`${stats.changePct >= 0 ? "+" : ""}${stats.changePct.toFixed(2)}%`}
              positive={stats.changePct >= 0}
            />
            <Stat label="Period high" value={stats.max.toFixed(4)} />
            <Stat label="Period low" value={stats.min.toFixed(4)} />
          </div>
        )}

        <div className="mt-6 h-[380px]">
          {isFetching && !data ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading chart…
            </div>
          ) : data?.series?.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.55 0.16 245)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.55 0.16 245)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="oklch(0.92 0.01 240)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "oklch(0.55 0.02 240)" }}
                  minTickGap={40}
                />
                <YAxis
                  domain={["auto", "auto"]}
                  tick={{ fontSize: 11, fill: "oklch(0.55 0.02 240)" }}
                  width={70}
                  tickFormatter={(v: number) => v.toFixed(4)}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid oklch(0.9 0.01 240)",
                    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                  }}
                  formatter={(v: number) => [v.toFixed(6), `${from}/${to}`]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="oklch(0.55 0.16 245)"
                  strokeWidth={2}
                  fill="url(#grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No data available.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background p-4">
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
