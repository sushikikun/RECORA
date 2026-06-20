import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL_ENV = "SUPABASE_URL";
const SUPABASE_ANON_KEY_ENV = "SUPABASE_ANON_KEY";
const SUPABASE_SERVICE_ROLE_KEY_ENV = "SUPABASE_SERVICE_ROLE_KEY";

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function hasSupabaseConfig() {
  return hasSupabaseReadConfig();
}

export function hasSupabaseReadConfig() {
  return Boolean(readEnv(SUPABASE_URL_ENV) && readEnv(SUPABASE_ANON_KEY_ENV));
}

export function hasSupabaseServiceRoleConfig() {
  return Boolean(readEnv(SUPABASE_URL_ENV) && readEnv(SUPABASE_SERVICE_ROLE_KEY_ENV));
}

export function createRecoraSupabaseClient(): SupabaseClient {
  const supabaseUrl = readEnv(SUPABASE_URL_ENV);
  const supabaseKey = readEnv(SUPABASE_ANON_KEY_ENV);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing Supabase read environment variables: ${SUPABASE_URL_ENV} and ${SUPABASE_ANON_KEY_ENV}. Dashboard reads must not fall back to ${SUPABASE_SERVICE_ROLE_KEY_ENV}.`
    );
  }

  return createRecoraSupabaseClientWithKey(supabaseUrl, supabaseKey);
}

export function createRecoraSupabaseServiceRoleClient(): SupabaseClient {
  const supabaseUrl = readEnv(SUPABASE_URL_ENV);
  const supabaseKey = readEnv(SUPABASE_SERVICE_ROLE_KEY_ENV);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing Supabase service-role environment variables: ${SUPABASE_URL_ENV} and ${SUPABASE_SERVICE_ROLE_KEY_ENV}.`
    );
  }

  return createRecoraSupabaseClientWithKey(supabaseUrl, supabaseKey);
}

function createRecoraSupabaseClientWithKey(supabaseUrl: string, supabaseKey: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    }
  });
}
