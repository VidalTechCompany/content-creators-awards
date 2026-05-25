/**
 * Seed Admin Role Script
 * 
 * Usage:
 *   npx tsx scripts/seed-admin.ts <user-email> [role]
 * 
 * Example:
 *   npx tsx scripts/seed-admin.ts admin@example.com super_admin
 *   npx tsx scripts/seed-admin.ts moderator@example.com moderator
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filename: string) {
    const filePath = path.resolve(process.cwd(), filename);
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const [key, ...rest] = trimmed.split("=");
        const value = rest.join("=").trim();
        if (key && value && process.env[key] === undefined) {
            process.env[key] = value.replace(/^"|"$/g, "");
        }
    }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

async function seedAdmin() {
    const email = process.argv[2];
    const role = (process.argv[3] as "super_admin" | "moderator") || "super_admin";

    if (!email) {
        console.error("❌ Usage: npx tsx scripts/seed-admin.ts <email> [role]");
        console.error("Example: npx tsx scripts/seed-admin.ts admin@example.com super_admin");
        process.exit(1);
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        console.error("❌ Missing environment variables:");
        console.error("  - NEXT_PUBLIC_SUPABASE_URL");
        console.error("  - SUPABASE_SERVICE_ROLE_KEY");
        process.exit(1);
    }

    const supabase = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    try {
        // Find user by email
        const { data: users, error: userError } = await supabase
            .from("auth.users")
            .select("id")
            .eq("email", email)
            .single();

        if (userError || !users) {
            console.error(`❌ User with email "${email}" not found`);
            console.error("Create the user first by signing up in the app");
            process.exit(1);
        }

        const userId = users.id;
        console.log(`✅ Found user: ${email} (${userId})`);

        // Insert or update admin role
        const { data, error } = await supabase
            .from("admins")
            .upsert(
                { user_id: userId, role },
                { onConflict: "user_id" }
            )
            .select();

        if (error) {
            console.error(`❌ Error seeding admin role: ${error.message}`);
            process.exit(1);
        }

        console.log(`✅ Successfully seeded admin role`);
        console.log(`   Email: ${email}`);
        console.log(`   Role: ${role}`);
        console.log(`   User ID: ${userId}`);
    } catch (err) {
        console.error("❌ Unexpected error:", err);
        process.exit(1);
    }
}

seedAdmin();
