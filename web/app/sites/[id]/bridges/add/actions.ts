"use server";

import { createClient } from "@/lib/supabase/server";

export async function findBridgeByAccessToken(accessToken: string) {
  const supabase = await createClient();

  // access_token 필드가 아직 데이터베이스에 없다면, 임시로 다른 방법을 사용
  // 실제로는 Supabase에서 bridge 테이블에 access_token 컬럼을 추가해야 합니다
  try {
    const { data, error } = await supabase
      .from("bridge")
      .select("*")
      .eq("access_token", accessToken)
      .is("site_id", null) // 아직 사이트에 연결되지 않은 bridge만
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  } catch (error) {
    // access_token 필드가 없는 경우를 위한 임시 처리
    console.warn(
      "access_token field not found in bridge table. Please add it to the database."
    );
    return null;
  }
}

export async function connectBridgeToSite(bridgeId: number, siteId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bridge")
    .update({ site_id: parseInt(siteId) })
    .eq("id", bridgeId);

  if (error) {
    throw new Error(error.message);
  }
}
