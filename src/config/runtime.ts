const DEFAULT_STORAGE_BUCKET = "product-images";
const DEFAULT_TELEGRAM_VERIFY_ENDPOINT = "/api/telegram/verify";

function readEnv(name: keyof ImportMetaEnv): string {
  return import.meta.env[name]?.trim() ?? "";
}

function isFalseLike(value: string): boolean {
  return value.toLowerCase() === "false" || value === "0" || value.toLowerCase() === "no";
}

export type RepositoryRuntimeMode = "supabase" | "local_fallback" | "unavailable";
export type TelegramVerifyEndpointSource = "env" | "fallback";

export interface SupabaseRuntimeConfig {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  missingVars: Array<"VITE_SUPABASE_URL" | "VITE_SUPABASE_ANON_KEY">;
}

export interface TelegramVerifyConfig {
  endpoint: string;
  source: TelegramVerifyEndpointSource;
}

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig {
  const url = readEnv("VITE_SUPABASE_URL");
  const anonKey = readEnv("VITE_SUPABASE_ANON_KEY");
  const missingVars: SupabaseRuntimeConfig["missingVars"] = [];

  if (!url) {
    missingVars.push("VITE_SUPABASE_URL");
  }
  if (!anonKey) {
    missingVars.push("VITE_SUPABASE_ANON_KEY");
  }

  return {
    url,
    anonKey,
    isConfigured: missingVars.length === 0,
    missingVars
  };
}

export function isLocalFallbackEnabled(): boolean {
  const raw = readEnv("VITE_ENABLE_LOCAL_FALLBACK");
  if (!raw) {
    return true;
  }
  return !isFalseLike(raw);
}

export function resolveRepositoryRuntimeMode(): RepositoryRuntimeMode {
  const supabase = getSupabaseRuntimeConfig();
  if (supabase.isConfigured) {
    return "supabase";
  }
  if (isLocalFallbackEnabled()) {
    return "local_fallback";
  }
  return "unavailable";
}

export function getRepositoryUnavailableReason(): string {
  const supabase = getSupabaseRuntimeConfig();
  const missingList = supabase.missingVars.join(", ");
  return [
    "Supabase mode is not configured and local fallback is disabled.",
    missingList ? `Missing env: ${missingList}.` : "",
    "Set required Supabase env vars or enable VITE_ENABLE_LOCAL_FALLBACK=true."
  ]
    .filter(Boolean)
    .join(" ");
}

export function hasSupabaseRuntimeConfig(): boolean {
  return getSupabaseRuntimeConfig().isConfigured;
}

export function getStorageBucketName(): string {
  return readEnv("VITE_SUPABASE_STORAGE_BUCKET") || DEFAULT_STORAGE_BUCKET;
}

export function isDefaultStorageBucket(): boolean {
  return getStorageBucketName() === DEFAULT_STORAGE_BUCKET;
}

export function getTelegramVerifyConfig(): TelegramVerifyConfig {
  const explicitEndpoint = readEnv("VITE_TELEGRAM_AUTH_VERIFY_URL");
  if (explicitEndpoint) {
    return {
      endpoint: explicitEndpoint,
      source: "env"
    };
  }

  return {
    endpoint: DEFAULT_TELEGRAM_VERIFY_ENDPOINT,
    source: "fallback"
  };
}

export function getTelegramVerifyEndpoint(): string {
  return getTelegramVerifyConfig().endpoint;
}

export function hasExplicitTelegramVerifyEndpoint(): boolean {
  return getTelegramVerifyConfig().source === "env";
}

