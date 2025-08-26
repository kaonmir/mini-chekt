"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Github } from "lucide-react";

export function LoginForm({
  className,
  error: initialError,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { error?: string }) {
  const [error, setError] = useState<string | null>(initialError || null);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const router = useRouter();

  const handleGithubLogin = async () => {
    const supabase = createClient();
    setIsGithubLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/monitoring`,
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
      setIsGithubLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welcome</CardTitle>
          <CardDescription>Sign in to your account with GitHub</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* GitHub Login Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGithubLogin}
              disabled={isGithubLoading}
            >
              <Github className="mr-2 h-4 w-4" />
              {isGithubLoading
                ? "Signing in with GitHub..."
                : "Sign in with GitHub"}
            </Button>
            {error && (
              <p className="text-sm text-red-500 text-center">
                {error === "auth_failed"
                  ? "인증에 실패했습니다. 다시 시도해주세요."
                  : error}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
