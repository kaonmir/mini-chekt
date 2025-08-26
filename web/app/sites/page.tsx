import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
async function getLastSite() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function SitesPage() {
  const lastSite = await getLastSite();

  if (!lastSite) {
    // No sites found, redirect to create new site
    redirect("/sites/new");
  }

  // Redirect to the last site
  redirect(`/sites/${lastSite.id}`);
}
