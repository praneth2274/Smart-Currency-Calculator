import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { getLatestRates } from "@/lib/rates.functions";
import { CURRENCIES, getCurrency, formatCurrency } from "@/lib/currencies";
import { CurrencySelect } from "@/components/CurrencySelect";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Live rates — Meridian FX" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [base, setBase] = useState("USD");
  const [q, setQ] = useState("");
  const fn = useServerFn(getLatestRates);
  const { data, isFetching, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["rates", base],
    queryFn: () => fn({ data: { base } }),
    refetchInterval: 60_000,
  });

  const rows = useMemo(() => {
    if (!data) return [];
    return CURRENCIES.filter((c) => c.code !== base)
      .map((c) => ({ code: c.code, name: c.name, flag: c.flag, rate: data.rates[c.code] }))
      .filter((r) => typeof r.rate === "number")
      .filter((r) =>
        q.trim()
          ? r.code.toLowerCase().includes(q.toLowerCase()) ||
            r.name.toLowerCase().includes(q.toLowerCase())
          : true
      );
  }, [data, base, q]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Live rates dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Auto-refreshing every 60 seconds
            {data?.date ? ` • ECB reference date ${data.date}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Base</span>
            <div className="w-44">
              <CurrencySelect value={base} onChange={setBase} />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="surface-card p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-background px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search currency…"
            className="h-11 border-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div
              key={r.code}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-background p-4 transition hover:shadow-soft"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{r.flag}</span>
                <div>
                  <div className="font-display text-sm font-semibold">
                    {base}/{r.code}
                  </div>
                  <div className="text-xs text-muted-foreground">{r.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="num font-display text-lg font-semibold">{r.rate.toFixed(4)}</div>
                <div className="text-xs text-muted-foreground">
                  1 {base} = {formatCurrency(r.rate, r.code)}
                </div>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div className="col-span-full py-16 text-center text-sm text-muted-foreground">
              {isFetching ? "Loading rates…" : "No currencies match your search."}
            </div>
          )}
        </div>
      </div>

      {dataUpdatedAt ? (
        <p className="mt-3 text-right text-xs text-muted-foreground">
          Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
        </p>
      ) : null}
      <p className="sr-only">{getCurrency(base).name}</p>
    </main>
  );
}
