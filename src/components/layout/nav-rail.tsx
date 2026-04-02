"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  CalendarClock,
  Users,
  FlaskConical,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Recommendation", icon: LayoutDashboard },
  { href: "/workload", label: "Workload", icon: BarChart3 },
  { href: "/shift-plan", label: "Shift Plan", icon: CalendarClock },
  { href: "/roster", label: "Roster", icon: Users },
  { href: "/scenarios", label: "Scenarios", icon: FlaskConical },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 px-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex items-center gap-2 px-3 py-2 transition-colors body-md",
              isActive ? "font-medium" : "hover:opacity-80",
            )}
            style={{
              color: isActive ? "var(--text-inverse)" : "var(--shell-text)",
            }}
          >
            <item.icon size={16} strokeWidth={isActive ? 2 : 1.5} />
            <span>{item.label}</span>
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
