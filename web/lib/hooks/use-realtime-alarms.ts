import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Table } from '@/lib/database';

type Alarm = Table<"alarm">;

export function useRealtimeAlarms(siteId?: number) {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Mark alarm as read
  const markAsRead = async (alarmId: number) => {
    try {
      const { error } = await supabase
        .from('alarm')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', alarmId);

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Failed to mark alarm as read:', err);
    }
  };

  // Mark all alarms as read
  const markAllAsRead = async () => {
    try {
      let query = supabase
        .from('alarm')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('is_read', false);

      if (siteId) {
        query = query.eq('site_id', siteId);
      }

      const { error } = await query;

      if (error) {
        throw error;
      }
    } catch (err) {
      console.error('Failed to mark all alarms as read:', err);
    }
  };

  useEffect(() => {
    // Initial fetch
    const fetchAlarms = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('alarm')
          .select('*')
          .order('created_at', { ascending: false });

        if (siteId) {
          query = query.eq('site_id', siteId);
        }

        const { data, error } = await query;

        if (error) {
          throw error;
        }

        setAlarms(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch alarms');
      } finally {
        setLoading(false);
      }
    };

    fetchAlarms();

    // Set up real-time subscription
    const channel = supabase
      .channel('alarm-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alarm',
          filter: siteId ? `site_id=eq.${siteId}` : undefined,
        },
        (payload) => {
          console.log('New alarm received:', payload);
          setAlarms((prev) => [payload.new as Alarm, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'alarm',
          filter: siteId ? `site_id=eq.${siteId}` : undefined,
        },
        (payload) => {
          console.log('Alarm updated:', payload);
          setAlarms((prev) =>
            prev.map((alarm) =>
              alarm.id === payload.new.id ? (payload.new as Alarm) : alarm
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'alarm',
          filter: siteId ? `site_id=eq.${siteId}` : undefined,
        },
        (payload) => {
          console.log('Alarm deleted:', payload);
          setAlarms((prev) => prev.filter((alarm) => alarm.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [siteId]);

  return { 
    alarms, 
    loading, 
    error, 
    markAsRead, 
    markAllAsRead,
    unreadCount: alarms.filter(alarm => !alarm.is_read).length
  };
}
