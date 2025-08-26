import { createClient } from "@/lib/supabase/server";
import type { Site } from "@/lib/database";

export async function SiteListServer() {
  const supabase = await createClient();
  
  // Type-safe server-side query
  const { data: sites, error } = await supabase
    .from('site')
    .select('*')
    .order('site_name', { ascending: true });

  if (error) {
    return <div>Error loading sites: {error.message}</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Sites (Server Rendered)</h2>
      {sites.length === 0 ? (
        <p>No sites found.</p>
      ) : (
        <ul className="space-y-2">
          {sites.map((site: Site) => (
            <li key={site.id} className="p-3 border rounded">
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
