"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import {
  LayoutDashboard,
  BarChart3,
  CalendarClock,
  Users,
  FlaskConical,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Recommendation", icon: LayoutDashboard, step: null },
  { href: "/workload", label: "Demand", icon: BarChart3, step: "Demand understood" },
  { href: "/shift-plan", label: "Shift Plan", icon: CalendarClock, step: "Shift plan valid" },
  { href: "/roster", label: "Roster", icon: Users, step: "Roster feasible" },
  { href: "/scenarios", label: "Scenarios", icon: FlaskConical, step: "Scenario selected" },
];

export function TopNav() {
  const pathname = usePathname();

  const visitedPaths = typeof window !== "undefined"
    ? navItems.filter((item) => {
        const key = `wf-visited-${item.href}`;
        if (pathname === item.href) {
          try { sessionStorage.setItem(key, "1"); } catch { /* noop */ }
          return true;
        }
        try { return sessionStorage.getItem(key) === "1"; } catch { return false; }
      }).map((i) => i.href)
    : [];

  return (
    <nav className="flex items-center gap-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const visited = visitedPaths.includes(item.href) && !isActive;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 body-md delight-press delight-focus",
              isActive ? "font-medium" : "hover:opacity-80",
            )}
            style={{
              color: isActive ? "var(--text-inverse)" : "var(--shell-text)",
            }}
          >
            <item.icon size={16} strokeWidth={isActive ? 2 : 1.5} />
            <span>{item.label}</span>
            {visited && item.step && (
              <span
                className="flex items-center justify-center w-3.5 h-3.5 rounded-full"
                style={{ background: "#10b981" }}
                title={item.step}
              >
                <Check size={8} style={{ color: "white" }} />
              </span>
            )}
            {isActive && (
              <span
                className="absolute bottom-0 left-3 right-3 h-0.5"
                style={{ background: "var(--bg-turquoise-primary)", borderRadius: "var(--radius-2xs)" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
