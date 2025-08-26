"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Building2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Site } from "@/lib/database";

interface SiteDeleteConfirmationProps {
  site: Site;
}

export default function SiteDeleteConfirmation({
  site,
}: SiteDeleteConfirmationProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
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

      const { error } = await supabase.from("site").delete().eq("id", site.id);

      if (error) {
        setError(error.message);
      } else {
        router.push("/sites");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-600">
          <AlertTriangle className="h-5 w-5" />
          Confirm Deletion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium mb-2">
            Are you sure you want to delete this site?
          </p>
          <p className="text-red-700 text-sm">
            This action cannot be undone. All data associated with this site
            will be permanently removed.
          </p>
        </div>

        <div className="bg-gray-50 border rounded-lg p-4">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Site Details
          </h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">Name:</span> {site.site_name}
            </p>
            <p>
              <span className="font-medium">ID:</span> {site.id}
            </p>
            {site.contact_name && (
              <p>
                <span className="font-medium">Contact:</span>{" "}
                {site.contact_name}
              </p>
            )}
            {site.contact_phone && (
              <p>
                <span className="font-medium">Phone:</span> {site.contact_phone}
              </p>
            )}
            <p>
              <span className="font-medium">Status:</span> {site.arm_status}
            </p>
          </div>
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
            type="button"
            variant="destructive"
            className="flex items-center gap-2"
            onClick={handleDelete}
            disabled={isLoading}
          >
            <Trash2 className="h-4 w-4" />
            {isLoading ? "Deleting..." : "Delete Site"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
