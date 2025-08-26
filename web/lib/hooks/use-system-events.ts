import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SystemEvent {
  id: string;
  type: "status_change" | "maintenance" | "alert" | "info";
  message: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
}

export function useSystemEvents() {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Set up broadcast channel for system events
    const channel = supabase
      .channel("system-events")
      .on("broadcast", { event: "system-event" }, (payload) => {
        console.log("System event received via broadcast:", payload);
        const newEvent = payload.payload as SystemEvent;
        setEvents((prev) => [newEvent, ...prev.slice(0, 9)]); // Keep only last 10 events
      })
      .on("broadcast", { event: "system-status" }, (payload) => {
        console.log("System status update via broadcast:", payload);
        // Handle system status updates
      })
      .subscribe();

    setLoading(false);

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { events, loading };
}
