"use server";

import { createClient } from "@/lib/supabase/server";

export async function disconnectBridgeFromSite(bridgeId: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bridge")
    .update({ site_id: null })
    .eq("id", bridgeId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteCamera(cameraId: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("camera")
    .update({ is_registered: false })
    .eq("id", cameraId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteSite(siteId: number) {
  const supabase = await createClient();

  // First, disconnect all bridges from this site
  const { error: bridgeError } = await supabase
    .from("bridge")
    .update({ site_id: null })
    .eq("site_id", siteId);

  if (bridgeError) {
    throw new Error(`Failed to disconnect bridges: ${bridgeError.message}`);
  }

  // Then delete the site
  const { error } = await supabase.from("site").delete().eq("id", siteId);

  if (error) {
    throw new Error(error.message);
  }
}
