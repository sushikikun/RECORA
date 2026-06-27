import "server-only";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import {
  NEXT_PUBLIC_SUPABASE_URL_ENV,
  SUPABASE_SERVICE_ROLE_KEY_ENV,
  SUPABASE_URL_ENV,
  getRecoraSupabaseReadConfig,
  hasSupabaseReadConfig,
  readEnv,
  readFirstEnv
} from "@/lib/supabase/env";

export { hasSupabaseReadConfig } from "@/lib/supabase/env";

type MutableCookieStore = {
  getAll: () => { name: string; value: string }[];
  set: (name: string, value: string, options?: CookieOptions) => void;
};

export function hasSupabaseConfig() {
  return hasSupabaseReadConfig();
}

export function hasSupabaseServiceRoleConfig() {
  return Boolean(
    readFirstEnv(SUPABASE_URL_ENV, NEXT_PUBLIC_SUPABASE_URL_ENV) && readEnv(SUPABASE_SERVICE_ROLE_KEY_ENV)
  );
}

export function createRecoraSupabaseClient(): SupabaseClient {
  const { supabaseUrl, supabaseKey } = getRecoraSupabaseReadConfig();

  return createRecoraSupabaseClientWithKey(supabaseUrl, supabaseKey);
}

export async function createRecoraSupabaseServerClient(): Promise<SupabaseClient> {
  const { supabaseUrl, supabaseKey } = getRecoraSupabaseReadConfig();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          const mutableCookieStore = cookieStore as MutableCookieStore;
          cookiesToSet.forEach(({ name, value, options }) => {
            mutableCookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; middleware refreshes auth cookies.
        }
      }
    }
  });
}

export function createRecoraSupabaseServiceRoleClient(): SupabaseClient {
  const supabaseUrl = readFirstEnv(SUPABASE_URL_ENV, NEXT_PUBLIC_SUPABASE_URL_ENV);
  const supabaseKey = readEnv(SUPABASE_SERVICE_ROLE_KEY_ENV);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing Supabase service-role environment variables: ${SUPABASE_URL_ENV}/${NEXT_PUBLIC_SUPABASE_URL_ENV} and ${SUPABASE_SERVICE_ROLE_KEY_ENV}.`
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
