"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark" | "auto";

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: "light" | "dark";
  dataSaver: boolean;
  setDataSaver: (v: boolean) => void;
}>({
  theme: "auto",
  setTheme: () => {},
  resolvedTheme: "light",
  dataSaver: false,
  setDataSaver: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme === "auto") {
    const hour = new Date().getHours();
    return hour >= 20 || hour < 7 ? "dark" : "light";
  }
  return theme;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("auto");
  const [dataSaver, setDataSaverState] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    // Lire les préférences sauvegardées (depuis le profil via /api/auth/me)
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok && d.user) {
          if (d.user.theme) setThemeState(d.user.theme);
          if (d.user.dataSaver) setDataSaverState(d.user.dataSaver);
        } else {
          const saved = localStorage.getItem("nmarke-theme");
          if (saved) setThemeState(saved as Theme);
          const ds = localStorage.getItem("nmarke-datasaver");
          if (ds) setDataSaverState(ds === "1");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setResolvedTheme(resolveTheme(theme));
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (resolvedTheme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [resolvedTheme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("nmarke-theme", t);
    fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: t }),
    }).catch(() => {});
  }, []);

  const setDataSaver = useCallback((v: boolean) => {
    setDataSaverState(v);
    localStorage.setItem("nmarke-datasaver", v ? "1" : "0");
    fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataSaver: v }),
    }).catch(() => {});
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme, dataSaver, setDataSaver }}>
      {children}
    </ThemeContext.Provider>
  );
}
