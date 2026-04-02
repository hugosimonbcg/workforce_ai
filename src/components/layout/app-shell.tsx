"use client";

import { TopBar } from "./top-bar";
import { CopilotRail } from "../ai/copilot-rail";
import { EvidenceDrawer } from "./evidence-drawer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <main className="flex-1 overflow-y-auto" style={{ background: "var(--canvas-bg)" }}>
          {children}
        </main>
        <CopilotRail />
      </div>
      <EvidenceDrawer />
    </div>
  );
}
