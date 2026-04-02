"use client";

import { useEffect, useState } from "react";
import { planContext } from "@/data/mock-data";
import { useAppStore } from "@/lib/store";
import { ChevronDown, Sparkles, FileText, Moon, Sun } from "lucide-react";
import { TopNav } from "./nav-rail";

export function TopBar() {
  const { toggleAiRail, aiRailOpen, toggleEvidence } = useAppStore();
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedTheme = typeof window !== "undefined" ? window.localStorage.getItem("workforce-theme") : null;
    const initialTheme: "light" | "dark" = savedTheme === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme: "light" | "dark" = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("workforce-theme", nextTheme);
  };

  return (
    <header
      className="flex flex-col shrink-0"
      style={{
        background: "var(--shell-bg)",
        borderBottom: "1px solid var(--bg-brand-hover)",
      }}
    >
      {/* Primary row: logo + selectors + actions */}
      <div className="h-12 flex items-center justify-between px-5">
        <div className="flex items-center gap-4 min-w-0">
          <div className="flex items-center shrink-0">
            <h1 className="heading-sm shrink-0" style={{ color: "var(--text-inverse)", letterSpacing: "0.03em" }}>
              WORKFORCE AI
            </h1>
          </div>

          <div className="h-5 w-px shrink-0 hidden md:block" style={{ background: "var(--bg-brand-hover)" }} />

          <div className="hidden md:flex items-center gap-2 min-w-0">
            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 body-sm delight-press delight-focus"
              style={{
                color: "var(--text-inverse)",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <span className="truncate">{planContext.facility.id}</span>
              <ChevronDown size={13} />
            </button>

            <button
              className="flex items-center gap-1.5 px-2.5 py-1.5 body-sm delight-press delight-focus"
              style={{
                color: "var(--text-inverse)",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              <span className="truncate">{planContext.horizon.label}</span>
              <ChevronDown size={13} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-1.5 action-sm delight-press delight-focus"
            style={{
              color: "var(--shell-text-active)",
              borderRadius: "var(--radius-sm)",
              background: theme === "dark" ? "rgba(255,255,255,0.08)" : undefined,
            }}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
          <button
            onClick={toggleEvidence}
            className="flex items-center gap-1.5 px-3 py-1.5 action-sm delight-press delight-focus"
            style={{ color: "var(--shell-text-active)", borderRadius: "var(--radius-sm)" }}
          >
            <FileText size={14} />
            Evidence
          </button>
          <button
            onClick={toggleAiRail}
            className="flex items-center gap-1.5 px-3 py-1.5 action-sm delight-press delight-focus"
            style={{
              color: aiRailOpen ? "var(--text-inverse)" : "var(--shell-text-active)",
              background: aiRailOpen ? "var(--bg-turquoise-primary)" : undefined,
              borderRadius: "var(--radius-sm)",
            }}
          >
            <Sparkles size={14} />
            AI Copilot
          </button>
        </div>
      </div>

      {/* Secondary row: navigation links */}
      <div
        className="flex items-center h-10 px-3 overflow-x-auto"
        style={{
          borderTop: "1px solid var(--bg-brand-hover)",
          background: "rgba(0,0,0,0.12)",
        }}
      >
        <TopNav />
      </div>
    </header>
  );
}
