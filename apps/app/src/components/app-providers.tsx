"use client";

import type { ReactNode } from "react";

import QueryProvider from "./query-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ThemeProvider from "./theme-provider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <TooltipProvider delay={300}>
        <QueryProvider>
          {children}
          <Toaster position="bottom-center" />
        </QueryProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
