import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { NavBar } from "@/components/NavBar";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold">404</h1>
        <p className="mt-3 text-muted-foreground">This page doesn't exist.</p>
        <a
          href="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || "Unexpected error."}
        </p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Meridian FX — Global Currency Converter & Rate Analytics" },
      {
        name: "description",
        content:
          "Convert currencies at live mid-market rates, track historical charts, save favorite pairs, get AI-powered market insights and rate alerts.",
      },
      { property: "og:title", content: "Meridian FX — Global Currency Converter & Rate Analytics" },
      {
        property: "og:description",
        content: "Live rates, historical charts, alerts, and AI insights for 30+ currencies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Meridian FX — Global Currency Converter & Rate Analytics" },
      { name: "description", content: "Global Currency Hub is a full-stack web app for currency conversion, exchange rate analytics, and financial insights." },
      { property: "og:description", content: "Global Currency Hub is a full-stack web app for currency conversion, exchange rate analytics, and financial insights." },
      { name: "twitter:description", content: "Global Currency Hub is a full-stack web app for currency conversion, exchange rate analytics, and financial insights." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/3Jm4mZuKTsXUi619i4hDEiCfRQ52/social-images/social-1782988004712-images.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/3Jm4mZuKTsXUi619i4hDEiCfRQ52/social-images/social-1782988004712-images.webp" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <Outlet />
      </div>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
