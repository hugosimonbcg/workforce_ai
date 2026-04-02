"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";

interface ScreenWrapperProps {
  screenId: string;
  children: React.ReactNode;
  defaultAiOpen?: boolean;
}

export function ScreenWrapper({ screenId, children, defaultAiOpen = false }: ScreenWrapperProps) {
  const { setActiveScreen, setAiRailOpen } = useAppStore();

  useEffect(() => {
    setActiveScreen(screenId);
    setAiRailOpen(defaultAiOpen);
  }, [screenId, defaultAiOpen, setActiveScreen, setAiRailOpen]);

  return <>{children}</>;
}
