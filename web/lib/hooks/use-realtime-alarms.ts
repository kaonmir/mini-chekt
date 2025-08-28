import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  broadcastAlarmUpdate,
} from "@/lib/supabase/broadcast";
import type { Table } from "@/lib/database";

type Alarm = Table<"alarm">;

// Global state for all alarms across sites
let globalAlarms: Alarm[] = [];
let globalUnreadCounts: Record<number, number> = {};
let globalListeners: Array<() => void> = [];

// Function to update global state and notify listeners
const updateGlobalState = (alarms: Alarm[]) => {
  globalAlarms = alarms;

  // Calculate unread counts per site
  globalUnreadCounts = alarms.reduce((counts, alarm) => {
    if (!alarm.is_read) {
      counts[alarm.site_id] = (counts[alarm.site_id] || 0) + 1;
    }
    return counts;
  }, {} as Record<number, number>);

  // Notify all listeners
  globalListeners.forEach((listener) => listener());
};

// Function to subscribe to global state changes
export const subscribeToGlobalAlarms = (listener: () => void) => {
  globalListeners.push(listener);
  return () => {
    globalListeners = globalListeners.filter((l) => l !== listener);
  };
};

// Function to get global unread counts
export const getGlobalUnreadCounts = () => ({ ...globalUnreadCounts });

export function useRealtimeAlarms(siteId?: number) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Mark alarm as read
  const markAsRead = async (alarmId: number) => {
    try {
      const { data: updatedAlarm, error } = await supabase
        .from("alarm")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("id", alarmId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Broadcast the update event
      if (updatedAlarm) {
        await broadcastAlarmUpdate(updatedAlarm);
      }
    } catch (err) {
      console.error("Failed to mark alarm as read:", err);
    }
  };

  // Mark all alarms as read
  const markAllAsRead = async () => {
    try {
      let query = supabase
        .from("alarm")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("is_read", false);

      if (siteId) {
        query = query.eq("site_id", siteId);
      }

      const { data: updatedAlarms, error } = await query.select();

      if (error) {
        throw error;
      }

      // Broadcast update events for all updated alarms
      if (updatedAlarms) {
        for (const alarm of updatedAlarms) {
          await broadcastAlarmUpdate(alarm);
        }
      }
    } catch (err) {
      console.error("Failed to mark all alarms as read:", err);
    }
  };

  useEffect(() => {
    // Initial fetch
    const fetchAlarms = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from("alarm")
          .select("*")
          .order("created_at", { ascending: false });

        if (siteId) {
          query = query.eq("site_id", siteId);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        const alarmData = data || [];
        setAlarms(alarmData);

        // Update global state if fetching all alarms
        if (!siteId) {
          updateGlobalState(alarmData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch alarms");
      } finally {
        setLoading(false);
      }
    };

    fetchAlarms();

    // Set up broadcast channel for alarm events
    const channelName = siteId ? `alarm-site-${siteId}` : "alarm-global";
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "alarm-insert" }, (payload) => {
        console.log("New alarm received via broadcast:", payload);
        const newAlarm = payload.payload as Alarm;
        setAlarms((prev) => [newAlarm, ...prev]);

        // Update global state if this is the global listener
        if (!siteId) {
          updateGlobalState([newAlarm, ...globalAlarms]);
        }
      })
      .on("broadcast", { event: "alarm-update" }, (payload) => {
        console.log("Alarm updated via broadcast:", payload);
        const updatedAlarm = payload.payload as Alarm;
        setAlarms((prev) =>
          prev.map((alarm) =>
            alarm.id === updatedAlarm.id ? updatedAlarm : alarm
          )
        );

        // Update global state if this is the global listener
        if (!siteId) {
          updateGlobalState(
            globalAlarms.map((alarm) =>
              alarm.id === updatedAlarm.id ? updatedAlarm : alarm
            )
          );
        }
      })
      .on("broadcast", { event: "alarm-delete" }, (payload) => {
        console.log("Alarm deleted via broadcast:", payload);
        const deletedAlarmId = payload.payload.id as number;
        setAlarms((prev) =>
          prev.filter((alarm) => alarm.id !== deletedAlarmId)
        );

        // Update global state if this is the global listener
        if (!siteId) {
          updateGlobalState(
            globalAlarms.filter((alarm) => alarm.id !== deletedAlarmId)
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId, supabase]);

  return {
    alarms,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    unreadCount: alarms.filter((alarm) => !alarm.is_read).length,
  };
}
