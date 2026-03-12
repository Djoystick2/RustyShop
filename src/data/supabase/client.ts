import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  getStorageBucketName as resolveStorageBucketName,
  getSupabaseRuntimeConfig,
  hasSupabaseRuntimeConfig
} from "../../config/runtime";
import type { Database } from "../../types/db";

let client: SupabaseClient<Database> | null = null;

export function hasSupabaseConfig(): boolean {
  return hasSupabaseRuntimeConfig();
}

export function getSupabaseClient(): SupabaseClient<Database> | null {
  const config = getSupabaseRuntimeConfig();
  if (!config.isConfigured) {
    return null;
  }

  if (client) {
    return client;
  }

  client = createClient<Database>(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  return client;
}

export function getStorageBucketName(): string {
  return resolveStorageBucketName();
}
