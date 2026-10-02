"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="icon-button"
        aria-label="Switch to dark mode"
        disabled
      >
        <Moon size={16} />
      </button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      className="icon-button"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
