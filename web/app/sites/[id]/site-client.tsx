"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlarmList } from "@/components/alarm-list";
import {
  Building2,
  Edit,
  Trash2,
  Bell,
  Activity,
  AlertTriangle,
  CheckCircle,
  Settings,
  Wifi,
  Video,
  ChevronLeft,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { disconnectBridgeFromSite, deleteCamera, deleteSite } from "./actions";

interface Site {
  id: number;
  site_name: string;
  address?: string;
  contact_info?: string;
  created_at: string;
  updated_at: string;
}

interface Alarm {
  id: number;
  alarm_type: string;
  alarm_name?: string;
  last_alarm_at: string;
}

interface Stats {
  totalAlarms: number;
  unreadAlarms: number;
  criticalAlarms: number;
}

interface Camera {
  id: number;
  camera_name: string;
  healthy: boolean;
}

interface Bridge {
  id: number;
  bridge_name: string;
  healthy: boolean;
  cameras: Camera[];
}

interface SiteClientProps {
  site: Site;
  alarms: Alarm[];
  stats: Stats;
  bridgesWithCameras: Bridge[];
}

export default function SiteClient({
  site,
  alarms,
  stats,
  bridgesWithCameras,
}: SiteClientProps) {
  const router = useRouter();
  const [deletingBridgeId, setDeletingBridgeId] = useState<number | null>(null);
  const [deletingCameraId, setDeletingCameraId] = useState<number | null>(null);
  const [deletingSite, setDeletingSite] = useState(false);

  const handleDeleteBridge = async (bridgeId: number) => {
    if (confirm("Are you sure you want to remove this bridge from the site?")) {
      setDeletingBridgeId(bridgeId);
      try {
        await disconnectBridgeFromSite(bridgeId);
        router.refresh();
      } catch (error) {
        console.error("Error deleting bridge:", error);
        alert("Failed to remove bridge. Please try again.");
      } finally {
        setDeletingBridgeId(null);
      }
    }
  };

  const handleDeleteCamera = async (cameraId: number) => {
    if (confirm("Are you sure you want to delete this camera?")) {
      setDeletingCameraId(cameraId);
      try {
        await deleteCamera(cameraId);
        router.refresh();
      } catch (error) {
        console.error("Error deleting camera:", error);
        alert("Failed to delete camera. Please try again.");
      } finally {
        setDeletingCameraId(null);
      }
    }
  };

  const handleDeleteSite = async () => {
    if (
      confirm(
        `Are you sure you want to delete the site "${site.site_name}"? This action cannot be undone and will disconnect all bridges from this site.`
      )
    ) {
      setDeletingSite(true);
      try {
        await deleteSite(site.id);
        router.push("/sites");
      } catch (error) {
        console.error("Error deleting site:", error);
        alert("Failed to delete site. Please try again.");
      } finally {
        setDeletingSite(false);
      }
    }
  };

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
            <Link href="/sites">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Sites
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold">{site.site_name}</h1>
                <p className="text-sm text-muted-foreground">
                  {site.address || "No address provided"}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/sites/${site.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Site
              </Button>
            </Link>
            <Link href={`/sites/${site.id}/settings`}>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSite}
              disabled={deletingSite}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deletingSite ? "Deleting..." : "Delete Site"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="alarms">Alarms</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Alarms
                    </CardTitle>
                    <Bell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalAlarms}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Unread Alarms
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.unreadAlarms}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Critical Alarms
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.criticalAlarms}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Site Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Site Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Site Name:
                      </span>
                      <span className="text-sm">{site.site_name}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Address:
                      </span>
                      <span className="text-sm">
                        {site.address || "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Contact:
                      </span>
                      <span className="text-sm">
                        {site.contact_info || "Not provided"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Created:
                      </span>
                      <span className="text-sm">
                        {new Date(site.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
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

            <TabsContent value="devices" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Wifi className="h-5 w-5" />
                      Bridges & Cameras
                    </CardTitle>
                    <Link href={`/sites/${site.id}/bridges/add`}>
                      <Button size="sm" className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Add Bridge
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {bridgesWithCameras.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wifi className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-lg font-medium">No bridges found</p>
                        <p className="text-sm">Add a bridge to get started</p>
                      </div>
                    ) : (
                      bridgesWithCameras.map((bridge) => (
                        <div key={bridge.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Wifi className="h-5 w-5 text-blue-600" />
                              <div>
                                <h3 className="font-medium">
                                  {bridge.bridge_name}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Status:{" "}
                                  {bridge.healthy ? "Healthy" : "Unhealthy"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/sites/${site.id}/bridges/${bridge.id}/edit`}
                              >
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteBridge(bridge.id)}
                                disabled={deletingBridgeId === bridge.id}
                              >
                                {deletingBridgeId === bridge.id ? (
                                  "Removing..."
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          <div className="ml-8 space-y-2">
                            {bridge.cameras.length === 0 ? (
                              <div className="text-sm text-muted-foreground py-2">
                                No cameras connected
                              </div>
                            ) : (
                              bridge.cameras.map((camera) => (
                                <div
                                  key={camera.id}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    <Video className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">
                                      {camera.camera_name}
                                    </span>
                                    <Badge
                                      variant={
                                        camera.healthy
                                          ? "default"
                                          : "destructive"
                                      }
                                      className="text-xs"
                                    >
                                      {camera.healthy ? "Online" : "Offline"}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Link
                                      href={`/sites/${site.id}/bridges/${bridge.id}/cameras/${camera.id}/edit`}
                                    >
                                      <Button variant="ghost" size="sm">
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                    </Link>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteCamera(camera.id)
                                      }
                                      disabled={deletingCameraId === camera.id}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      {deletingCameraId === camera.id ? (
                                        <div className="h-3 w-3 animate-spin rounded-full border border-red-600 border-t-transparent" />
                                      ) : (
                                        <Trash2 className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              ))
                            )}

                            {/* Add Camera Button */}
                            <div className="pt-2">
                              <Link
                                href={`/sites/${site.id}/bridges/${bridge.id}/cameras/add`}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full"
                                >
                                  <Plus className="h-3 w-3 mr-1" />
                                  Add Camera
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alarms" className="space-y-6">
              <AlarmList siteId={site.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
