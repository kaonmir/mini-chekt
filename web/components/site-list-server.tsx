import { createClient } from "@/lib/supabase/server";
import type { Site } from "@/lib/database";
import { Building2, Edit } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export async function SiteListServer() {
  const supabase = await createClient();

  // Type-safe server-side query
  const { data: sites, error } = await supabase
    .from("site")
    .select("*")
    .order("site_name", { ascending: true });

  if (error) {
    return <div>Error loading sites: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      {sites.length === 0 ? (
        <p>No sites found.</p>
      ) : (
        <ul className="space-y-2">
          {sites.map((site: Site) => (
            <li
              key={site.id}
              className="p-3 border rounded hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {site.logo_url ? (
                  <Image
                    src={site.logo_url}
                    alt={`${site.site_name} logo`}
                    width={40}
                    height={40}
                    className="object-cover rounded border"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <Link href={`/sites/${site.id}`} className="flex-1">
                  <div>
                    <h3 className="font-semibold">{site.site_name}</h3>
                    {site.contact_name && (
                      <p className="text-sm text-gray-600">
                        Contact: {site.contact_name}
                      </p>
                    )}
                    {site.contact_phone && (
                      <p className="text-sm text-gray-600">
                        Phone: {site.contact_phone}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      Status: {site.arm_status}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Link href={`/sites/${site.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
