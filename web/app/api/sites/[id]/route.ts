import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { UpdateTable } from "@/lib/database";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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
      .eq("id", parseInt(id))
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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
    const siteData: UpdateTable<"site"> = {
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
      .update(siteData)
      .eq("id", parseInt(id))
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

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
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

    const { error } = await supabase
      .from("site")
      .delete()
      .eq("id", parseInt(id));

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
