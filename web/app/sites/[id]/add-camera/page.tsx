import { notFound } from "next/navigation";
import { getSite, getSiteBridges, getAvailableCameras } from "../site-data";
import AddCameraClient from "./add-camera-client";

interface PageProps {
  params: {
    id: string;
  };
  searchParams: {
    bridgeId?: string;
  };
}

export default async function AddCameraPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { bridgeId } = await searchParams;

  const site = await getSite(id);

  if (!site) {
    notFound();
  }

  const bridges = await getSiteBridges(id);

  // If bridgeId is provided, get available cameras for that bridge
  let availableCameras = [];
  if (bridgeId) {
    availableCameras = await getAvailableCameras(parseInt(bridgeId));
  }

  return (
    <AddCameraClient
      site={site}
      bridges={bridges}
      availableCameras={availableCameras}
      selectedBridgeId={bridgeId ? parseInt(bridgeId) : null}
    />
  );
}
