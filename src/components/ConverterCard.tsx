import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight, Loader2, Star } from "lucide-react";
import { CurrencySelect } from "@/components/CurrencySelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { convertAmount } from "@/lib/rates.functions";
import { addFavorite, logConversion } from "@/lib/user-data.functions";
import { formatAmount, getCurrency } from "@/lib/currencies";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ConverterCard({
  defaultFrom = "USD",
  defaultTo = "EUR",
}: {
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const [amount, setAmount] = useState<string>("100");
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [authed, setAuthed] = useState(false);
  const qc = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const numeric = useMemo(() => {
    const n = parseFloat(amount);
    return isFinite(n) && n > 0 ? n : 0;
  }, [amount]);

  const convert = useServerFn(convertAmount);
  const query = useQuery({
    queryKey: ["convert", from, to, numeric],
    queryFn: () => convert({ data: { from, to, amount: numeric } }),
    enabled: numeric > 0 && from !== to,
    staleTime: 60_000,
  });

  const sameCurrency = from === to;
  const rate = sameCurrency ? 1 : query.data?.rate;
  const result = sameCurrency ? numeric : query.data?.result;
  const date = query.data?.date;

  const logFn = useServerFn(logConversion);
  const favFn = useServerFn(addFavorite);
  const logMut = useMutation({ mutationFn: logFn });
  const favMut = useMutation({
    mutationFn: favFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(`Saved ${from} → ${to} to favorites`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleConvert = () => {
    if (!numeric || !rate || result == null) return;
    if (!authed) {
      toast.info("Sign in to save your conversion history");
      return;
    }
    logMut.mutate(
      { data: { from, to, amount: numeric, rate, result } },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["conversions"] });
          toast.success("Conversion saved");
        },
      }
    );
  };

  const toCur = getCurrency(to);
  const fromCur = getCurrency(from);

  return (
    <div className="surface-elevated w-full p-5 sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold">Convert currency</h2>
          <p className="text-xs text-muted-foreground">Live mid-market rates from the ECB</p>
        </div>
        {authed && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => favMut.mutate({ data: { from, to } })}
            disabled={favMut.isPending}
          >
            <Star className="mr-1.5 h-4 w-4" /> Save pair
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">You send</label>
          <div className="flex gap-2">
            <Input
              type="number"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="num h-14 rounded-xl text-lg font-medium"
              min="0"
              step="any"
            />
            <CurrencySelect value={from} onChange={setFrom} />
          </div>
        </div>

        <div className="flex justify-center sm:pb-1">
          <Button
            variant="outline"
            size="icon"
            onClick={swap}
            className="h-11 w-11 rounded-full border-border"
            aria-label="Swap currencies"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">They receive</label>
          <div className="flex gap-2">
            <div className="num flex h-14 flex-1 items-center rounded-xl border border-border bg-secondary/40 px-3 text-lg font-medium">
              {query.isFetching && !query.data ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : result != null ? (
                formatAmount(result, to)
              ) : (
                "—"
              )}
            </div>
            <CurrencySelect value={to} onChange={setTo} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl bg-secondary/50 p-4 sm:flex-row sm:items-center">
        <div className="text-sm">
          <div className="text-muted-foreground">Exchange rate</div>
          <div className="num font-display text-base font-semibold">
            1 {fromCur.code} = {rate ? formatAmount(rate, to) : "—"} {toCur.code}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {date ? `As of ${date}` : "Enter an amount above"}
        </div>
        <Button onClick={handleConvert} disabled={!result || sameCurrency || logMut.isPending}>
          {logMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {authed ? "Save conversion" : "Convert"}
        </Button>
      </div>

      {query.isError && (
        <p className="mt-3 text-sm text-destructive">Couldn't fetch live rates. Please retry.</p>
      )}
    </div>
  );
}
