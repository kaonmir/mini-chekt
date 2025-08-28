import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SitesPage() {
  const supabase = await createClient();
  const { data: sites, error } = await supabase
    .from("site")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching sites:", error);
    redirect("/sites/new");
    return;
  }

  if (!sites || sites.length === 0) {
    redirect("/sites/new");
    return;
  }

  redirect(`/sites/${sites[0].id}`);
}
