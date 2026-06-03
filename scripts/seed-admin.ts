import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex > 0) {
        const key = trimmed.slice(0, equalIndex).trim();
        let val = trimmed.slice(equalIndex + 1).trim();
        // Strip surrounding quotes if present
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local");
  process.exit(1);
}

// Create Supabase client using the service role key to bypass RLS
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1] || "AdminPassword123!"; // Default fallback password if not provided
  const role = args[2] || "super_admin";

  if (!email) {
    console.log("Usage: npx tsx scripts/seed-admin.ts <email> [password] [role]");
    console.log("Example: npx tsx scripts/seed-admin.ts admin@example.com MySecurePassword123 super_admin");
    process.exit(1);
  }

  if (role !== "super_admin" && role !== "moderator") {
    console.error("Error: Role must be either 'super_admin' or 'moderator'");
    process.exit(1);
  }

  console.log(`Checking if user with email "${email}" exists...`);
  
  // 1. Check if user already exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to list users:", listError.message);
    process.exit(1);
  }

  let user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
  let userId: string;

  if (user) {
    console.log(`Found existing user with ID: ${user.id}`);
    userId = user.id;
  } else {
    console.log(`User not found. Creating user "${email}"...`);
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError) {
      console.error("Failed to create user:", createError.message);
      process.exit(1);
    }

    if (!newUser.user) {
      console.error("Failed to create user: No user object returned");
      process.exit(1);
    }

    console.log(`Successfully created new user with ID: ${newUser.user.id}`);
    console.log(`Temporary Password: ${password}`);
    userId = newUser.user.id;
  }

  // 2. Insert into admins table
  console.log(`Promoting user ${userId} to role "${role}"...`);
  const { error: dbError } = await supabase
    .from("admins")
    .upsert({ user_id: userId, role })
    .select();

  if (dbError) {
    console.error("Failed to insert admin role:", dbError.message);
    process.exit(1);
  }

  console.log(`\n🎉 Success! User "${email}" is now a "${role}".`);
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
