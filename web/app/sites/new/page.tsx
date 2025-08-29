import { Metadata } from "next";
import SiteForm from "@/components/site-form";

export const metadata: Metadata = {
  title: "Create New Site - Chekt",
  description: "Create a new site for monitoring and management",
};

export default function CreateSitePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Create New Site</h1>
          <p className="text-muted-foreground mt-2">
            Add a new site to your monitoring system
          </p>
        </div>

        <SiteForm mode="create" />
      </div>
    </div>
  );
}
