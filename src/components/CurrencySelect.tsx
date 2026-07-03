import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { CURRENCIES, getCurrency } from "@/lib/currencies";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export function CurrencySelect({
  value,
  onChange,
  disabled,
  filter,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  /** Optional predicate to restrict which currencies appear. */
  filter?: (code: string) => boolean;
}) {
  const [open, setOpen] = useState(false);
  const cur = getCurrency(value);
  const list = filter ? CURRENCIES.filter((c) => filter(c.code)) : CURRENCIES;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className="flex h-14 w-full min-w-[9rem] items-center justify-between gap-2 rounded-xl border border-border bg-secondary/60 px-3 text-left transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="flex items-center gap-2">
            <span className="text-xl leading-none">{cur.flag}</span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-sm font-semibold">{cur.code}</span>
              <span className="truncate text-[11px] text-muted-foreground">{cur.name}</span>
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command
          filter={(itemValue, search) => {
            // itemValue is `${code} ${name}` (lowercased by cmdk)
            return itemValue.includes(search.toLowerCase()) ? 1 : 0;
          }}
        >
          <CommandInput placeholder="Search currency or code…" className="h-11" />
          <CommandList className="max-h-80">
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {list.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.code} ${c.name}`}
                  onSelect={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2"
                >
                  <span className="text-lg">{c.flag}</span>
                  <span className="font-medium">{c.code}</span>
                  <span className="truncate text-xs text-muted-foreground">{c.name}</span>
                  {value === c.code && <Check className="ml-auto h-4 w-4 text-primary" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
