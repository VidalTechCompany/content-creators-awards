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
  console.error("Error: Missing env variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkDb() {
  console.log("--- Supabase Admin Database Diagnostics ---");
  
  // 1. Fetch all auth users
  console.log("\nListing users in auth.users:");
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Failed to list auth users:", authError.message);
  } else {
    users.forEach((u) => {
      console.log(`- ID: ${u.id} | Email: ${u.email} | Created At: ${u.created_at}`);
    });
  }

  // 2. Fetch all public.admins rows
  console.log("\nListing rows in public.admins:");
  const { data: admins, error: adminDbError } = await supabase
    .from("admins")
    .select("*");
  
  if (adminDbError) {
    console.error("Failed to query public.admins:", adminDbError.message);
  } else {
    if (admins.length === 0) {
      console.log("(No rows found in public.admins table)");
    } else {
      admins.forEach((a) => {
        console.log(`- User ID: ${a.user_id} | Role: ${a.role} | Created At: ${a.created_at}`);
      });
    }
  }

  // 3. Fetch all public.profiles rows
  console.log("\nListing rows in public.profiles:");
  const { data: profiles, error: profilesDbError } = await supabase
    .from("profiles")
    .select("*");
  
  if (profilesDbError) {
    console.error("Failed to query public.profiles:", profilesDbError.message);
  } else {
    if (profiles.length === 0) {
      console.log("(No rows found in public.profiles table)");
    } else {
      profiles.forEach((p) => {
        console.log(`- ID: ${p.id} | Email: ${p.email} | Display Name: ${p.display_name}`);
      });
    }
  }
}

checkDb();
