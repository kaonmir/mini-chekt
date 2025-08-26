"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Camera, CheckCircle, AlertCircle } from "lucide-react";

interface Bridge {
  id: number;
  bridge_name: string;
  site_id: number;
}

interface Camera {
  id: number;
  camera_name: string;
  bridge_id: number;
  is_registered: boolean;
}

interface Site {
  id: number;
  site_name: string;
}

interface AddCameraClientProps {
  site: Site;
  bridges: Bridge[];
  availableCameras: Camera[];
  selectedBridgeId: number | null;
}

export default function AddCameraClient({
  site,
  bridges,
  availableCameras,
  selectedBridgeId,
}: AddCameraClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(selectedBridgeId ? 2 : 1);
  const [selectedBridge, setSelectedBridge] = useState<Bridge | null>(
    selectedBridgeId
      ? bridges.find((b) => b.id === selectedBridgeId) || null
      : null
  );
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleBridgeSelect = (bridgeId: string) => {
    const bridge = bridges.find((b) => b.id === parseInt(bridgeId));
    setSelectedBridge(bridge || null);
    setStep(2);
    // Update URL with bridgeId
    router.push(`/sites/${site.id}/add-camera?bridgeId=${bridgeId}`);
  };

  const handleCameraSelect = (cameraId: string) => {
    const camera = availableCameras.find((c) => c.id === parseInt(cameraId));
    setSelectedCamera(camera || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCamera || !username || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/cameras/${selectedCamera.id}/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
            password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to register camera");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/sites/${site.id}`);
      }, 2000);
    } catch (err) {
      setError("Failed to register camera. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedBridge(null);
      setSelectedCamera(null);
      setUsername("");
      setPassword("");
      setError("");
      router.push(`/sites/${site.id}/add-camera`);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                Camera Registered Successfully!
              </h2>
              <p className="text-gray-600">Redirecting to site page...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/sites/${site.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Site
          </Button>
          <h1 className="text-3xl font-bold">Add Camera</h1>
          <p className="text-gray-600 mt-2">Site: {site.site_name}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center mb-8">
          <div
            className={`flex items-center ${
              step >= 1 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300"
              }`}
            >
              1
            </div>
            <span className="ml-2 font-medium">Select Camera</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4"></div>
          <div
            className={`flex items-center ${
              step >= 2 ? "text-blue-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300"
              }`}
            >
              2
            </div>
            <span className="ml-2 font-medium">Enter Credentials</span>
          </div>
        </div>

        {/* Step 1: Select Bridge and Camera */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Step 1: Select Camera
              </CardTitle>
              <CardDescription>
                Choose a bridge and select an available camera to register
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="bridge">Select Bridge</Label>
                  <Select onValueChange={handleBridgeSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a bridge" />
                    </SelectTrigger>
                    <SelectContent>
                      {bridges.map((bridge) => (
                        <SelectItem
                          key={bridge.id}
                          value={bridge.id.toString()}
                        >
                          {bridge.bridge_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Enter Credentials */}
        {step === 2 && selectedBridge && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="h-5 w-5 mr-2" />
                Step 2: Enter Camera Credentials
              </CardTitle>
              <CardDescription>
                Bridge: {selectedBridge.bridge_name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="camera">Select Camera</Label>
                  <Select onValueChange={handleCameraSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCameras.map((camera) => (
                        <SelectItem
                          key={camera.id}
                          value={camera.id.toString()}
                        >
                          {camera.camera_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {availableCameras.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      No available cameras found for this bridge.
                    </p>
                  )}
                </div>

                {selectedCamera && (
                  <>
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter camera username"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter camera password"
                        required
                      />
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={isLoading}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={isLoading || !username || !password}
                        className="flex-1"
                      >
                        {isLoading ? "Registering..." : "Register Camera"}
                      </Button>
                    </div>
                  </>
                )}
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
