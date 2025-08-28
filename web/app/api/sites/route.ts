import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { InsertTable } from "@/lib/database";

export async function GET() {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("site")
      .select("*")
      .order("site_name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const siteData: InsertTable<"site"> = {
      site_name: formData.get("site_name") as string,
      contact_name: (formData.get("contact_name") as string) || null,
      contact_phone: (formData.get("contact_phone") as string) || null,
      logo_url: (formData.get("logo_url") as string) || null,
    };

    if (!siteData.site_name) {
      return NextResponse.json(
        { error: "Site name is required" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("site")
      .insert(siteData)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.redirect(new URL("/sites", request.url));
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
