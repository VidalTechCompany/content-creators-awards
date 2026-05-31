import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

// GET: Fetch all categories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get("section");
    // Default to true for admin view; only filter if explicitly set to "false"
    const includeInactive = searchParams.get("includeInactive") !== "false";

    const supabase = createServiceClient();

    let query = supabase
      .from("categories")
      .select(`
        *,
        subcategories(*),
        nominees:nominees(
          id,
          name,
          status
        )
      `)
      .order("sort_order", { ascending: true, nullsFirst: false })
      .order("title", { ascending: true });

    // Filter by section if provided
    if (section && section !== "") {
      query = query.eq("section", section);
    }

    // Filter inactive categories unless explicitly requested
    if (!includeInactive) {
      query = query.eq("status", "active");
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error("[CATEGORIES_API] Fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch categories", details: error.message },
        { status: 500 }
      );
    }

    // Transform data to include nominee counts
    const categoriesWithStats = categories?.map(category => ({
      ...category,
      // Ensure counts are robust even if nominees join is empty
      nomineeCount: Array.isArray(category.nominees) ? category.nominees.length : 0,
      approvedNomineeCount: Array.isArray(category.nominees)
        ? category.nominees.filter((n: unknown) => (n as { status?: string }).status === "approved").length
        : 0,
      nominees: undefined // Payload optimization
    })) || [];

    return NextResponse.json({
      success: true,
      categories: categoriesWithStats,
      count: categoriesWithStats.length
    });

  } catch (error) {
    console.error("[CATEGORIES_API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
  });
}

// POST: Create a new category (your existing code, fixed)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug, section, description, sort_order, status } = body;

    // Enhanced validation
    if (!title || !slug) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          required: ["title", "slug"],
          received: Object.keys(body)
        },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const supabase = createServiceClient();

    const { data: existing, error: checkError } = await supabase
      .from("categories")
      .select("slug")
      .eq("slug", slug)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("[CATEGORIES_API] Slug check error:", checkError);
    }

    if (existing) {
      return NextResponse.json(
        { error: `Category with slug "${slug}" already exists` },
        { status: 409 }
      );
    }

    // Insert new category
    const { data, error } = await supabase
      .from("categories")
      .insert({
        title: title.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, '-'),
        section: section || "General",
        description: description?.trim() || null,
        sort_order: sort_order !== undefined ? sort_order : 999,
        status: status || "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("[CATEGORIES_API] Insert error:", error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data,
      message: "Category created successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("[CATEGORIES_API] Request parsing error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// PATCH: Update a category (Renamed from PUT to match frontend calls)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, title, slug, section, description, sort_order, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required for update" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if category exists
    const { data: existing, error: findError } = await supabase
      .from("categories")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (findError || !existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Update category
    const { data, error } = await supabase
      .from("categories")
      .update({
        title: title?.trim(),
        slug: slug?.trim().toLowerCase().replace(/\s+/g, '-'),
        section: section,
        description: description?.trim(),
        sort_order: sort_order,
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[CATEGORIES_API] Update error:", error);
      return NextResponse.json(
        { error: `Update failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      category: data,
      message: "Category updated successfully"
    });

  } catch (error) {
    console.error("[CATEGORIES_API] Update error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

// DELETE: Remove a category
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Category ID is required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if category has votes
    const { count: votesCount, error: votesError } = await supabase
      .from("votes")
      .select("id", { count: "exact", head: true })
      .eq("category_id", id);

    if (votesError) {
      console.error("[CATEGORIES_API] Votes check error:", votesError);
    }

    if (votesCount && votesCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with existing votes",
          votesCount
        },
        { status: 409 }
      );
    }

    // Delete category
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[CATEGORIES_API] Delete error:", error);
      return NextResponse.json(
        { error: `Delete failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully"
    });

  } catch (error) {
    console.error("[CATEGORIES_API] Delete error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}