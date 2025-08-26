"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Building2, Bell, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Site } from "@/lib/database";
import { useEffect } from "react";

interface SiteWithUnreadCount extends Site {
  unread_alarms: number;
}

export default function SiteSubNav() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sites, setSites] = useState<SiteWithUnreadCount[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    async function fetchSites() {
      const supabase = createClient();

      // Fetch sites with unread alarm counts
      const { data: sitesData, error: sitesError } = await supabase
        .from("site")
        .select("*")
        .order("site_name");

      if (sitesError) {
        console.error("Error fetching sites:", sitesError);
        return;
      }

      // Fetch unread alarm counts for each site
      const sitesWithCounts = await Promise.all(
        (sitesData || []).map(async (site) => {
          const { count, error: alarmError } = await supabase
            .from("alarm")
            .select("*", { count: "exact", head: true })
            .eq("site_id", site.id)
            .eq("is_read", false);

          if (alarmError) {
            console.error(
              "Error fetching alarms for site",
              site.id,
              alarmError
            );
            return { ...site, unread_alarms: 0 };
          }

          return { ...site, unread_alarms: count || 0 };
        })
      );

      setSites(sitesWithCounts);
      setLoading(false);
    }

    fetchSites();
  }, []);

  const isActiveSite = (siteId: string) => {
    return pathname.startsWith(`/sites/${siteId}`);
  };

  if (loading) {
    return (
      <div
        className={`bg-background border-r border-border transition-all duration-300 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-background border-r border-border transition-all duration-300 flex flex-col ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && <h2 className="font-semibold text-sm">Sites</h2>}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Add New Site Button */}
      <div className="p-4 border-b border-border">
        <Link href="/sites/new">
          <Button
            variant="outline"
            size="sm"
            className={`w-full ${isCollapsed ? "h-8 w-8 p-0" : ""}`}
          >
            {isCollapsed ? (
              <Plus className="h-4 w-4" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Site
              </>
            )}
          </Button>
        </Link>
      </div>

      {/* Sites List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sites.map((site) => (
            <Link key={site.id} href={`/sites/${site.id}`}>
              <div
                className={`group relative flex items-center p-3 rounded-lg transition-colors cursor-pointer ${
                  isActiveSite(site.id)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {/* Site Logo/Icon */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-8 h-8 rounded-full bg-muted flex items-center justify-center ${
                      isActiveSite(site.id)
                        ? "bg-primary-foreground/20"
                        : "bg-muted"
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                  </div>

                  {/* Unread Badge */}
                  {site.unread_alarms > 0 && (
                    <Badge
                      variant="destructive"
                      className={`absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs ${
                        isCollapsed ? "h-4 w-4 text-[10px]" : ""
                      }`}
                    >
                      {site.unread_alarms > 99 ? "99+" : site.unread_alarms}
                    </Badge>
                  )}
                </div>

                {/* Site Info (only when expanded) */}
                {!isCollapsed && (
                  <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p
                        className={`text-sm font-medium truncate ${
                          isActiveSite(site.id) ? "text-primary-foreground" : ""
                        }`}
                      >
                        {site.site_name}
                      </p>
                    </div>

                    {/* Unread count with bell icon */}
                    {site.unread_alarms > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Bell className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {site.unread_alarms} unread
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
