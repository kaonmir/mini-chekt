import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export async function getSite(id: string) {
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

export async function getSiteAlarms(siteId: string) {
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

export async function getSiteStats(siteId: string) {
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

export async function getSiteBridges(siteId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bridge")
    .select("*")
    .eq("site_id", parseInt(siteId))
    .order("bridge_name");

  if (error) {
    console.error("Error fetching bridges:", error);
    return [];
  }

  return data || [];
}

export async function getBridgeCameras(bridgeId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("camera")
    .select("*")
    .eq("bridge_id", bridgeId)
    .eq("is_registered", true)
    .order("camera_name");

  if (error) {
    console.error("Error fetching cameras:", error);
    return [];
  }

  return data || [];
}

export async function getAvailableCameras(bridgeId: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("camera")
    .select("*")
    .eq("bridge_id", bridgeId)
    .eq("is_registered", false)
    .order("camera_name");

  if (error) {
    console.error("Error fetching available cameras:", error);
    return [];
  }

  return data || [];
}

export async function registerCamera(
  cameraId: number,
  username: string,
  password: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("camera")
    .update({
      username,
      password,
      is_registered: true,
      registered_at: new Date().toISOString(),
    })
    .eq("id", cameraId)
    .select()
    .single();

  if (error) {
    console.error("Error registering camera:", error);
    throw error;
  }

  return data;
}
