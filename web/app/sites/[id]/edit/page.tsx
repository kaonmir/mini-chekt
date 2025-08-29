import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSite } from "../site-data";
import SiteForm from "@/components/site-form";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const site = await getSite(id);

  if (!site) {
    return {
      title: "Site Not Found - Chekt",
    };
  }

  return {
    title: `Edit ${site.site_name} - Chekt`,
    description: `Edit site information for ${site.site_name}`,
  };
}

export default async function EditSitePage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSite(id);

  if (!site) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Edit Site: {site.site_name}
          </h1>
          <p className="text-muted-foreground mt-2">
            Update site information and settings
          </p>
        </div>

        <SiteForm mode="edit" initialData={site} siteId={site.id} />
      </div>
    </div>
  );
}
