import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  console.log("OAuth callback received:", { code: !!code, next });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    console.log("Session exchange result:", { error: error?.message });

    if (!error) {
      // 성공적으로 로그인된 경우 next 파라미터가 있으면 그곳으로, 없으면 홈페이지로
      const redirectUrl = next.startsWith("/")
        ? `${origin}${next}`
        : `${origin}/`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  // 인증 실패 시 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/auth/login?error=auth_failed`);
}
