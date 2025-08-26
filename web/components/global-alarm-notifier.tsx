'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Table } from '@/lib/database';

type Alarm = Table<"alarm">;

interface GlobalAlarmNotifierProps {
  siteId?: number;
  enabled?: boolean;
}

export function GlobalAlarmNotifier({ siteId, enabled = true }: GlobalAlarmNotifierProps) {
  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();

    // Request notification permission
    const requestNotificationPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    };

    requestNotificationPermission();

    // Set up real-time subscription for new alarms
    const channel = supabase
      .channel('global-alarm-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alarm',
          filter: siteId ? `site_id=eq.${siteId}` : undefined,
        },
        (payload) => {
          const alarm = payload.new as Alarm;
          
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('New Alarm', {
              body: `${alarm.alarm_name} - ${alarm.alarm_type}`,
              icon: '/favicon.ico', // You can replace with your app icon
              tag: `alarm-${alarm.id}`,
              requireInteraction: true,
            });
          }

          // Play notification sound (optional)
          try {
            const audio = new Audio('/notification.mp3'); // You can add a notification sound file
            audio.play().catch(() => {
              // Ignore errors if audio file doesn't exist
            });
          } catch (error) {
            // Ignore audio errors
          }

          console.log('New alarm notification:', alarm);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId, enabled]);

  // This component doesn't render anything visible
  return null;
}
