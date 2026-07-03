import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const links = [
  { to: "/", label: "Converter" },
  { to: "/dashboard", label: "Dashboard", auth: true },
  { to: "/charts", label: "Charts", auth: true },
  { to: "/favorites", label: "Favorites", auth: true },
  { to: "/history", label: "History", auth: true },
  { to: "/alerts", label: "Alerts", auth: true },
  { to: "/insights", label: "AI Insights", auth: true },
];

export function NavBar() {
  const [session, setSession] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(!!s));
    supabase.auth.getSession().then(({ data }) => setSession(!!data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const visible = links.filter((l) => !l.auth || session);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <span className="font-display text-base font-bold">Fx</span>
          </div>
          <div className="hidden flex-col leading-tight sm:flex">
            <span className="font-display text-sm font-semibold tracking-tight">Meridian FX</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Currency Intelligence
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {visible.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <Button variant="ghost" size="sm" onClick={signOut}>
              Sign out
            </Button>
          ) : session === false ? (
            <>
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Button size="sm">Get started</Button>
              </Link>
            </>
          ) : null}
        </div>

        <button
          className="rounded-lg p-2 md:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {visible.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {session ? (
                <Button variant="outline" size="sm" onClick={signOut} className="w-full">
                  Sign out
                </Button>
              ) : (
                <>
                  <Link to="/auth" className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link to="/auth" search={{ mode: "signup" }} className="flex-1">
                    <Button size="sm" className="w-full">
                      Get started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
