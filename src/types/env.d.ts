/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_SUPABASE_STORAGE_BUCKET?: string;
  readonly VITE_ENABLE_LOCAL_FALLBACK?: string;
  readonly VITE_TELEGRAM_AUTH_VERIFY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
