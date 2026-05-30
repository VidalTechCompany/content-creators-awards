import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  try {
    const { title, slug, section, description } = await request.json();

    if (!title || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("categories")
      .insert({
        title,
        slug,
        section: section || "General",
        description: description || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ category: data });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}