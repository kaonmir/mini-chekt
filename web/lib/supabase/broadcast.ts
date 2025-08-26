import { createClient } from "./client";
import type { Table } from "@/lib/database";

type Alarm = Table<"alarm">;

// Broadcast alarm events to specific channels
export async function broadcastAlarmInsert(alarm: Alarm) {
  const supabase = createClient();

  // Broadcast to global channel
  await supabase.channel("alarm-global").send({
    type: "broadcast",
    event: "alarm-insert",
    payload: alarm,
  });

  // Broadcast to site-specific channel
  await supabase.channel(`alarm-site-${alarm.site_id}`).send({
    type: "broadcast",
    event: "alarm-insert",
    payload: alarm,
  });

  // Broadcast notification event
  await supabase.channel("notification-global").send({
    type: "broadcast",
    event: "new-alarm",
    payload: alarm,
  });

  await supabase.channel(`notification-site-${alarm.site_id}`).send({
    type: "broadcast",
    event: "new-alarm",
    payload: alarm,
  });
}

export async function broadcastAlarmUpdate(alarm: Alarm) {
  const supabase = createClient();

  // Broadcast to global channel
  await supabase.channel("alarm-global").send({
    type: "broadcast",
    event: "alarm-update",
    payload: alarm,
  });

  // Broadcast to site-specific channel
  await supabase.channel(`alarm-site-${alarm.site_id}`).send({
    type: "broadcast",
    event: "alarm-update",
    payload: alarm,
  });
}

export async function broadcastAlarmDelete(alarmId: number, siteId: number) {
  const supabase = createClient();

  // Broadcast to global channel
  await supabase.channel("alarm-global").send({
    type: "broadcast",
    event: "alarm-delete",
    payload: { id: alarmId },
  });

  // Broadcast to site-specific channel
  await supabase.channel(`alarm-site-${siteId}`).send({
    type: "broadcast",
    event: "alarm-delete",
    payload: { id: alarmId },
  });
}

// System events broadcast functions
export async function broadcastSystemEvent(event: {
  id: string;
  type: "status_change" | "maintenance" | "alert" | "info";
  message: string;
  severity: "low" | "medium" | "high" | "critical";
}) {
  const supabase = createClient();

  const systemEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  await supabase.channel("system-events").send({
    type: "broadcast",
    event: "system-event",
    payload: systemEvent,
  });
}

export async function broadcastSystemStatus(status: {
  component: string;
  status: "online" | "offline" | "maintenance" | "error";
  message?: string;
}) {
  const supabase = createClient();

  const statusUpdate = {
    ...status,
    timestamp: new Date().toISOString(),
  };

  await supabase.channel("system-events").send({
    type: "broadcast",
    event: "system-status",
    payload: statusUpdate,
  });
}

// User activity broadcast functions
export async function broadcastUserActivity(activity: {
  userId: string;
  action:
    | "login"
    | "logout"
    | "view_site"
    | "edit_site"
    | "create_alarm"
    | "mark_read";
  target: string;
  metadata?: Record<string, any>;
}) {
  const supabase = createClient();

  const userActivity = {
    id: crypto.randomUUID(),
    ...activity,
    timestamp: new Date().toISOString(),
  };

  await supabase.channel("user-activity").send({
    type: "broadcast",
    event: "user-action",
    payload: userActivity,
  });
}

export async function broadcastUserPresence(presence: {
  userId: string;
  status: "online" | "offline" | "away";
  lastSeen?: string;
}) {
  const supabase = createClient();

  const presenceUpdate = {
    ...presence,
    timestamp: new Date().toISOString(),
  };

  await supabase.channel("user-activity").send({
    type: "broadcast",
    event: "user-presence",
    payload: presenceUpdate,
  });
}

// Generic broadcast function for custom events
export async function broadcastEvent(
  channelName: string,
  eventName: string,
  payload: any
) {
  const supabase = createClient();

  await supabase.channel(channelName).send({
    type: "broadcast",
    event: eventName,
    payload,
  });
}
