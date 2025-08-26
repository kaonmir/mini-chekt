"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import type { Site } from "@/lib/database";

export function SiteList() {
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const supabase = createClient();
        
        // Type-safe query - TypeScript will provide autocomplete and type checking
        const { data, error } = await supabase
          .from('site')
          .select('*')
          .order('site_name', { ascending: true });

        if (error) throw error;
        
        // data is automatically typed as Site[]
        setSites(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sites');
      } finally {
        setLoading(false);
      }
    };

    fetchSites();
  }, []);

  if (loading) return <div>Loading sites...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Sites</h2>
      {sites.length === 0 ? (
        <p>No sites found.</p>
      ) : (
        <ul className="space-y-2">
          {sites.map((site) => (
            <li key={site.id} className="p-3 border rounded">
              <h3 className="font-semibold">{site.site_name}</h3>
              {site.contact_name && (
                <p className="text-sm text-gray-600">
                  Contact: {site.contact_name}
                </p>
              )}
              {site.latitude && site.longitude && (
                <p className="text-xs text-gray-500">
                  Location: {site.latitude}, {site.longitude}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
