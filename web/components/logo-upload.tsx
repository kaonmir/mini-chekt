"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";

interface LogoUploadProps {
  currentLogoUrl?: string | null;
  onLogoUploaded: (logoUrl: string) => void;
  onLogoRemoved: () => void;
}

export default function LogoUpload({
  currentLogoUrl,
  onLogoUploaded,
  onLogoRemoved,
}: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentLogoUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setIsUploading(true);

    try {
      const supabase = createClient();

      // Check if user is authenticated
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Authentication required");
      }

      // Create a unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from("site-logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("site-logos").getPublicUrl(fileName);

      setPreviewUrl(publicUrl);
      onLogoUploaded(publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload logo. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!previewUrl) return;

    try {
      const supabase = createClient();

      // Extract filename from URL
      const urlParts = previewUrl.split("/");
      const fileName = urlParts[urlParts.length - 1];
      const userFolder = urlParts[urlParts.length - 2];
      const fullPath = `${userFolder}/${fileName}`;

      // Delete from storage
      await supabase.storage.from("site-logos").remove([fullPath]);

      setPreviewUrl(null);
      onLogoRemoved();
    } catch (error) {
      console.error("Delete error:", error);
      // Even if delete fails, remove from UI
      setPreviewUrl(null);
      onLogoRemoved();
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Label>Company Logo</Label>

      <div className="flex items-center gap-4">
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt="Company logo"
              className="w-20 h-20 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 w-6 h-6 p-0"
              onClick={handleRemoveLogo}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClick}
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {isUploading ? "Uploading..." : "Upload Logo"}
          </Button>

          <p className="text-xs text-muted-foreground">
            PNG, JPG, GIF up to 5MB
          </p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
