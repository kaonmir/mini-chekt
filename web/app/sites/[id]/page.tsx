import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Edit,
  Trash2,
  MapPin,
  Phone,
  User,
  Bell,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

async function getSite(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site")
    .select("*")
    .eq("id", parseInt(id))
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function getSiteAlarms(siteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alarm")
    .select("*")
    .eq("site_id", parseInt(siteId))
    .order("last_alarm_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching alarms:", error);
    return [];
  }

  return data || [];
}

async function getSiteStats(siteId: string) {
  const supabase = await createClient();

  // Get total alarms
  const { count: totalAlarms } = await supabase
    .from("alarm")
    .select("*", { count: "exact", head: true })
    .eq("site_id", parseInt(siteId));

  // Get unread alarms
  const { count: unreadAlarms } = await supabase
    .from("alarm")
    .select("*", { count: "exact", head: true })
    .eq("site_id", parseInt(siteId))
    .eq("is_read", false);

  // Get motion alarms (critical)
  const { count: criticalAlarms } = await supabase
    .from("alarm")
    .select("*", { count: "exact", head: true })
    .eq("site_id", parseInt(siteId))
    .eq("alarm_type", "motion");

  return {
    totalAlarms: totalAlarms || 0,
    unreadAlarms: unreadAlarms || 0,
    criticalAlarms: criticalAlarms || 0,
  };
}

export default async function SiteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSite(id);

  if (!site) {
    notFound();
  }

  const [alarms, stats] = await Promise.all([
    getSiteAlarms(id),
    getSiteStats(id),
  ]);

  const getAlarmTypeColor = (alarmType: string) => {
    switch (alarmType) {
      case "motion":
        return "destructive";
      case "door":
        return "secondary";
      case "system":
        return "default";
      default:
        return "outline";
    }
  };

  const getAlarmTypeIcon = (alarmType: string) => {
    switch (alarmType) {
      case "motion":
        return <AlertTriangle className="h-4 w-4" />;
      case "door":
        return <AlertTriangle className="h-4 w-4" />;
      case "system":
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {site.logo_url ? (
              <img
                src={site.logo_url}
                alt={`${site.site_name} logo`}
                className="w-16 h-16 object-cover rounded-lg border"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold">{site.site_name}</h1>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/sites/${site.id}/edit`}>
              <Button variant="outline" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Site
              </Button>
            </Link>
            <Link href={`/sites/${site.id}/delete`}>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="alarms">Alarms</TabsTrigger>
              <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Site Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Site Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Site Name
                        </p>
                        <p className="text-sm">{site.site_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Arm Status
                        </p>
                        <Badge variant="default" className="mt-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {site.arm_status}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Created
                        </p>
                        <p className="text-sm">
                          {new Date(site.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Last Updated
                        </p>
                        <p className="text-sm">
                          {new Date(site.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {site.contact_name && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Contact:
                        </span>
                        <span className="text-sm">{site.contact_name}</span>
                      </div>
                    )}

                    {site.contact_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Phone:
                        </span>
                        <span className="text-sm">{site.contact_phone}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Last Updated:
                      </span>
                      <span className="text-sm">
                        {new Date(site.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {alarms.slice(0, 5).map((alarm) => (
                        <div
                          key={alarm.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center gap-3">
                            {getAlarmTypeIcon(alarm.alarm_type)}
                            <div>
                              <p className="text-sm font-medium">
                                {alarm.alarm_name || "Alarm"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(alarm.last_alarm_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <Badge variant={getAlarmTypeColor(alarm.alarm_type)}>
                            {alarm.alarm_type}
                          </Badge>
                        </div>
                      ))}

                      {alarms.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                          <p>No recent alarms</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alarms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Recent Alarms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {alarms.map((alarm) => (
                      <div
                        key={alarm.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {getAlarmTypeIcon(alarm.alarm_type)}
                          <div>
                            <p className="font-medium">
                              {alarm.alarm_name || "Alarm"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Type: {alarm.alarm_type}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(alarm.last_alarm_at).toLocaleString()}
                              </span>
                              {!alarm.is_read && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {stats.unreadAlarms}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge variant={getAlarmTypeColor(alarm.alarm_type)}>
                          {alarm.alarm_type}
                        </Badge>
                      </div>
                    ))}

                    {alarms.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-lg font-medium">No alarms found</p>
                        <p className="text-sm">
                          This site has no alarm history
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Monitoring Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-medium">Monitoring Dashboard</p>
                    <p className="text-sm">
                      Real-time monitoring data will be displayed here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Site Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Edit Site Information</p>
                        <p className="text-sm text-muted-foreground">
                          Update site details and contact information
                        </p>
                      </div>
                      <Link href={`/sites/${site.id}/edit`}>
                        <Button variant="outline">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Delete Site</p>
                        <p className="text-sm text-muted-foreground">
                          Permanently remove this site and all its data
                        </p>
                      </div>
                      <Link href={`/sites/${site.id}/delete`}>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
