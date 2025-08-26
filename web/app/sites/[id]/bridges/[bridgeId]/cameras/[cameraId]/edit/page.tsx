import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Video, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
    bridgeId: string;
    cameraId: string;
  }>;
}

async function getCamera(siteId: string, bridgeId: string, cameraId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("camera")
    .select("*")
    .eq("id", parseInt(cameraId))
    .eq("bridge_id", parseInt(bridgeId))
    .single();

  if (error || !data) {
    return null;
  }

  // Verify that the bridge belongs to the site
  const { data: bridge } = await supabase
    .from("bridge")
    .select("id")
    .eq("id", parseInt(bridgeId))
    .eq("site_id", parseInt(siteId))
    .single();

  if (!bridge) {
    return null;
  }

  return data;
}

async function updateCamera(cameraId: string, cameraName: string) {
  "use server";
  
  const supabase = await createClient();
  const { error } = await supabase
    .from("camera")
    .update({ camera_name: cameraName })
    .eq("id", parseInt(cameraId));

  if (error) {
    throw new Error(error.message);
  }
}

export default async function EditCameraPage({ params }: PageProps) {
  const { id, bridgeId, cameraId } = await params;
  const camera = await getCamera(id, bridgeId, cameraId);

  if (!camera) {
    notFound();
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    
    const cameraName = formData.get("camera_name") as string;
    
    if (!cameraName.trim()) {
      throw new Error("Camera name is required");
    }

    await updateCamera(cameraId, cameraName);
    redirect(`/sites/${id}`);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center gap-4">
          <Link href={`/sites/${id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Site
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Video className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold">Edit Camera</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Camera Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="camera_name">Camera Name</Label>
                    <Input
                      id="camera_name"
                      name="camera_name"
                      defaultValue={camera.camera_name}
                      placeholder="Enter camera name"
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit">Save Changes</Button>
                    <Link href={`/sites/${id}`}>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
