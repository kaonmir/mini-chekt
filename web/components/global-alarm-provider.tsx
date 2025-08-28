"use client";

import { useEffect } from "react";
import { useRealtimeAlarms } from "@/lib/hooks/use-realtime-alarms";

interface GlobalAlarmProviderProps {
  children: React.ReactNode;
}

export function GlobalAlarmProvider({ children }: GlobalAlarmProviderProps) {
  // Initialize global alarm listener (this will fetch all alarms and set up global state)
  useRealtimeAlarms(); // No siteId means all alarms

  useEffect(() => {
    // This effect ensures the global alarm state is initialized
    // The useRealtimeAlarms hook will handle the rest
  }, []);

  return <>{children}</>;
}
