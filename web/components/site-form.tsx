"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InsertTable, Site, UpdateTable } from "@/lib/database";
import LogoUpload from "@/components/logo-upload";

interface SiteFormProps {
  mode: "create" | "edit";
  initialData?: Site;
  siteId?: number;
}

export default function SiteForm({ mode, initialData, siteId }: SiteFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(
    initialData?.logo_url || null
  );

  const handleLogoUploaded = (url: string) => {
    setLogoUrl(url);
  };

  const handleLogoRemoved = () => {
    setLogoUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("Authentication required. Please log in.");
        setIsLoading(false);
        return;
      }

      // Get form data directly from form elements
      const form = e.target as HTMLFormElement;
      const siteNameInput = form.querySelector(
        'input[name="site_name"]'
      ) as HTMLInputElement;
      const contactNameInput = form.querySelector(
        'input[name="contact_name"]'
      ) as HTMLInputElement;
      const contactPhoneInput = form.querySelector(
        'input[name="contact_phone"]'
      ) as HTMLInputElement;
      const siteData: InsertTable<"site"> | UpdateTable<"site"> = {
        site_name: siteNameInput.value,
        contact_name: contactNameInput.value || null,
        contact_phone: contactPhoneInput.value || null,
        logo_url: logoUrl,
      };

      if (!siteData.site_name) {
        setError("Site name is required");
        setIsLoading(false);
        return;
      }

      let result;
      if (mode === "create") {
        result = await supabase
          .from("site")
          .insert(siteData as InsertTable<"site">)
          .select()
          .single();
      } else {
        result = await supabase
          .from("site")
          .update(siteData)
          .eq("id", siteId!)
          .select()
          .single();
      }

      if (result.error) {
        setError(result.error.message);
      } else {
        // Dispatch custom event to notify navigation to refresh
        window.dispatchEvent(new CustomEvent("site-updated"));
        router.push(`/sites/${result.data.id}`);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Site Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="site_name">Site Name *</Label>
            <Input
              id="site_name"
              name="site_name"
              type="text"
              placeholder="Enter site name"
              defaultValue={initialData?.site_name || ""}
              required
            />
          </div>

          <LogoUpload
            currentLogoUrl={initialData?.logo_url}
            onLogoUploaded={handleLogoUploaded}
            onLogoRemoved={handleLogoRemoved}
          />

          <input type="hidden" name="logo_url" value={logoUrl || ""} />

          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              name="contact_name"
              type="text"
              placeholder="Enter contact person name"
              defaultValue={initialData?.contact_name || ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone</Label>
            <Input
              id="contact_phone"
              name="contact_phone"
              type="tel"
              placeholder="Enter contact phone number"
              defaultValue={initialData?.contact_phone || ""}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Save className="h-4 w-4" />
              {isLoading
                ? "Saving..."
                : mode === "create"
                ? "Create Site"
                : "Update Site"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
