"use client";

import { AlarmList } from "@/components/alarm-list";
import { GlobalAlarmNotifier } from "@/components/global-alarm-notifier";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import {
  broadcastAlarmInsert,
  broadcastSystemEvent,
  broadcastSystemStatus,
  broadcastUserActivity,
  broadcastUserPresence,
} from "@/lib/supabase/broadcast";
import { useSystemEvents } from "@/lib/hooks/use-system-events";
import { useUserActivity } from "@/lib/hooks/use-user-activity";
import { getGlobalUnreadCounts } from "@/lib/hooks/use-realtime-alarms";
import { useState, useEffect } from "react";


export default function TestAlarmsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [globalUnreadCounts, setGlobalUnreadCounts] = useState<
    Record<number, number>
  >({});
  const { events: systemEvents } = useSystemEvents();
  const { activities: userActivities } = useUserActivity();

  // Update global unread counts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setGlobalUnreadCounts(getGlobalUnreadCounts());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const createTestAlarm = async () => {
    setIsCreating(true);
    try {
      const supabase = createClient();

      // Get first site ID for testing
      const { data: sites } = await supabase.from("site").select("id").limit(1);

      if (!sites || sites.length === 0) {
        alert("No sites found. Please create a site first.");
        return;
      }

      const siteId = sites[0].id;

      // Create test alarm
      const { data: newAlarm, error } = await supabase
        .from("alarm")
        .insert({
          alarm_name: `Test Alarm ${new Date().toLocaleTimeString()}`,
          alarm_type: "motion",
          bridge_id: 1,
          camera_id: 1,
          site_id: siteId,
          is_read: false,
          last_alarm_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating test alarm:", error);
        alert("Failed to create test alarm");
        return;
      }

      // Broadcast the new alarm event
      await broadcastAlarmInsert(newAlarm);

      // Broadcast user activity
      await broadcastUserActivity({
        userId: "test-user",
        action: "create_alarm",
        target: newAlarm.id.toString(),
        metadata: { siteId: newAlarm.site_id },
      });

      console.log("Test alarm created and broadcasted successfully");
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to create test alarm");
    } finally {
      setIsCreating(false);
    }
  };

  const createSystemEvent = async () => {
    try {
      await broadcastSystemEvent({
        id: crypto.randomUUID(),
        type: "alert",
        message: `System alert at ${new Date().toLocaleTimeString()}`,
        severity: "medium",
      });
      console.log("System event broadcasted");
    } catch (error) {
      console.error("Error broadcasting system event:", error);
    }
  };

  const updateSystemStatus = async () => {
    try {
      await broadcastSystemStatus({
        component: "camera-system",
        status: "maintenance",
        message: "Scheduled maintenance in progress",
      });
      console.log("System status broadcasted");
    } catch (error) {
      console.error("Error broadcasting system status:", error);
    }
  };

  const simulateUserActivity = async () => {
    try {
      await broadcastUserActivity({
        userId: "test-user",
        action: "view_site",
        target: "1",
        metadata: { page: "dashboard" },
      });
      console.log("User activity broadcasted");
    } catch (error) {
      console.error("Error broadcasting user activity:", error);
    }
  };

  const updateUserPresence = async () => {
    try {
      await broadcastUserPresence({
        userId: "test-user",
        status: "online",
        lastSeen: new Date().toISOString(),
      });
      console.log("User presence broadcasted");
    } catch (error) {
      console.error("Error broadcasting user presence:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Global alarm notifier for browser notifications */}
      <GlobalAlarmNotifier enabled={true} />

      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <h1 className="text-xl font-bold">
              Monitoring - Broadcast Channels Test
            </h1>
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Broadcast Channels Test</h1>
          <p className="text-muted-foreground">
            Test different types of broadcast events using Supabase channels.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Test Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={createTestAlarm}
                disabled={isCreating}
                className="w-full"
              >
                {isCreating ? "Creating..." : "Create Test Alarm"}
              </Button>

              <Button
                onClick={createSystemEvent}
                variant="outline"
                className="w-full"
              >
                Create System Event
              </Button>

              <Button
                onClick={updateSystemStatus}
                variant="outline"
                className="w-full"
              >
                Update System Status
              </Button>

              <Button
                onClick={simulateUserActivity}
                variant="outline"
                className="w-full"
              >
                Simulate User Activity
              </Button>

              <Button
                onClick={updateUserPresence}
                variant="outline"
                className="w-full"
              >
                Update User Presence
              </Button>

              <div className="text-sm text-muted-foreground">
                <p>• Each button triggers different broadcast events</p>
                <p>• Watch the panels below update in real-time</p>
                <p>• Uses separate channels for different event types</p>
              </div>
            </CardContent>
          </Card>

          {/* Global Unread Counts */}
          <Card>
            <CardHeader>
              <CardTitle>Global Unread Counts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(globalUnreadCounts).map(([siteId, count]) => (
                  <div
                    key={siteId}
                    className="flex items-center justify-between p-2 border rounded"
                  >
                    <span className="text-sm">Site {siteId}</span>
                    <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
                      {count} unread
                    </span>
                  </div>
                ))}
                {Object.keys(globalUnreadCounts).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No unread alarms
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Real-time Alarm List */}
          <Card>
            <CardHeader>
              <CardTitle>Real-time Alarms</CardTitle>
            </CardHeader>
            <CardContent>
              <AlarmList />
            </CardContent>
          </Card>

          {/* System Events */}
          <Card>
            <CardHeader>
              <CardTitle>System Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {systemEvents.map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{event.type}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          event.severity === "critical"
                            ? "bg-red-100 text-red-800"
                            : event.severity === "high"
                            ? "bg-orange-100 text-orange-800"
                            : event.severity === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {event.severity}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
                {systemEvents.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No system events
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Activities */}
          <Card>
            <CardHeader>
              <CardTitle>User Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {userActivities.map((activity) => (
                  <div key={activity.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {activity.action}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      User: {activity.userId} | Target: {activity.target}
                    </p>
                  </div>
                ))}
                {userActivities.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No user activities
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
