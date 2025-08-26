"use client";

import { useRealtimeAlarms } from "@/lib/hooks/use-realtime-alarms";
import { Bell, Clock, Eye, EyeOff, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

interface AlarmListProps {
  siteId?: number;
  className?: string;
}

export function AlarmList({ siteId, className = "" }: AlarmListProps) {
  const { alarms, loading, error, markAsRead, markAllAsRead, unreadCount } =
    useRealtimeAlarms(siteId);

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-muted h-16 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center text-destructive p-4 ${className}`}>
        <p>Error loading alarms: {error}</p>
      </div>
    );
  }

  if (alarms.length === 0) {
    return (
      <div className={`text-center text-muted-foreground p-8 ${className}`}>
        <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No alarms found</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header with unread count and mark all as read button */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Alarms</h2>
          {unreadCount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={markAllAsRead}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Alarm list */}
      <div className="space-y-2">
        {alarms.map((alarm) => (
          <div
            key={alarm.id}
            className={`p-4 rounded-lg border transition-all cursor-pointer hover:shadow-sm ${
              alarm.is_read
                ? "bg-muted/50 border-muted"
                : "bg-background border-border shadow-sm"
            }`}
            onClick={() => !alarm.is_read && markAsRead(alarm.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Bell
                    className={`h-4 w-4 ${
                      alarm.is_read
                        ? "text-muted-foreground"
                        : "text-destructive"
                    }`}
                  />
                  <h3
                    className={`font-medium ${
                      alarm.is_read
                        ? "text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {alarm.alarm_name}
                  </h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {alarm.alarm_type}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(alarm.last_alarm_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {alarm.is_read && (
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>Read</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {alarm.is_read ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-blue-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
