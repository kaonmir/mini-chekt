'use client';

import { AlarmList } from '@/components/alarm-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

export default function TestAlarmsPage() {
  const [isCreating, setIsCreating] = useState(false);

  const createTestAlarm = async () => {
    setIsCreating(true);
    try {
      const supabase = createClient();
      
      // Get first site ID for testing
      const { data: sites } = await supabase
        .from('site')
        .select('id')
        .limit(1);

      if (!sites || sites.length === 0) {
        alert('No sites found. Please create a site first.');
        return;
      }

      const siteId = sites[0].id;
      
      const { error } = await supabase
        .from('alarm')
        .insert({
          alarm_name: `Test Alarm ${new Date().toLocaleTimeString()}`,
          alarm_type: 'motion',
          bridge_id: 1,
          camera_id: 1,
          site_id: siteId,
          is_read: false,
          last_alarm_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error creating test alarm:', error);
        alert('Failed to create test alarm');
      } else {
        console.log('Test alarm created successfully');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create test alarm');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <h1 className="text-xl font-bold">Real-time Alarms Test</h1>
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Real-time Alarms Test</h1>
          <p className="text-muted-foreground">
            Test the real-time alarm functionality. Click the button below to create a test alarm.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                {isCreating ? 'Creating...' : 'Create Test Alarm'}
              </Button>
              
              <div className="text-sm text-muted-foreground">
                <p>• Click to create a new test alarm</p>
                <p>• Watch the alarm list update in real-time</p>
                <p>• Click on unread alarms to mark as read</p>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Alarm List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Alarms</CardTitle>
              </CardHeader>
              <CardContent>
                <AlarmList />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
