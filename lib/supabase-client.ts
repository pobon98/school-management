// lib/supabase-client.ts
import { createClient } from "@supabase/supabase-js";

// These values MUST exist in your .env file:
//
// NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
// NEXT_PUBLIC_SUPABASE_ANON_KEY="pk_XXXXXXXX"
//
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // keeps user logged in across refresh
    autoRefreshToken: true, // refreshes session automatically
  },
});
