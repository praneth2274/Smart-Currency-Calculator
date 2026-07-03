import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { addFavorite, listFavorites, removeFavorite } from "@/lib/user-data.functions";
import { getLatestRates } from "@/lib/rates.functions";
import { CurrencySelect } from "@/components/CurrencySelect";
import { Button } from "@/components/ui/button";
import { getCurrency } from "@/lib/currencies";
import { Star, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/favorites")({
  head: () => ({ meta: [{ title: "Favorites — Meridian FX" }] }),
  component: Favorites,
});

function Favorites() {
  const qc = useQueryClient();
  const listFn = useServerFn(listFavorites);
  const addFn = useServerFn(addFavorite);
  const rmFn = useServerFn(removeFavorite);
  const ratesFn = useServerFn(getLatestRates);
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("EUR");

  const { data: favs } = useQuery({
    queryKey: ["favorites"],
    queryFn: () => listFn({}),
  });
  const { data: rates } = useQuery({
    queryKey: ["rates", "USD"],
    queryFn: () => ratesFn({ data: { base: "USD" } }),
    refetchInterval: 60_000,
  });

  const add = useMutation({
    mutationFn: () => addFn({ data: { from, to } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success("Pair added to favorites");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => rmFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favorites"] }),
  });

  const rateFor = (f: string, t: string) => {
    if (!rates) return null;
    if (f === "USD") return rates.rates[t];
    if (t === "USD") return 1 / rates.rates[f];
    const usdF = rates.rates[f];
    const usdT = rates.rates[t];
    if (!usdF || !usdT) return null;
    return usdT / usdF;
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Favorite pairs</h1>
        <p className="text-sm text-muted-foreground">Pin currency pairs for one-click access</p>
      </div>

      <div className="surface-card mb-6 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
            <CurrencySelect value={from} onChange={setFrom} />
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
            <CurrencySelect value={to} onChange={setTo} />
          </div>
          <Button onClick={() => add.mutate()} disabled={add.isPending || from === to}>
            <Plus className="mr-2 h-4 w-4" /> Add pair
          </Button>
        </div>
      </div>

      <div className="surface-card p-2">
        {!favs || favs.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Star className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">No favorites yet — add your first pair above.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {favs.map((f) => {
              const fc = getCurrency(f.from_currency);
              const tc = getCurrency(f.to_currency);
              const rate = rateFor(f.from_currency, f.to_currency);
              return (
                <li key={f.id} className="flex items-center justify-between p-3 sm:p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-2xl">
                      <span>{fc.flag}</span>
                      <span className="text-muted-foreground">→</span>
                      <span>{tc.flag}</span>
                    </div>
                    <div>
                      <div className="font-display text-sm font-semibold">
                        {fc.code} / {tc.code}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {fc.name} → {tc.name}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="num font-display text-base font-semibold">
                        {rate ? rate.toFixed(4) : "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">Live rate</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => remove.mutate(f.id)}
                      aria-label="Remove"
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
