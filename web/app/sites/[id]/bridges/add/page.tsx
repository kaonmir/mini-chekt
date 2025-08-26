"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wifi, ArrowLeft, Key, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { findBridgeByAccessToken, connectBridgeToSite } from "./actions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function AddBridgePage({ params }: PageProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);
  const router = useRouter();

  // Initialize siteId when component mounts
  useEffect(() => {
    params.then(({ id }) => setSiteId(id));
  }, [params]);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const { id } = await params;
      const accessToken = formData.get("access_token") as string;

      if (!accessToken.trim()) {
        setError("Access token is required");
        return;
      }

      // Access token으로 bridge 찾기
      const bridge = await findBridgeByAccessToken(accessToken);

      if (!bridge) {
        setError("Valid bridge not found. Please check your access token.");
        return;
      }

      // Bridge를 현재 사이트에 연결
      await connectBridgeToSite(bridge.id, id);

      router.push(`/sites/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  if (!siteId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-border p-6">
        <div className="flex items-center gap-4">
          <Link href={`/sites/${siteId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Site
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Wifi className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Add Bridge</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Enter Bridge Access Token
                </CardTitle>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-red-800 text-sm">{error}</span>
                  </div>
                )}

                <form action={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="access_token">Access Token</Label>
                    <Input
                      id="access_token"
                      name="access_token"
                      type="password"
                      placeholder="Enter bridge access token"
                      required
                    />
                    <p className="text-sm text-muted-foreground">
                      Enter the access token provided with your bridge device.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Connecting..." : "Connect Bridge"}
                    </Button>
                    <Link href={`/sites/${siteId}`}>
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
