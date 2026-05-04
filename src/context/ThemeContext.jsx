import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "mch_theme";

function getSystemPref() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(pref) {
  if (pref === "auto") return getSystemPref();
  return pref;
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || "dark";
  });

  const resolved = useMemo(() => resolveTheme(preference), [preference]);

  // Apply data-theme attribute on <html>
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", resolved);
    localStorage.setItem(STORAGE_KEY, preference);
  }, [preference, resolved]);

  // Listen for system preference changes when "auto" is selected
  useEffect(() => {
    if (preference !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      document.documentElement.setAttribute("data-theme", getSystemPref());
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [preference]);

  const setTheme = useCallback((t) => {
    setPreference(t);
  }, []);

  const value = useMemo(
    () => ({ theme: preference, resolved, setTheme }),
    [preference, resolved, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
