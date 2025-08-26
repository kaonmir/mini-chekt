import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  // 이미 로그인된 사용자는 홈페이지로 리다이렉트
  if (data?.claims) {
    redirect("/");
  }

  const { error } = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm error={error} />
      </div>
    </div>
  );
}
