import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  createAlert,
  deleteAlert,
  listAlerts,
  toggleAlert,
} from "@/lib/user-data.functions";
import { getLatestRates } from "@/lib/rates.functions";
import { CurrencySelect } from "@/components/CurrencySelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Bell, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { getCurrency } from "@/lib/currencies";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({ meta: [{ title: "Alerts — Meridian FX" }] }),
  component: Alerts,
});

function Alerts() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAlerts);
  const createFn = useServerFn(createAlert);
  const toggleFn = useServerFn(toggleAlert);
  const delFn = useServerFn(deleteAlert);
  const ratesFn = useServerFn(getLatestRates);

  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");
  const [threshold, setThreshold] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");

  const { data: alerts } = useQuery({ queryKey: ["alerts"], queryFn: () => listFn({}) });
  const { data: rates } = useQuery({
    queryKey: ["rates", "USD"],
    queryFn: () => ratesFn({ data: { base: "USD" } }),
    refetchInterval: 60_000,
  });

  const rateFor = (f: string, t: string) => {
    if (!rates) return null;
    if (f === "USD") return rates.rates[t];
    if (t === "USD") return 1 / rates.rates[f];
    return rates.rates[t] / rates.rates[f];
  };

  const create = useMutation({
    mutationFn: () =>
      createFn({ data: { from, to, threshold: parseFloat(threshold), direction } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      setThreshold("");
      toast.success("Alert created");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggle = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      toggleFn({ data: { id, active } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Rate alerts</h1>
        <p className="text-sm text-muted-foreground">
          Get notified when a pair crosses your target
        </p>
      </div>

      <div className="surface-card mb-6 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
            <CurrencySelect value={from} onChange={setFrom} />
          </div>
          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
            <CurrencySelect value={to} onChange={setTo} />
          </div>
          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Direction
            </label>
            <div className="flex h-11 gap-1 rounded-lg border border-border bg-background p-1">
              {(["above", "below"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`flex-1 rounded-md text-xs font-semibold ${
                    direction === d
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-1">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Threshold
            </label>
            <Input
              type="number"
              step="0.0001"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g. 0.9500"
              className="h-11"
            />
          </div>
          <div className="lg:col-span-1 flex items-end">
            <Button
              className="h-11 w-full"
              disabled={!threshold || create.isPending || from === to}
              onClick={() => create.mutate()}
            >
              <Plus className="mr-2 h-4 w-4" /> Create
            </Button>
          </div>
        </div>
      </div>

      <div className="surface-card p-2">
        {!alerts || alerts.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Bell className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No alerts yet — create one to get notified when a pair moves.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {alerts.map((a) => {
              const fc = getCurrency(a.from_currency);
              const tc = getCurrency(a.to_currency);
              const rate = rateFor(a.from_currency, a.to_currency);
              const triggered =
                rate != null &&
                (a.direction === "above"
                  ? rate >= Number(a.threshold)
                  : rate <= Number(a.threshold));
              return (
                <li key={a.id} className="flex items-center justify-between p-3 sm:p-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`grid h-10 w-10 place-items-center rounded-full ${
                        triggered && a.active
                          ? "bg-success/15 text-success"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      <Bell className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-display text-sm font-semibold">
                        {fc.flag} {fc.code} → {tc.flag} {tc.code}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Alert when rate is{" "}
                        <span className="font-medium text-foreground">{a.direction}</span>{" "}
                        <span className="num font-medium text-foreground">
                          {Number(a.threshold).toFixed(4)}
                        </span>
                        {rate ? (
                          <>
                            {" "}
                            • currently{" "}
                            <span className="num font-medium text-foreground">
                              {rate.toFixed(4)}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={a.active}
                      onCheckedChange={(v) => toggle.mutate({ id: a.id, active: v })}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(a.id)}
                      aria-label="Delete alert"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
