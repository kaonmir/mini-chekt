import { notFound } from "next/navigation";
import {
  getSite,
  getSiteAlarms,
  getSiteStats,
  getSiteBridges,
  getBridgeCameras,
} from "./site-data";
import SiteClient from "./site-client";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function SiteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const site = await getSite(id);

  if (!site) {
    notFound();
  }

  const [alarms, stats, bridges] = await Promise.all([
    getSiteAlarms(id),
    getSiteStats(id),
    getSiteBridges(id),
  ]);

  // Get cameras for each bridge
  const bridgesWithCameras = await Promise.all(
    bridges.map(async (bridge) => {
      const cameras = await getBridgeCameras(bridge.id);
      return { ...bridge, cameras };
    })
  );

  return (
    <SiteClient
      site={site}
      alarms={alarms}
      stats={stats}
      bridgesWithCameras={bridgesWithCameras}
    />
  );
}
