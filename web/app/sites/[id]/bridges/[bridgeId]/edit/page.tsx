import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
    bridgeId: string;
  }>;
}

async function getBridge(siteId: string, bridgeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bridge")
    .select("*")
    .eq("id", parseInt(bridgeId))
    .eq("site_id", parseInt(siteId))
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

async function updateBridge(bridgeId: string, bridgeName: string) {
  "use server";
  
  const supabase = await createClient();
  const { error } = await supabase
    .from("bridge")
    .update({ bridge_name: bridgeName })
    .eq("id", parseInt(bridgeId));

  if (error) {
    throw new Error(error.message);
  }
}

export default async function EditBridgePage({ params }: PageProps) {
  const { id, bridgeId } = await params;
  const bridge = await getBridge(id, bridgeId);

  if (!bridge) {
    notFound();
  }

  async function handleSubmit(formData: FormData) {
    "use server";
    
    const bridgeName = formData.get("bridge_name") as string;
    
    if (!bridgeName.trim()) {
      throw new Error("Bridge name is required");
    }

    await updateBridge(bridgeId, bridgeName);
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
            <Wifi className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Edit Bridge</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Bridge Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form action={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="bridge_name">Bridge Name</Label>
                    <Input
                      id="bridge_name"
                      name="bridge_name"
                      defaultValue={bridge.bridge_name}
                      placeholder="Enter bridge name"
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
