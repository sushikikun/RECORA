import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL_ENV = "SUPABASE_URL";
const SUPABASE_ANON_KEY_ENV = "SUPABASE_ANON_KEY";

export function hasSupabaseConfig() {
  return Boolean(process.env[SUPABASE_URL_ENV] && process.env[SUPABASE_ANON_KEY_ENV]);
}

export function createRecoraSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env[SUPABASE_URL_ENV];
  const supabaseAnonKey = process.env[SUPABASE_ANON_KEY_ENV];

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      `Missing Supabase environment variables: ${SUPABASE_URL_ENV} and ${SUPABASE_ANON_KEY_ENV}.`
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}
