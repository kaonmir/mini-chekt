import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> } // params is Promise now
) {
  try {
    const { id } = await context.params; // await params here

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("camera")
      .update({
        username,
        password,
        is_registered: true,
      })
      .eq("id", parseInt(id))
      .select()
      .single();

    if (error) {
      console.error("Error registering camera:", error);
      return NextResponse.json(
        { error: "Failed to register camera" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, camera: data });
  } catch (error) {
    console.error("Error in register camera API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
