import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, LineChart, ShieldCheck, Sparkles, Bell } from "lucide-react";
import { ConverterCard } from "@/components/ConverterCard";
import { getMarketMovers } from "@/lib/rates.functions";
import { getCurrency } from "@/lib/currencies";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const moversFn = useServerFn(getMarketMovers);
  const { data } = useQuery({
    queryKey: ["movers", "USD"],
    queryFn: () => moversFn({ data: { base: "USD" } }),
    staleTime: 5 * 60_000,
  });

  const topGainers = data
    ? [...data.movers].sort((a, b) => b.changePct - a.changePct).slice(0, 4)
    : [];
  const topLosers = data
    ? [...data.movers].sort((a, b) => a.changePct - b.changePct).slice(0, 4)
    : [];

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="absolute inset-0 -z-10 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(60% 40% at 20% 0%, oklch(0.94 0.05 220 / 0.9), transparent), radial-gradient(50% 40% at 100% 0%, oklch(0.96 0.04 155 / 0.8), transparent)",
          }}
        />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-success" /> Live ECB mid-market rates
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Convert currencies with{" "}
              <span className="text-primary">clarity</span>.
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
              Real-time exchange rates for 30+ currencies. Track history, save favorite pairs, and
              get AI-powered insights — all in one clean workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-soft transition hover:bg-primary/90"
              >
                Get started free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium hover:bg-secondary"
              >
                Open dashboard
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              {[
                ["30+", "Currencies"],
                ["Live", "ECB rates"],
                ["5Y", "History"],
                ["AI", "Insights"],
              ].map(([a, b]) => (
                <div key={b}>
                  <div className="font-display text-2xl font-semibold">{a}</div>
                  <div className="text-xs text-muted-foreground">{b}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:pl-6">
            <ConverterCard />
          </div>
        </div>
      </section>

      {/* Market snapshot */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold">7-day market snapshot</h2>
            <p className="text-sm text-muted-foreground">Movements vs USD over the last week</p>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <MoverCard title="Top gainers" items={topGainers} positive />
          <MoverCard title="Top losers" items={topLosers} />
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/60 bg-secondary/40">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-semibold">Everything you need for FX</h2>
          <p className="mt-2 text-muted-foreground">
            A focused toolkit for travelers, freelancers, and finance teams.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<LineChart className="h-5 w-5" />}
              title="Historical charts"
              body="Compare pairs across 1W to 5Y with interactive charts."
            />
            <FeatureCard
              icon={<Bell className="h-5 w-5" />}
              title="Rate alerts"
              body="Get notified when a pair crosses your target threshold."
            />
            <FeatureCard
              icon={<Sparkles className="h-5 w-5" />}
              title="AI insights"
              body="Plain-English market analysis and buy/sell/hold signals."
            />
            <FeatureCard
              icon={<ShieldCheck className="h-5 w-5" />}
              title="Private & secure"
              body="Your history and favorites are protected with row-level security."
            />
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Meridian FX. Rates provided by the European Central Bank.</p>
          <p>For informational purposes only — not financial advice.</p>
        </div>
      </footer>
    </main>
  );
}

function MoverCard({
  title,
  items,
  positive,
}: {
  title: string;
  items: Array<{ code: string; rate: number; changePct: number }>;
  positive?: boolean;
}) {
  return (
    <div className="surface-card p-5">
      <h3 className="mb-4 font-display text-sm font-semibold text-muted-foreground">{title}</h3>
      <ul className="space-y-3">
        {items.length === 0 && (
          <li className="text-sm text-muted-foreground">Loading market data…</li>
        )}
        {items.map((m) => {
          const cur = getCurrency(m.code);
          const up = m.changePct >= 0;
          return (
            <li key={m.code} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cur.flag}</span>
                <div>
                  <div className="font-display text-sm font-semibold">{cur.code}</div>
                  <div className="text-xs text-muted-foreground">{cur.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="num text-sm font-medium">{m.rate.toFixed(4)}</div>
                <div
                  className={`num text-xs font-semibold ${
                    up ? "text-success" : "text-destructive"
                  }`}
                >
                  {up ? "+" : ""}
                  {m.changePct.toFixed(2)}%
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="sr-only">{positive ? "gainers" : "losers"}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="font-display text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
