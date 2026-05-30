import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();

        // 1. Verify Session
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Check Permissions
        const role = user.app_metadata?.role;
        if (role !== "super_admin") {
            return NextResponse.json({ error: "Only Super Admins can delete subcategories" }, { status: 403 });
        }

        // 3. Delete from Database
        const { error } = await supabase
            .from("subcategories")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[SUBCATEGORIES_DELETE]", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}