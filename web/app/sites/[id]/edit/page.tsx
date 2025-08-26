import { createClient } from "@/lib/supabase/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Site } from "@/lib/database";
import SiteForm from "@/components/site-form";

async function getSite(id: string): Promise<Site | null> {
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

export default async function EditSitePage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const site = await getSite(id);

  if (!site) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
        <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <Link
              href="/sites"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Sites
            </Link>
            <Link href="/" className="text-xl font-bold">
              Chekt Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 w-full max-w-2xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Site</h1>
          <p className="text-muted-foreground">Update site information</p>
        </div>

        <SiteForm mode="edit" initialData={site} siteId={site.id} />
      </div>
    </div>
  );
}
