"use client";

import { ThemeProvider } from "next-themes";
import { UIStateProvider } from "../components/ui-state";

export default function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <UIStateProvider>{children}</UIStateProvider>
    </ThemeProvider>
  );
}
