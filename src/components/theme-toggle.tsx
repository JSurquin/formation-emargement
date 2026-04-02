"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="relative shrink-0 rounded-full border border-transparent bg-muted/40 text-foreground shadow-sm transition-colors hover:bg-muted dark:border-white/10 dark:bg-gradient-to-r dark:from-indigo-600/40 dark:to-violet-600/40 dark:shadow-indigo-950/40"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      aria-label="Basculer le thème clair ou sombre"
    >
      <Sun className="size-[1.15rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute size-[1.15rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  );
}
