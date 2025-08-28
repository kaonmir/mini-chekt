import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserActivity {
  id: string;
  userId: string;
  action:
    | "login"
    | "logout"
    | "view_site"
    | "edit_site"
    | "create_alarm"
    | "mark_read";
  target: string; // site_id, alarm_id, etc.
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export function useUserActivity() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Set up broadcast channel for user activities
    const channel = supabase
      .channel("user-activity")
      .on("broadcast", { event: "user-action" }, (payload) => {
        console.log("User activity received via broadcast:", payload);
        const newActivity = payload.payload as UserActivity;
        setActivities((prev) => [newActivity, ...prev.slice(0, 19)]); // Keep only last 20 activities
      })
      .on("broadcast", { event: "user-presence" }, (payload) => {
        console.log("User presence update via broadcast:", payload);
        // Handle user presence updates (online/offline status)
      })
      .subscribe();

    setLoading(false);

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { activities, loading };
}
