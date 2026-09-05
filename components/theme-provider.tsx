"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "system" | "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved && (saved === "system" || saved === "light" || saved === "dark")) {
      setThemeState(saved);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (currentTheme: Theme) => {
      const root = document.documentElement;
      let effectiveTheme: "light" | "dark" = "light";

      if (currentTheme === "system") {
        effectiveTheme = media.matches ? "dark" : "light";
      } else {
        effectiveTheme = currentTheme;
      }

      setResolvedTheme(effectiveTheme);

      if (effectiveTheme === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      root.style.colorScheme = effectiveTheme;
    };

    applyTheme(theme);

    const handleMediaChange = () => {
      if (theme === "system") {
        applyTheme("system");
      }
    };

    media.addEventListener("change", handleMediaChange);
    return () => media.removeEventListener("change", handleMediaChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
