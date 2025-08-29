import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SiteListServer } from "@/components/site-list-server";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sites - Chekt",
  description: "Manage your monitoring sites",
};

export default async function SitesPage() {
  const supabase = await createClient();
  const { data: sites, error } = await supabase
    .from("site")
    .select("*")
    .order("site_name", { ascending: true });

  if (error) {
    console.error("Error fetching sites:", error);
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error Loading Sites</h1>
            <p className="text-muted-foreground mb-4">
              Failed to load sites. Please try again later.
            </p>
            <Link href="/">
              <Button>Go Back Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Sites</h1>
              <p className="text-muted-foreground mt-2">
                Manage and monitor your sites
              </p>
            </div>
            <Link href="/sites/new">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Site
              </Button>
            </Link>
          </div>
        </div>

        {sites && sites.length > 0 ? (
          <SiteListServer />
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-2">No sites yet</h2>
              <p className="text-muted-foreground mb-6">
                Get started by creating your first monitoring site.
              </p>
              <Link href="/sites/new">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Site
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
