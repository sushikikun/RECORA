export const SUPABASE_URL_ENV = "SUPABASE_URL";
export const SUPABASE_ANON_KEY_ENV = "SUPABASE_ANON_KEY";
export const NEXT_PUBLIC_SUPABASE_URL_ENV = "NEXT_PUBLIC_SUPABASE_URL";
export const NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV = "NEXT_PUBLIC_SUPABASE_ANON_KEY";
export const SUPABASE_SERVICE_ROLE_KEY_ENV = "SUPABASE_SERVICE_ROLE_KEY";

export type RecoraSupabaseReadConfig = {
  supabaseUrl: string;
  supabaseKey: string;
};

export function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function readFirstEnv(...names: string[]) {
  for (const name of names) {
    const value = readEnv(name);
    if (value) return value;
  }

  return undefined;
}

export function hasSupabaseReadConfig() {
  return Boolean(
    readFirstEnv(SUPABASE_URL_ENV, NEXT_PUBLIC_SUPABASE_URL_ENV) &&
      readFirstEnv(SUPABASE_ANON_KEY_ENV, NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV)
  );
}

export function getRecoraSupabaseReadConfig(): RecoraSupabaseReadConfig {
  const supabaseUrl = readFirstEnv(SUPABASE_URL_ENV, NEXT_PUBLIC_SUPABASE_URL_ENV);
  const supabaseKey = readFirstEnv(SUPABASE_ANON_KEY_ENV, NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      `Missing Supabase read environment variables: ${SUPABASE_URL_ENV}/${NEXT_PUBLIC_SUPABASE_URL_ENV} and ${SUPABASE_ANON_KEY_ENV}/${NEXT_PUBLIC_SUPABASE_ANON_KEY_ENV}. Dashboard reads must not fall back to ${SUPABASE_SERVICE_ROLE_KEY_ENV}.`
    );
  }

  return { supabaseUrl, supabaseKey };
}
