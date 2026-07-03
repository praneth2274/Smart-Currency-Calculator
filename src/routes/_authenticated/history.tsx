import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { clearConversions, listConversions } from "@/lib/user-data.functions";
import { getCurrency, formatCurrency } from "@/lib/currencies";
import { Button } from "@/components/ui/button";
import { Download, Trash2, History as HistoryIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — Meridian FX" }] }),
  component: History,
});

function History() {
  const qc = useQueryClient();
  const listFn = useServerFn(listConversions);
  const clearFn = useServerFn(clearConversions);

  const { data } = useQuery({ queryKey: ["conversions"], queryFn: () => listFn({}) });

  const clear = useMutation({
    mutationFn: () => clearFn({}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["conversions"] });
      toast.success("History cleared");
    },
  });

  const exportCsv = () => {
    if (!data?.length) return;
    const csv = [
      "date,from,to,amount,rate,result",
      ...data.map(
        (r) =>
          `${r.created_at},${r.from_currency},${r.to_currency},${r.amount},${r.rate},${r.result}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Conversion history</h1>
          <p className="text-sm text-muted-foreground">Every conversion you've made, in one place</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCsv} disabled={!data?.length}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clear.mutate()}
            disabled={!data?.length || clear.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Clear
          </Button>
        </div>
      </div>

      <div className="surface-card overflow-hidden">
        {!data || data.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <HistoryIcon className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              No conversions yet — try one from the converter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Pair</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-right">Rate</th>
                  <th className="px-4 py-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {data.map((r) => {
                  const fc = getCurrency(r.from_currency);
                  const tc = getCurrency(r.to_currency);
                  return (
                    <tr key={r.id}>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(r.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">
                          {fc.flag} {fc.code} → {tc.flag} {tc.code}
                        </span>
                      </td>
                      <td className="num px-4 py-3 text-right">
                        {formatCurrency(Number(r.amount), fc.code)}
                      </td>
                      <td className="num px-4 py-3 text-right text-muted-foreground">
                        {Number(r.rate).toFixed(4)}
                      </td>
                      <td className="num px-4 py-3 text-right font-semibold">
                        {formatCurrency(Number(r.result), tc.code)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
