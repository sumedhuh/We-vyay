"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: ReactNode }) {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    const orig = console.error;
    console.error = (...args: unknown[]) => {
      if (typeof args[0] === "string") {
        if (args[0].includes("Encountered a script tag")) return;
        if (args[0].includes("Attempted to synchronously unmount a root while React was already rendering")) return;
        if (args[0].includes("Computed radius is NaN")) return;
        if (args[0].includes("Computed min/max have NaN values")) return;
        if (args[0].includes("removeChild")) return;
      }
      orig.apply(console, args);
    };
  }
  // One stable QueryClient per browser session — server state lives here.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="vyay-theme"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
}
