"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { MotionConfig } from "framer-motion";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } },
      }),
  );
  return (
    <SessionProvider>
      <QueryClientProvider client={client}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <MotionConfig reducedMotion="user">
            {children}
            <Toaster position="top-right" toastOptions={{ className: "font-sans" }} />
          </MotionConfig>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
